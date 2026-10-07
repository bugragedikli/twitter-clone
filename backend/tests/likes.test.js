import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { resetDb } from './helpers/db.js';
import { createUser } from './helpers/users.js';
import pool from '../src/config/database.js';

beforeEach(async () => {
    await resetDb();
});

describe('POST /chirps/:chirpId/likes', () => {
    it('returns 401 if user has no token', async () => {
        const response = await request(app)
            .post('/chirps/1/likes')
            .send();

        expect(response.status).toBe(401);
    });

    it('returns 401 if user has invalid token', async () => {
        const response = await request(app)
            .post('/chirps/1/likes')
            .set('Cookie', 'token=invalidtoken');

        expect(response.status).toBe(401);
    });

    it('returns 401 when the user no longer exists', async () => {
        const { agent, user } = await createUser('testuser');
        await pool.query('DELETE FROM users WHERE id = $1', [user.id]);

        const response = await agent.post('/chirps/1/likes');

        expect(response.status).toBe(401);
    });

    it('returns 201 when a like is successfully created', async () => {
        const agent = request.agent(app);
        await agent.post('/auth/register').send({ username: 'testuser', email: 'testuser@test.com', password: 'secret123' });

        const chirp = await agent.post('/chirps').send({ content: 'This is a test chirp' });

        const response = await agent.post(`/chirps/${chirp.body.id}/likes`).send();
        expect(response.status).toBe(201);

        const fetched = await agent.get(`/chirps/${chirp.body.id}`);
        expect(fetched.body.like_count).toBe(1);
        expect(fetched.body.liked_by_me).toBe(true);
    });

    it('returns 409 when trying to like a chirp that is already liked', async () => {
        const agent = request.agent(app);
        await agent.post('/auth/register').send({ username: 'testuser', email: 'testuser@test.com', password: 'secret123' });

        const chirp = await agent.post('/chirps').send({ content: 'This is a test chirp' });

        await agent.post(`/chirps/${chirp.body.id}/likes`).send();
        const response = await agent.post(`/chirps/${chirp.body.id}/likes`).send();

        expect(response.status).toBe(409);
    });

    it('returns 404 when trying to like a non-existent chirp', async () => {
        const agent = request.agent(app);
        await agent.post('/auth/register').send({ username: 'testuser', email: 'testuser@test.com', password: 'secret123' });

        const response = await agent.post('/chirps/999/likes').send();

        expect(response.status).toBe(404);
    });

    it('returns 400 when trying to like a chirp with an invalid ID', async () => {
        const agent = request.agent(app);
        await agent.post('/auth/register').send({ username: 'testuser', email: 'testuser@test.com', password: 'secret123' });

        const response = await agent.post('/chirps/invalid/likes').send();

        expect(response.status).toBe(400);
    });
});

describe('DELETE /chirps/:chirpId/likes', () => {
    it('deletes a like successfully', async () => {
        const agent = request.agent(app);
        await agent.post('/auth/register').send({ username: 'testuser', email: 'testuser@test.com', password: 'secret123' });

        const chirp = await agent.post('/chirps').send({ content: 'This is a test chirp' });

        await agent.post(`/chirps/${chirp.body.id}/likes`).send();

        const response = await agent.delete(`/chirps/${chirp.body.id}/likes`).send();

        const fetched = await agent.get(`/chirps/${chirp.body.id}`);
        expect(fetched.body.like_count).toBe(0);
        expect(fetched.body.liked_by_me).toBe(false);
        expect(response.status).toBe(200);
    });

    it('returns 404 when trying to delete a like that does not exist', async () => {
        const agent = request.agent(app);
        await agent.post('/auth/register').send({ username: 'testuser', email: 'testuser@test.com', password: 'secret123' });

        const response = await agent.delete('/chirps/1/likes').send();

        expect(response.status).toBe(404);
    });

    it('returns 401 when trying to delete a like without a token', async () => {
        const response = await request(app)
            .delete('/chirps/1/likes')
            .send();

        expect(response.status).toBe(401);
    });

    it('does not allow a user to delete a like that belongs to another user', async () => {
        const agent1 = request.agent(app);
        await agent1.post('/auth/register').send({ username: 'user1', email: 'user1@test.com', password: 'secret123' });
        const agent2 = request.agent(app);
        await agent2.post('/auth/register').send({ username: 'user2', email: 'user2@test.com', password: 'secret123' });

        const chirp = await agent1.post('/chirps').send({ content: 'This is a test chirp' });

        await agent1.post(`/chirps/${chirp.body.id}/likes`).send();

        const response = await agent2.delete(`/chirps/${chirp.body.id}/likes`).send();

        const fetched = await agent1.get(`/chirps/${chirp.body.id}`);
        expect(fetched.body.like_count).toBe(1);
        expect(fetched.body.liked_by_me).toBe(true);
        expect(response.status).toBe(404);
    });
});