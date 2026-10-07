import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { resetDb } from './helpers/db.js';
import { createUser } from './helpers/users.js';

beforeEach(async () => {
    await resetDb();
});

describe('POST /chirps/:id/rechirps', () => {
    it('returns 201 when a chirp is successfully rechirped and rechirp count is updated', async () => {
        const { agent: owner } = await createUser('owner');
        const { agent: fan } = await createUser('fan');
        const { body: chirp } = await owner.post('/chirps').send({ content: 'This is a test chirp' });

        const response = await fan.post(`/chirps/${chirp.id}/rechirps`);

        expect(response.status).toBe(201);
        expect(response.body.chirp_id).toBe(chirp.id);

        const fetched = await fan.get(`/chirps/${chirp.id}`);
        expect(fetched.body.rechirp_count).toBe(1);
        expect(fetched.body.rechirped_by_me).toBe(true);
    });

    it('returns 409 when rechirping the same chirp twice', async () => {
        const { agent } = await createUser('user1');
        const { body: chirp } = await agent.post('/chirps').send({ content: 'hello' });

        await agent.post(`/chirps/${chirp.id}/rechirps`);
        const second = await agent.post(`/chirps/${chirp.id}/rechirps`);

        expect(second.status).toBe(409);

        const fetched = await agent.get(`/chirps/${chirp.id}`);
        expect(fetched.body.rechirp_count).toBe(1);
    });

    it('returns 401 without a token', async () => {
        const res = await request(app).post('/chirps/1/rechirps');

        expect(res.status).toBe(401);
    });

    it('returns 404 for a chirp that does not exist', async () => {
        const { agent } = await createUser('user1');

        const res = await agent.post('/chirps/9999/rechirps');

        expect(res.status).toBe(404);
    });

    it('returns 400 if id is not a number', async () => {
        const { agent } = await createUser('user1');

        const res = await agent.post('/chirps/abc/rechirps');

        expect(res.status).toBe(400);
    });

    it('lets a user rechirp their own chirp', async () => {
        const { agent } = await createUser('user1');
        const { body: chirp } = await agent.post('/chirps').send({ content: 'mine' });

        const res = await agent.post(`/chirps/${chirp.id}/rechirps`);

        expect(res.status).toBe(201);
    });
});

describe('DELETE /chirps/:id/rechirps', () => {
    it('removes the rechirp and updates rechirp count', async () => {
        const { agent } = await createUser('user1');
        const { body: chirp } = await agent.post('/chirps').send({ content: 'hello' });
        await agent.post(`/chirps/${chirp.id}/rechirps`);

        const res = await agent.delete(`/chirps/${chirp.id}/rechirps`);

        expect(res.status).toBe(200);

        const fetched = await agent.get(`/chirps/${chirp.id}`);
        expect(fetched.body.rechirp_count).toBe(0);
        expect(fetched.body.rechirped_by_me).toBe(false);
    });

    it('returns 404 when the chirp was not rechirped', async () => {
        const { agent } = await createUser('user1');
        const { body: chirp } = await agent.post('/chirps').send({ content: 'hello' });

        const res = await agent.delete(`/chirps/${chirp.id}/rechirps`);

        expect(res.status).toBe(404);
    });

    it("does not remove someone else's rechirp", async () => {
        const { agent: user1 } = await createUser('user1');
        const { agent: user2 } = await createUser('user2');
        const { body: chirp } = await user1.post('/chirps').send({ content: 'hello' });
        await user1.post(`/chirps/${chirp.id}/rechirps`);

        const res = await user2.delete(`/chirps/${chirp.id}/rechirps`);

        expect(res.status).toBe(404);

        const fetched = await user1.get(`/chirps/${chirp.id}`);
        expect(fetched.body.rechirp_count).toBe(1);
    });

    it('returns 401 without a token', async () => {
        const res = await request(app).delete('/chirps/1/rechirps');

        expect(res.status).toBe(401);
    });
});
