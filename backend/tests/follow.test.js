import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { resetDb } from './helpers/db.js';
import { createUser } from './helpers/users.js';

beforeEach(async () => {
    await resetDb();
});

describe('POST /users/:followingId/follow', () => {
    it('follows a user and updates the counts', async () => {
        const { agent: follower } = await createUser('follower');
        const { user: target } = await createUser('target');

        const res = await follower.post(`/users/${target.id}/follow`);

        expect(res.status).toBe(201);

        const targetProfile = await follower.get('/users/target');
        expect(targetProfile.body.followers_count).toBe(1);
        expect(targetProfile.body.is_following).toBe(true);

        const followerProfile = await follower.get('/users/follower');
        expect(followerProfile.body.following_count).toBe(1);
    });

    it('returns 400 when following yourself', async () => {
        const { agent, user } = await createUser('user1');

        const res = await agent.post(`/users/${user.id}/follow`);

        expect(res.status).toBe(400);
    });

    it('returns 401 without a token', async () => {
        const { user: target } = await createUser('target');

        const res = await request(app).post(`/users/${target.id}/follow`);

        expect(res.status).toBe(401);
    });

    it('returns 409 when already following', async () => {
        const { agent: follower } = await createUser('follower');
        const { user: target } = await createUser('target');

        await follower.post(`/users/${target.id}/follow`);
        const second = await follower.post(`/users/${target.id}/follow`);

        expect(second.status).toBe(409);

        const targetProfile = await follower.get('/users/target');
        expect(targetProfile.body.followers_count).toBe(1);
    });

    it('returns 404 for a user that does not exist', async () => {
        const { agent } = await createUser('user1');

        const res = await agent.post('/users/9999/follow');

        expect(res.status).toBe(404);
    });

    it.each([
        ['non-numeric id', 'abc'],
        ['zero id', '0'],
    ])('returns 400 for %s', async (_name, id) => {
        const { agent } = await createUser('user1');

        const res = await agent.post(`/users/${id}/follow`);

        expect(res.status).toBe(400);
    });
});

describe('DELETE /users/:followingId/follow', () => {
    it('unfollows a user and updates the counts', async () => {
        const { agent: follower } = await createUser('follower');
        const { user: target } = await createUser('target');
        await follower.post(`/users/${target.id}/follow`);

        const res = await follower.delete(`/users/${target.id}/follow`);

        expect(res.status).toBe(200);

        const targetProfile = await follower.get('/users/target');
        expect(targetProfile.body.followers_count).toBe(0);
        expect(targetProfile.body.is_following).toBe(false);
    });

    it('returns 404 when not following', async () => {
        const { agent } = await createUser('user1');
        const { user: target } = await createUser('target');

        const res = await agent.delete(`/users/${target.id}/follow`);

        expect(res.status).toBe(404);
    });

    it('returns 401 without a token', async () => {
        const { user: target } = await createUser('target');

        const res = await request(app).delete(`/users/${target.id}/follow`);

        expect(res.status).toBe(401);
    });

    it('returns 400 for a non-numeric id', async () => {
        const { agent } = await createUser('user1');

        const res = await agent.delete('/users/abc/follow');

        expect(res.status).toBe(400);
    });
});
