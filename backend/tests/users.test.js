import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { resetDb } from './helpers/db.js';
import { createUser } from './helpers/users.js';
import pool from '../src/config/database.js';

beforeEach(async () => {
    await resetDb();
});

// Collects every page of a cursor-paginated endpoint
async function getAllPages(agent, url, key, limit = 2) {
    const items = [];
    let cursor = null;
    do {
        const res = await agent.get(url).query({ limit, ...(cursor && { before: cursor }) });
        items.push(...res.body[key]);
        cursor = res.body.nextCursor;
    } while (cursor);
    return items;
}

describe('GET /users/:username', () => {
    it('returns the user', async () => {
        await createUser('user1');

        const res = await request(app).get('/users/user1');

        expect(res.status).toBe(200);
        expect(res.body.username).toBe('user1');
    });

    it('returns 404 for a user that does not exist', async () => {
        const res = await request(app).get('/users/nobody');

        expect(res.status).toBe(404);
    });

    it('does not expose password_hash', async () => {
        await createUser('user1');

        const res = await request(app).get('/users/user1');

        expect(res.body.password_hash).toBeUndefined();
    });

    it("does not expose another user's email", async () => {
        await createUser('user1');

        const res = await request(app).get('/users/user1');

        expect(res.body.email).toBeUndefined();
    });

    it('returns correct counts, including replies in chirps_count', async () => {
        const { agent: user1, user: u1 } = await createUser('user1');
        const { agent: user2, user: u2 } = await createUser('user2');
        const { agent: user3 } = await createUser('user3');

        const { body: chirp } = await user1.post('/chirps').send({ content: 'chirp' });
        await user1.post('/chirps').send({ content: 'reply', reply_to_id: chirp.id });

        await user2.post(`/users/${u1.id}/follow`);
        await user3.post(`/users/${u1.id}/follow`);
        await user1.post(`/users/${u2.id}/follow`);

        const res = await request(app).get('/users/user1');

        expect(res.body).toMatchObject({
            chirps_count: 2,
            followers_count: 2,
            following_count: 1,
        });
    });

    it('returns is_following based on the viewer', async () => {
        const { agent: follower } = await createUser('follower');
        const { agent: stranger } = await createUser('stranger');
        const { user: target } = await createUser('target');
        await follower.post(`/users/${target.id}/follow`);

        const asFollower = await follower.get('/users/target');
        const asStranger = await stranger.get('/users/target');
        const asGuest = await request(app).get('/users/target');

        expect(asFollower.body.is_following).toBe(true);
        expect(asStranger.body.is_following).toBe(false);
        expect(asGuest.body.is_following).toBe(false);
    });
});

describe('GET /users/:id/followers and /followings', () => {
    it('lists followers and followings in the right direction', async () => {
        const { agent: alice, user: a } = await createUser('alice');
        const { agent: bob } = await createUser('bob');
        const { user: c } = await createUser('carol');

        await bob.post(`/users/${a.id}/follow`);   // bob → alice
        await alice.post(`/users/${c.id}/follow`); // alice → carol

        const followers = await request(app).get(`/users/${a.id}/followers`);
        const followings = await request(app).get(`/users/${a.id}/followings`);

        expect(followers.body.users.map((u) => u.username)).toEqual(['bob']);
        expect(followings.body.users.map((u) => u.username)).toEqual(['carol']);
    });

    it('returns the most recent follow first', async () => {
        const { user: target } = await createUser('target');
        for (const name of ['first', 'second', 'third']) {
            const { agent } = await createUser(name);
            await agent.post(`/users/${target.id}/follow`);
        }

        const res = await request(app).get(`/users/${target.id}/followers`);

        expect(res.body.users.map((u) => u.username)).toEqual(['third', 'second', 'first']);
    });

    it('returns is_following for each user based on the viewer', async () => {
        const { agent: viewer } = await createUser('viewer');
        const { user: target } = await createUser('target');
        const { agent: followedByViewer, user: f } = await createUser('known');
        const { agent: stranger } = await createUser('unknown');

        await followedByViewer.post(`/users/${target.id}/follow`);
        await stranger.post(`/users/${target.id}/follow`);
        await viewer.post(`/users/${f.id}/follow`);

        const res = await viewer.get(`/users/${target.id}/followers`);

        const byName = Object.fromEntries(res.body.users.map((u) => [u.username, u.is_following]));
        expect(byName).toEqual({ known: true, unknown: false });
    });

    it('paginates without skipping or repeating users', async () => {
        const { user: target } = await createUser('target');
        for (const name of ['fan1', 'fan2', 'fan3', 'fan4', 'fan5']) {
            const { agent } = await createUser(name);
            await agent.post(`/users/${target.id}/follow`);
        }

        const users = await getAllPages(request(app), `/users/${target.id}/followers`, 'users');

        expect(users.map((u) => u.username)).toEqual(['fan5', 'fan4', 'fan3', 'fan2', 'fan1']);
    });

    it('does not expose password_hash or email', async () => {
        const { agent, user: target } = await createUser('target');
        const { agent: other } = await createUser('other');
        await other.post(`/users/${target.id}/follow`);

        const res = await agent.get(`/users/${target.id}/followers`);

        expect(res.body.users[0].password_hash).toBeUndefined();
        expect(res.body.users[0].email).toBeUndefined();
    });

    it('returns 400 if id is not a number', async () => {
        const res = await request(app).get('/users/abc/followers');

        expect(res.status).toBe(400);
    });

    it('returns 400 if limit is negative', async () => {
        const res = await request(app).get('/users/1/followers?limit=-5');

        expect(res.status).toBe(400);
    });

    it('returns at most 50 users', async () => {
        const { user: target } = await createUser('target');

        // Insert 55 followers directly: registering through the API would be slow (bcrypt)
        await pool.query(`
            INSERT INTO users (username, email, password_hash, display_name)
            SELECT 'f' || i, 'f' || i || '@test.com', 'x', 'f' || i
            FROM generate_series(1, 55) AS i
        `);
        await pool.query(`
            INSERT INTO follows (follower_id, following_id)
            SELECT id, $1 FROM users WHERE id <> $1
        `, [target.id]);

        const res = await request(app).get(`/users/${target.id}/followers?limit=100`);

        expect(res.body.users).toHaveLength(50);
    });
});

describe('GET /users/:id/rechirps', () => {
    it("returns only that user's rechirps with rechirped_by fields", async () => {
        const { agent: author } = await createUser('author');
        const { agent: user1, user: u1 } = await createUser('user1');
        const { agent: user2 } = await createUser('user2');

        const { body: a } = await author.post('/chirps').send({ content: 'a' });
        const { body: b } = await author.post('/chirps').send({ content: 'b' });
        await user1.post(`/chirps/${a.id}/rechirps`);
        await user2.post(`/chirps/${b.id}/rechirps`);

        const res = await request(app).get(`/users/${u1.id}/rechirps`);

        expect(res.status).toBe(200);
        expect(res.body.chirps).toHaveLength(1);
        expect(res.body.chirps[0]).toMatchObject({
            content: 'a',
            username: 'author',
            rechirped_by_id: u1.id,
            rechirped_by_username: 'user1',
        });
    });

    it('returns the most recent rechirp first, not the most recent chirp', async () => {
        const { agent: author } = await createUser('author');
        const { agent: user1, user: u1 } = await createUser('user1');

        const { body: older } = await author.post('/chirps').send({ content: 'older' });
        const { body: newer } = await author.post('/chirps').send({ content: 'newer' });

        // Rechirp the newer chirp first, then the older one
        await user1.post(`/chirps/${newer.id}/rechirps`);
        await user1.post(`/chirps/${older.id}/rechirps`);

        const res = await request(app).get(`/users/${u1.id}/rechirps`);

        expect(res.body.chirps.map((c) => c.content)).toEqual(['older', 'newer']);
    });

    it('paginates without skipping or repeating chirps', async () => {
        const { agent: author } = await createUser('author');
        const { agent: user1, user: u1 } = await createUser('user1');

        for (const content of ['1', '2', '3', '4', '5']) {
            const { body: chirp } = await author.post('/chirps').send({ content });
            await user1.post(`/chirps/${chirp.id}/rechirps`);
        }

        const chirps = await getAllPages(request(app), `/users/${u1.id}/rechirps`, 'chirps');

        expect(chirps.map((c) => c.content)).toEqual(['5', '4', '3', '2', '1']);
    });

    it('returns liked_by_me true for the viewer who liked the chirp', async () => {
        const { agent: author } = await createUser('author');
        const { agent: user1, user: u1 } = await createUser('user1');

        const { body: chirp } = await author.post('/chirps').send({ content: 'a' });
        await user1.post(`/chirps/${chirp.id}/rechirps`);
        await author.post(`/chirps/${chirp.id}/likes`);

        const asLiker = await author.get(`/users/${u1.id}/rechirps`);
        const asGuest = await request(app).get(`/users/${u1.id}/rechirps`);

        expect(asLiker.body.chirps[0].liked_by_me).toBe(true);
        expect(asGuest.body.chirps[0].liked_by_me).toBe(false);
    });

    it('returns 400 if id is not a number', async () => {
        const res = await request(app).get('/users/abc/rechirps');

        expect(res.status).toBe(400);
    });
});

describe('GET /users/:id/replies', () => {
    it("returns only that user's replies, with reply_to_username", async () => {
        const { agent: author } = await createUser('author');
        const { agent: user1, user: u1 } = await createUser('user1');

        const { body: parent } = await author.post('/chirps').send({ content: 'parent' });
        await user1.post('/chirps').send({ content: 'normal chirp' });
        await user1.post('/chirps').send({ content: 'my reply', reply_to_id: parent.id });

        const res = await request(app).get(`/users/${u1.id}/replies`);

        expect(res.status).toBe(200);
        expect(res.body.chirps).toHaveLength(1);
        expect(res.body.chirps[0]).toMatchObject({
            content: 'my reply',
            reply_to_username: 'author',
        });
    });

    it('returns liked_by_me true for the viewer who liked the reply', async () => {
        const { agent: author } = await createUser('author');
        const { agent: user1, user: u1 } = await createUser('user1');

        const { body: parent } = await author.post('/chirps').send({ content: 'parent' });
        const { body: reply } = await user1.post('/chirps').send({ content: 'reply', reply_to_id: parent.id });
        await author.post(`/chirps/${reply.id}/likes`);

        const res = await author.get(`/users/${u1.id}/replies`);

        expect(res.body.chirps[0].liked_by_me).toBe(true);
    });

    it('paginates without skipping or repeating replies', async () => {
        const { agent } = await createUser('user1');
        const { body: parent } = await agent.post('/chirps').send({ content: 'parent' });
        for (const content of ['1', '2', '3', '4', '5']) {
            await agent.post('/chirps').send({ content, reply_to_id: parent.id });
        }

        const chirps = await getAllPages(request(app), '/users/1/replies', 'chirps');

        expect(chirps.map((c) => c.content)).toEqual(['5', '4', '3', '2', '1']);
    });

    it('returns 400 if id is not a number', async () => {
        const res = await request(app).get('/users/abc/replies');

        expect(res.status).toBe(400);
    });
});
