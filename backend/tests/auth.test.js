import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import jwt from 'jsonwebtoken';
import { resetDb } from './helpers/db.js';
import pool from '../src/config/database.js';

const validUser = { username: 'testuser', email: 'testuser@test.com', password: 'secret123' };

beforeEach(async () => {
    await resetDb();
});

describe('POST /auth/register', () => {
    it('creates the user and sets a token cookie', async () => {
        const res = await request(app).post('/auth/register').send(validUser);

        expect(res.status).toBe(201);
        expect(res.body.user).toMatchObject({ username: 'testuser', email: 'testuser@test.com' });
        expect(res.body.user.password_hash).toBeUndefined();
        expect(res.headers['set-cookie'][0]).toMatch(/^token=/);
    });

    it('does not have the password in the response', async () => {
        const res = await request(app).post('/auth/register').send(validUser);

        expect(res.body.user.password_hash).toBeUndefined();
    });

    it('does not provided username' , async () => {
        const res = await request(app).post('/auth/register').send({ email: 'testuser@test.com', password: 'secret123' });

        expect(res.status).toBe(400);
    });

    it('does not provided email' , async () => {
        const res = await request(app).post('/auth/register').send({ username: 'testuser', password: 'secret123' });

        expect(res.status).toBe(400);
    });

    it('does not provided password' , async () => {
        const res = await request(app).post('/auth/register').send({ username: 'testuser', email: 'bugra@test.com' });

        expect(res.status).toBe(400);
    });

    it('rejects a duplicate email', async () => {
        await request(app).post('/auth/register').send(validUser);

        const res = await request(app).post('/auth/register').send(validUser);

        expect(res.status).toBe(400);
        expect(res.body.message).toBe('An account with this email already exists. Try signing in instead.');
    });

    it('rejects a duplicate username', async () => {
        await request(app).post('/auth/register').send(validUser);

        const res = await request(app).post('/auth/register').send({ username: 'testuser', email: 'testuser2@test.com', password: 'secret123' });

        expect(res.status).toBe(400);
        expect(res.body.message).toBe('This username is already taken. Please choose another one.');
    });

    it('stores the password as a bcrypt hash, not plain text', async () => {
        await request(app).post('/auth/register').send(validUser);

        const { rows } = await pool.query('SELECT password_hash FROM users WHERE email = $1', [validUser.email]);

        expect(rows[0].password_hash).not.toBe(validUser.password);
        expect(rows[0].password_hash).toMatch(/^\$2[aby]\$/);
    });

    it('sets the token cookie as HttpOnly and SameSite=Strict', async () => {
        const res = await request(app).post('/auth/register').send(validUser);

        const cookie = res.get('Set-Cookie')[0];
        expect(cookie).toMatch(/HttpOnly/i);
        expect(cookie).toMatch(/SameSite=Strict/i);
    });

    it('treats emails case-insensitively when checking duplicates', async () => {
        await request(app).post('/auth/register').send(validUser);

        const res = await request(app).post('/auth/register').send({
            ...validUser,
            username: 'otheruser',
            email: 'TestUser@Test.com',
        });

        expect(res.status).toBe(400);
    });

    it.each([
        ['too long', 'a'.repeat(16)],
        ['too short', 'ab'],
        ['containing a space', 'test user'],
        ['containing a symbol', 'test-user!'],
    ])('returns 400 for a username %s', async (_name, username) => {
        const res = await request(app).post('/auth/register').send({ ...validUser, username });

        expect(res.status).toBe(400);
    });

    it.each(['login', 'register', 'Login', 'SETTINGS'])('rejects the reserved username "%s"', async (username) => {
        const res = await request(app).post('/auth/register').send({ ...validUser, username });

        expect(res.status).toBe(400);
        expect(res.body.message).toBe('This username is not available. Please choose another one.');
    });

    it('allows usernames that only contain a reserved word', async () => {
        const res = await request(app).post('/auth/register').send({ ...validUser, username: 'login_fan' });

        expect(res.status).toBe(201);
    });

    it('returns 400 for a password shorter than 8 characters', async () => {
        const res = await request(app).post('/auth/register').send({ ...validUser, password: 'short' });

        expect(res.status).toBe(400);
    });
});

describe('POST /auth/login', () => {
    beforeEach(async () => {
        await request(app).post('/auth/register').send(validUser);
    });

    it('logs in with the correct password', async () => {
        const res = await request(app)
            .post('/auth/login')
            .send({ email: validUser.email, password: validUser.password });

        expect(res.status).toBe(200);
        expect(res.body.user.username).toBe('testuser');
    });

    it('sets a token cookie on successful login', async () => {
        const res = await request(app)
            .post('/auth/login')
            .send({ email: validUser.email, password: validUser.password });

        expect(res.status).toBe(200);
        expect(res.get('Set-Cookie')).toBeDefined();
    });

    it('rejects a wrong password', async () => {
        const res = await request(app)
            .post('/auth/login')
            .send({ email: validUser.email, password: 'wrong' });

        expect(res.status).toBe(400);
    });

    it('rejects a non-existent email', async () => {
        const res = await request(app)
            .post('/auth/login')
            .send({ email: 'nonexistent@test.com', password: 'secret123' });

        expect(res.status).toBe(400);
    });

    it('returns the same message for a wrong password and an unknown email', async () => {
        const wrongPassword = await request(app)
            .post('/auth/login')
            .send({ email: validUser.email, password: 'wrong' });
        const unknownEmail = await request(app)
            .post('/auth/login')
            .send({ email: 'nonexistent@test.com', password: 'secret123' });

        expect(wrongPassword.body.message).toBe(unknownEmail.body.message);
    });

    it('rejects missing email', async () => {
        const res = await request(app)
            .post('/auth/login')
            .send({ password: 'secret123' });

        expect(res.status).toBe(400);
    });

    it('rejects missing password', async () => {
        const res = await request(app)
            .post('/auth/login')
            .send({ email: 'testuser@test.com' });

        expect(res.status).toBe(400);
    });

    it('does not return the password hash in the response', async () => {
        const res = await request(app)
            .post('/auth/login')
            .send({ email: validUser.email, password: validUser.password });

        expect(res.body.user.password_hash).toBeUndefined();
    });
});

describe('GET /auth/me', () => {
    it('returns the logged-in user when the cookie is sent', async () => {
        const agent = request.agent(app);
        await agent.post('/auth/register').send(validUser);

        const res = await agent.get('/auth/me');

        expect(res.status).toBe(200);
        expect(res.body.username).toBe('testuser');
        expect(res.body.password_hash).toBeUndefined();
    });

    it('returns 401 when no cookie is sent', async () => {
        const res = await request(app).get('/auth/me');

        expect(res.status).toBe(401);
    });

    it('returns 401 when an invalid cookie is sent', async () => {
        const res = await request(app)
            .get('/auth/me')
            .set('Cookie', 'token=invalidtoken');

        expect(res.status).toBe(401);
    });

    it('returns 401 when the user no longer exists', async () => {
        const agent = request.agent(app);
        const { body } = await agent.post('/auth/register').send(validUser);
        await pool.query('DELETE FROM users WHERE id = $1', [body.user.id]);

        const res = await agent.get('/auth/me');

        expect(res.status).toBe(401);
        expect(res.body.message).toBe('Not authorized, user not found');
    });

    it('returns 401 for an expired token', async () => {
        const { body } = await request(app).post('/auth/register').send(validUser);
        const expired = jwt.sign({ id: body.user.id }, process.env.JWT_SECRET, { expiresIn: -1 });

        const res = await request(app)
            .get('/auth/me')
            .set('Cookie', `token=${expired}`);

        expect(res.status).toBe(401);
    });

    it('does not return the password hash in the response', async () => {
        const agent = request.agent(app);
        await agent.post('/auth/register').send(validUser);

        const res = await agent.get('/auth/me');

        expect(res.body.password_hash).toBeUndefined();
    });
});

describe('POST /auth/logout', () => {
    it('clears the token cookie', async () => {
        const agent = request.agent(app);
        await agent.post('/auth/register').send(validUser);

        const res = await agent.post('/auth/logout');

        expect(res.status).toBe(200);
        expect(res.get('Set-Cookie')[0]).toMatch(/token=;/);
    });

    it('after logout, /auth/me returns 401', async () => {
        const agent = request.agent(app);
        await agent.post('/auth/register').send(validUser);
        await agent.post('/auth/logout');

        const res = await agent.get('/auth/me');

        expect(res.status).toBe(401);
    });
});
