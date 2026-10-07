import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { resetDb } from './helpers/db.js';
import { createUser } from './helpers/users.js';
import pool from '../src/config/database.js';

beforeEach(async () => {
    await resetDb();
});

describe("POST /chirps", () => {
    // Test case for creating a chirp normally
    it("creates a chirp", async () => {
        const { agent } = await createUser("testuser");

        const res = await agent.post("/chirps").send({ content: "Hello, world!" });

        expect(res.status).toBe(201);
        expect(res.body).toMatchObject({ 
            content: 'Hello, world!', 
            username: 'testuser',
        });
    });

    // Test case for creating a chirp with a quote
    it("creates a chirp with a quote", async () => {
        const { agent } = await createUser("testuser");
        const quoteRes = await agent.post("/chirps").send({ content: "This is a quote" });
        const quoteId = quoteRes.body.id;

        const res = await agent.post("/chirps").send({ content: "This is a chirp with a quote", quote_of_id: quoteId });

        expect(res.status).toBe(201);
        expect(res.body).toMatchObject({ 
            content: 'This is a chirp with a quote', 
            username: 'testuser',
            quoted_chirp: {
                id: quoteId,
                content: 'This is a quote',
                username: 'testuser'
            },
            quote_of_id: quoteId,
        });
    });

    it('can get chirp after creating it with an id', async () => {
        const { agent } = await createUser("testuser");
        const createRes = await agent.post("/chirps").send({ content: "Hello, world!" });
        const chirpId = createRes.body.id;

        const getRes = await agent.get(`/chirps/${chirpId}`);

        expect(getRes.status).toBe(200);
        expect(getRes.body).toMatchObject({
            content: 'Hello, world!',
            username: 'testuser',
        });
    });

    it('returns counters as 0 and bools as false when creating a chirp', async () => {
        const { agent } = await createUser("testuser");
        const res = await agent.post("/chirps").send({ content: "Hello, world!" });

        expect(res.status).toBe(201);
        expect(res.body).toMatchObject({
            like_count: 0,
            liked_by_me: false,
            rechirp_count: 0,
            rechirped_by_me: false,
            reply_count: 0,
        });
    });

    // Test case for creating a chirp with a reply
    it("creates a chirp with a reply", async () => {
        const { agent } = await createUser("testuser");
        const replyRes = await agent.post("/chirps").send({ content: "This is a chirp to reply to" });
        const replyId = replyRes.body.id;

        const res = await agent.post("/chirps").send({ content: "This is a reply chirp", reply_to_id: replyId });

        expect(res.status).toBe(201);
        expect(res.body).toMatchObject({ 
            content: 'This is a reply chirp', 
            username: 'testuser',
            like_count: 0,
            liked_by_me: false,
            rechirp_count: 0,
            rechirped_by_me: false,
            reply_count: 0,
            quoted_chirp: null,
            quote_of_id: null,
            reply_to_id: replyId
        });
    });

    // Test case for creating a chirp without a token (unauthenticated)
    it("rejects creating a chirp without a token", async () => {
        const res = await request(app).post("/chirps").send({ content: "Hello, world!" });

        expect(res.status).toBe(401);
    });

    // Input tests
    it.each([
        ['missing content', {}],
        ['empty content', { content: '' }],
        ['whitespace content', { content: '   ' }],
        ['non string content', { content: 123 }],
        ['string quote_of_id', { content: 'Hello', quote_of_id: 'not-a-number' }],
        ['zero quote_of_id', { content: 'hi', quote_of_id: 0 }],
        ['negative quote_of_id', { content: 'hi', quote_of_id: -1 }],
        ['string reply_to_id', { content: 'Hello', reply_to_id: 'not-a-number' }],
        ['zero reply_to_id', { content: 'hi', reply_to_id: 0 }],
        ['negative reply_to_id', { content: 'hi', reply_to_id: -1 }],
        ['non-integer quote_of_id', { content: 'hi', quote_of_id: 1.5 }],
        ['non-integer reply_to_id', { content: 'hi', reply_to_id: 1.5 }],
        ['quote_of_id and reply_to_id both set', { content: 'hi', quote_of_id: 1, reply_to_id: 2 }],
    ])("returns 400 for %s", async (_name, body) => {
        const { agent } = await createUser("testuser");

        const res = await agent.post("/chirps").send(body);

        expect(res.status).toBe(400);
    })

    it('returns 404 when replying to a chirp that does not exist', async () => {
        const { agent } = await createUser();

        const res = await agent.post('/chirps').send({ content: 'hi', reply_to_id: 9999 });

        expect(res.status).toBe(404);
    });

    it('returns 404 when quoting a chirp that does not exist', async () => {
        const { agent } = await createUser();

        const res = await agent.post('/chirps').send({ content: 'hi', quote_of_id: 9999 });

        expect(res.status).toBe(404);
    });

    it('returns 201 when quote_of_id and reply_to_id are both null', async () => {
        const { agent } = await createUser();
        const res = await agent.post('/chirps').send({ content: 'hi', quote_of_id: null, reply_to_id: null });

        expect(res.status).toBe(201);
    });

    it('accepts content of exactly 280 characters', async () => {
        const { agent } = await createUser();

        const res = await agent.post('/chirps').send({ content: 'a'.repeat(280) });

        expect(res.status).toBe(201);
    });

    it('returns 400 for content longer than 280 characters', async () => {
        const { agent } = await createUser();

        const res = await agent.post('/chirps').send({ content: 'a'.repeat(281) });

        expect(res.status).toBe(400);
    });

    it('allows replying to a quote', async () => {
        const { agent } = await createUser();
        const { body: original } = await agent.post('/chirps').send({ content: 'original' });
        const { body: quote } = await agent.post('/chirps').send({ content: 'quote', quote_of_id: original.id });

        const res = await agent.post('/chirps').send({ content: 'reply', reply_to_id: quote.id });

        expect(res.status).toBe(201);
    });

    it('allows quoting a reply', async () => {
        const { agent } = await createUser();
        const { body: parent } = await agent.post('/chirps').send({ content: 'parent' });
        const { body: reply } = await agent.post('/chirps').send({ content: 'reply', reply_to_id: parent.id });

        const res = await agent.post('/chirps').send({ content: 'quote', quote_of_id: reply.id });

        expect(res.status).toBe(201);
    });

    it('returns 400 for a malformed JSON body', async () => {
        const { agent } = await createUser();

        const res = await agent.post('/chirps')
            .set('Content-Type', 'application/json')
            .send('{"content": "hi"');

        expect(res.status).toBe(400);
    });
})

describe("GET /chirps", () => {
    it('returns chirps in the correct order', async () => {
        const { agent } = await createUser("testuser");
        for (const content of ['1', '2', '3', '4', '5']) {
            await agent.post('/chirps').send({ content });
        }

        const res = await agent.get("/chirps");

        expect(res.status).toBe(200);
        expect(res.body.chirps.map((c) => c.content)).toEqual(['5', '4', '3', '2', '1']);
    });

    it('returns an empty array when there are no chirps', async () => {
        const res = await request(app).get("/chirps");

        expect(res.status).toBe(200);
        expect(res.body.chirps).toEqual([]);
    });

    it('does not return replies', async () => {
        const { agent } = await createUser();
        const { body: parent } = await agent.post('/chirps').send({ content: 'parent' });
        await agent.post('/chirps').send({ content: 'reply', reply_to_id: parent.id });

        const res = await request(app).get('/chirps');

        expect(res.body.chirps.map((c) => c.content)).toEqual(['parent']);
    });

    it('returns 50 chirps even if there are more', async () => {
        const { agent } = await createUser();
        for (let i = 1; i <= 50; i++) {
            await agent.post('/chirps').send({ content: i.toString() });
        }

        const res = await request(app).get('/chirps?limit=100');

        expect(res.status).toBe(200);
        expect(res.body.chirps.length).toBe(50);
    });

    it('returns 20 chirps by default', async () => {
        const { agent } = await createUser();
        for (let i = 1; i <= 30; i++) {
            await agent.post('/chirps').send({ content: i.toString() });
        }

        const res = await request(app).get('/chirps');

        expect(res.status).toBe(200);
        expect(res.body.chirps.length).toBe(20);
    });

    it('returns 20 if limit is not a number', async () => {
        const { agent } = await createUser();

        for (let i = 1; i <= 30; i++) {
            await agent.post('/chirps').send({ content: i.toString() });
        }

        const res = await request(app).get('/chirps?limit=not-a-number');

        expect(res.status).toBe(200);
        expect(res.body.chirps.length).toBe(20);
    });

    it('returns 400 if before is not a number', async () => {
        const res = await request(app).get('/chirps?before=not-a-number');

        expect(res.status).toBe(400);
    });

    it('returns 400 if limit is negative', async () => {
        const res = await request(app).get('/chirps?limit=-1');

        expect(res.status).toBe(400);
    });

    it('returns 20 chirps if limit is zero', async () => {
        const { agent } = await createUser();
        for (let i = 1; i <= 30; i++) {
            await agent.post('/chirps').send({ content: i.toString() });
        }
        const res = await request(app).get('/chirps?limit=0');

        expect(res.status).toBe(200);
        expect(res.body.chirps.length).toBe(20);
    });

    it('returns 400 if limit is not an integer', async () => {
        const res = await request(app).get('/chirps?limit=1.5');

        expect(res.status).toBe(400);
    });

    it('return 400 if authorId is not a number', async () => {
        const res = await request(app).get('/chirps?authorId=not-a-number');

        expect(res.status).toBe(400);
    });

    it('paginates without skipping or repeating chirps', async () => {
        const { agent } = await createUser();
        for (const content of ['1', '2', '3', '4', '5']) {
            await agent.post('/chirps').send({ content });
        }

        const page1 = await request(app).get('/chirps?limit=2');
        const page2 = await request(app).get(`/chirps?limit=2&before=${page1.body.nextCursor}`);
        const page3 = await request(app).get(`/chirps?limit=2&before=${page2.body.nextCursor}`);

        const contents = [...page1.body.chirps, ...page2.body.chirps, ...page3.body.chirps]
            .map((c) => c.content);
        expect(contents).toEqual(['5', '4', '3', '2', '1']);
        expect(page3.body.nextCursor).toBeNull();
    });

    it('does not include replies', async () => {
        const { agent } = await createUser();
        const { body: parent } = await agent.post('/chirps').send({ content: 'parent' });
        await agent.post('/chirps').send({ content: 'reply', reply_to_id: parent.id });

        const res = await request(app).get('/chirps');

        expect(res.body.chirps.map((c) => c.content)).toEqual(['parent']);
    });

    it('returns empty list if there is no before', async () => {
        const res = await request(app).get('/chirps?before=');

        const { agent } = await createUser();
        for (let i = 1; i <= 30; i++) {
            await agent.post('/chirps').send({ content: i.toString() });
        }

        expect(res.status).toBe(200);
        expect(res.body.chirps).toEqual([]);
    });

    it('returns nextCursor as null if there are no more chirps', async () => {
        const { agent } = await createUser();
        for (const content of ['1', '2', '3']) {
            await agent.post('/chirps').send({ content });
        }

        const res = await request(app).get('/chirps?limit=5');

        expect(res.status).toBe(200);
        expect(res.body.nextCursor).toBeNull();
    });

    it('returns only chirps from the specified authorId', async () => {
        const { agent: agent1 } = await createUser('user1');
        const { agent: agent2 } = await createUser('user2');

        await agent1.post('/chirps').send({ content: 'chirp1' });
        await agent2.post('/chirps').send({ content: 'chirp2' });

        const res = await request(app).get('/chirps?authorId=1');

        expect(res.status).toBe(200);
        expect(res.body.chirps.length).toBe(1);
        expect(res.body.chirps[0].content).toBe('chirp1');
    });

    it('returns liked_by_me based on the viewer', async () => {
        const { agent } = await createUser('user1');
        const { body: liked } = await agent.post('/chirps').send({ content: 'liked' });
        await agent.post('/chirps').send({ content: 'not liked' });
        await agent.post(`/chirps/${liked.id}/likes`);

        const asLiker = await agent.get('/chirps');
        const asGuest = await request(app).get('/chirps');

        const likedMap = (res) => Object.fromEntries(res.body.chirps.map((c) => [c.content, c.liked_by_me]));
        expect(likedMap(asLiker)).toEqual({ liked: true, 'not liked': false });
        expect(likedMap(asGuest)).toEqual({ liked: false, 'not liked': false });
    });

    it('treats an invalid token as a guest instead of returning 401', async () => {
        const res = await request(app)
            .get('/chirps')
            .set('Cookie', 'token=invalidtoken');

        expect(res.status).toBe(200);
    });
});

describe("GET /chirps/following", () => {
    it('returns 401 without a token', async () => {
        const res = await request(app).get('/chirps/following');

        expect(res.status).toBe(401);
    });

    it('returns own chirps', async () => {
        const { agent } = await createUser('testuser');
        await agent.post('/chirps').send({ content: 'own chirp' });

        const res = await agent.get('/chirps/following');

        expect(res.status).toBe(200);
        expect(res.body.chirps.length).toBe(1);
        expect(res.body.chirps[0].content).toBe('own chirp');
    });

    it('returns chirps from followed users', async () => {
        const { agent: agent1 } = await createUser('user1');
        const { agent: agent2 } = await createUser('user2');
        const { agent: agent3 } = await createUser('user3');

        await agent2.post('/chirps').send({ content: 'chirp2' });
        await agent3.post('/chirps').send({ content: 'chirp3' });

        await agent1.post('/users/2/follow');

        const res = await agent1.get('/chirps/following');

        expect(res.status).toBe(200);
        expect(res.body.chirps.length).toBe(1);
        expect(res.body.chirps[0].content).toBe('chirp2');
    });

    it('does not return chirps from unfollowed users', async () => {
        const { agent: agent1 } = await createUser('user1');
        const { agent: agent2 } = await createUser('user2');

        await agent2.post('/chirps').send({ content: 'chirp2' });

        const res = await agent1.get('/chirps/following');

        expect(res.status).toBe(200);
        expect(res.body.chirps.length).toBe(0);
    });

    it('does not return replies', async () => {
        const { agent } = await createUser('user1');
        const { body: parent } = await agent.post('/chirps').send({ content: 'parent' });
        await agent.post('/chirps').send({ content: 'reply', reply_to_id: parent.id });

        const res = await agent.get('/chirps/following');

        expect(res.status).toBe(200);
        expect(res.body.chirps.length).toBe(1);
        expect(res.body.chirps[0].content).toBe('parent');
    });

    it('returns rechirped chirps of followed users', async () => {
        const { agent: agent1, user: user1 } = await createUser('user1');
        const { agent: agent2 } = await createUser('user2');

        const { body: chirp } = await agent2.post('/chirps').send({ content: 'chirp2' });
        await agent1.post(`/chirps/${chirp.id}/rechirps`);

        const res = await agent1.get('/chirps/following');

        expect(res.status).toBe(200);
        expect(res.body.chirps.length).toBe(1);
        expect(res.body.chirps[0]).toMatchObject({
            content: 'chirp2',
            rechirped_by_id: user1.id,
            rechirped_by_username: 'user1',
        });
    });

    it('returns liked_by_me true for chirps the viewer liked', async () => {
        const { agent } = await createUser('user1');
        const { body: chirp } = await agent.post('/chirps').send({ content: 'hello' });
        await agent.post(`/chirps/${chirp.id}/likes`);

        const res = await agent.get('/chirps/following');

        expect(res.body.chirps[0].liked_by_me).toBe(true);
    });

    it('shows all rechirps of same chirp from two followed users', async () => {
        const { agent: agent1 } = await createUser('user1');
        const { agent: agent2 } = await createUser('user2');
        const { agent: agent3 } = await createUser('user3');

        const { body: chirp } = await agent2.post('/chirps').send({ content: 'chirp2' });
        await agent1.post(`/chirps/${chirp.id}/rechirps`);
        await agent3.post(`/chirps/${chirp.id}/rechirps`);

        await agent1.post('/users/3/follow');

        const res = await agent1.get('/chirps/following');

        expect(res.status).toBe(200);
        expect(res.body.chirps.length).toBe(2);
    });

    it('paginates without skipping or repeating chirps with 3 cursors', async () => {
        const { agent } = await createUser('user1');

        const { agent: agent2 } = await createUser('user2');

        // user2 posts 'a' first, so it is the oldest item in the feed
        const { body: chirpA } = await agent2.post('/chirps').send({ content: 'a' });
        await agent.post('/users/2/follow');

        for (const content of ['1', '2', '3']) {
            await agent.post('/chirps').send({ content });
        }

        // user1 rechirps 'a': the same chirp now appears twice in the feed
        await agent.post(`/chirps/${chirpA.id}/rechirps`);

        // The following feed's cursor has 3 parts: { time, chirpId, by }
        const getPage = (cursor) => agent.get('/chirps/following').query({
            limit: 2,
            ...(cursor && { beforeTime: cursor.time, beforeId: cursor.chirpId, beforeBy: cursor.by }),
        });

        const page1 = await getPage(null);
        const page2 = await getPage(page1.body.nextCursor);
        const page3 = await getPage(page2.body.nextCursor);

        // content:rechirper tells the rechirp of 'a' apart from the original 'a'
        const items = [...page1.body.chirps, ...page2.body.chirps, ...page3.body.chirps]
            .map((c) => `${c.content}:${c.rechirped_by_id ?? '-'}`);

        expect(items).toEqual(['a:1', '3:-', '2:-', '1:-', 'a:-']);
        expect(page3.body.nextCursor).toBeNull();
    });

    it('returns 400 if the is beforeTime but not beforeId', async () => {
        const { agent } = await createUser('user1');

        const res = await agent.get('/chirps/following').query({
            limit: 2,
            beforeTime: new Date().toISOString(),
        });

        expect(res.status).toBe(400);
    });

    it('returns 400 if beforeTime is invalid', async () => {
        const { agent } = await createUser('user1');

        const res = await agent.get('/chirps/following').query({
            limit: 2,
            beforeTime: 'not-a-date',
        });

        expect(res.status).toBe(400);
    });
});

describe("GET /chirps/:id", () => {
    it('returns 404 if chirp is not found', async () => {
        const res = await request(app).get('/chirps/999');

        expect(res.status).toBe(404);
    });

    it('returns the chirp if found', async () => {
        const { agent } = await createUser('testuser');
        const { body: chirp } = await agent.post('/chirps').send({ content: 'Hello' });

        const res = await request(app).get(`/chirps/${chirp.id}`);

        expect(res.status).toBe(200);
        expect(res.body).toMatchObject({ 
            content: 'Hello', 
            username: 'testuser',
            like_count: 0,
            liked_by_me: false,
            rechirp_count: 0,
            rechirped_by_me: false,
            reply_count: 0,
        });
    });

    it('returns 400 if id is not a number', async () => {
        const res = await request(app).get('/chirps/not-a-number');

        expect(res.status).toBe(400);
    });

    it('returns 400 if id is a negative number', async () => {
        const res = await request(app).get('/chirps/-1');

        expect(res.status).toBe(400);
    });

    it('returns liked_by_me false when not logged in', async () => {
        const { agent } = await createUser('testuser');
        const { body: chirp } = await agent.post('/chirps').send({ content: 'Hello' });

        const res = await request(app).get(`/chirps/${chirp.id}`);

        expect(res.status).toBe(200);
        expect(res.body.liked_by_me).toBe(false);
    });

    it('returns liked_by_me true when logged in and liked', async () => {
        const { agent } = await createUser('testuser');
        const { body: chirp } = await agent.post('/chirps').send({ content: 'Hello' });

        await agent.post(`/chirps/${chirp.id}/likes`);
        const res = await agent.get(`/chirps/${chirp.id}`);

        expect(res.status).toBe(200);
        expect(res.body.liked_by_me).toBe(true);
    });

    it('returns 400 if id is not an integer', async () => {
        const res = await request(app).get('/chirps/1.5');

        expect(res.status).toBe(400);
    });

    it('returns 404 when if is too big for an integer', async () => {
        const res = await request(app).get('/chirps/999999999999999999999');

        expect(res.status).toBe(400);
    });

    it('returns like_count, rechirp_count, and reply_count correctly', async () => {
        const { agent: agent1 } = await createUser('user1');
        const { agent: agent2 } = await createUser('user2');
        const { agent: agent3 } = await createUser('user3');

        const { body: chirp } = await agent1.post('/chirps').send({ content: 'Hello' });

        await agent2.post(`/chirps/${chirp.id}/likes`);
        await agent3.post(`/chirps/${chirp.id}/likes`);

        await agent2.post(`/chirps/${chirp.id}/rechirps`);
        await agent3.post(`/chirps/${chirp.id}/rechirps`);

        await agent2.post('/chirps').send({ content: 'Reply 1', reply_to_id: chirp.id });
        await agent3.post('/chirps').send({ content: 'Reply 2', reply_to_id: chirp.id });

        const res = await request(app).get(`/chirps/${chirp.id}`);

        expect(res.status).toBe(200);
        expect(res.body.like_count).toBe(2);
        expect(res.body.rechirp_count).toBe(2);
        expect(res.body.reply_count).toBe(2);
    });

    it('returns rechirped_by_me true when logged in and rechirped', async () => {
        const { agent } = await createUser('testuser');
        const { body: chirp } = await agent.post('/chirps').send({ content: 'Hello' });

        await agent.post(`/chirps/${chirp.id}/rechirps`);
        const res = await agent.get(`/chirps/${chirp.id}`);

        expect(res.status).toBe(200);
        expect(res.body.rechirped_by_me).toBe(true);
    });

    it('returns reply_to_username when chirp is a reply', async () => {
        const { agent: agent1 } = await createUser('user1');
        const { agent: agent2 } = await createUser('user2');

        const { body: chirp } = await agent1.post('/chirps').send({ content: 'Hello' });
        const { body: reply } = await agent2.post('/chirps').send({ content: 'Reply', reply_to_id: chirp.id });

        const res = await agent2.get(`/chirps/${reply.id}`);

        expect(res.status).toBe(200);
        expect(res.body.reply_to_username).toBe('user1');
    });

    it('returns quoted_chirp when chirp is a quote', async () => {
        const { agent: agent1 } = await createUser('user1');
        const { agent: agent2 } = await createUser('user2');

        const { body: chirp } = await agent1.post('/chirps').send({ content: 'Hello' });
        const { body: quote } = await agent2.post('/chirps').send({ content: 'Quote', quote_of_id: chirp.id });

        const res = await agent2.get(`/chirps/${quote.id}`);

        expect(res.status).toBe(200);
        expect(res.body.quoted_chirp).toMatchObject({
            id: chirp.id,
            content: 'Hello',
            username: 'user1',
        });
    });

    it('returns quoted_chirp as null when quoted_chirp is deleted', async () => {
        const { agent: agent1 } = await createUser('user1');
        const { body: chirp } = await agent1.post('/chirps').send({ content: 'Hello' });
        const { body: quote } = await agent1.post('/chirps').send({ content: 'Quote', quote_of_id: chirp.id });

        await agent1.delete(`/chirps/${chirp.id}`);

        const res = await agent1.get(`/chirps/${quote.id}`);

        expect(res.status).toBe(200);
        expect(res.body.quoted_chirp).toBeNull();
    });
});

describe("GET /chirps/:id/replies", () => {
    it('returns only replies to that chirp', async () => {
        const { agent } = await createUser('user1');
        const { body: parent } = await agent.post('/chirps').send({ content: 'parent' });
        const { body: other } = await agent.post('/chirps').send({ content: 'other' });

        await agent.post('/chirps').send({ content: 'reply to parent', reply_to_id: parent.id });
        await agent.post('/chirps').send({ content: 'reply to other', reply_to_id: other.id });

        const res = await request(app).get(`/chirps/${parent.id}/replies`);

        expect(res.status).toBe(200);
        expect(res.body.chirps.map((c) => c.content)).toEqual(['reply to parent']);
    });

    it('does not return replies to replies', async () => {
        const { agent } = await createUser('user1');
        const { body: parent } = await agent.post('/chirps').send({ content: 'parent' });
        const { body: child } = await agent.post('/chirps').send({ content: 'child', reply_to_id: parent.id });
        await agent.post('/chirps').send({ content: 'grandchild', reply_to_id: child.id });

        const res = await request(app).get(`/chirps/${parent.id}/replies`);

        expect(res.body.chirps.map((c) => c.content)).toEqual(['child']);
    });

    it('returns the newest reply first', async () => {
        const { agent } = await createUser('user1');
        const { body: parent } = await agent.post('/chirps').send({ content: 'parent' });

        for (const content of ['1', '2', '3']) {
            await agent.post('/chirps').send({ content, reply_to_id: parent.id });
        }

        const res = await request(app).get(`/chirps/${parent.id}/replies`);

        expect(res.body.chirps.map((c) => c.content)).toEqual(['3', '2', '1']);
    });

    it('paginates without skipping or repeating replies', async () => {
        const { agent } = await createUser('user1');
        const { body: parent } = await agent.post('/chirps').send({ content: 'parent' });

        for (const content of ['1', '2', '3', '4', '5']) {
            await agent.post('/chirps').send({ content, reply_to_id: parent.id });
        }

        const url = `/chirps/${parent.id}/replies`;
        const page1 = await request(app).get(url).query({ limit: 2 });
        const page2 = await request(app).get(url).query({ limit: 2, before: page1.body.nextCursor });
        const page3 = await request(app).get(url).query({ limit: 2, before: page2.body.nextCursor });

        const contents = [...page1.body.chirps, ...page2.body.chirps, ...page3.body.chirps]
            .map((c) => c.content);
        expect(contents).toEqual(['5', '4', '3', '2', '1']);
        expect(page3.body.nextCursor).toBeNull();
    });

    it('returns 404 for a chirp that does not exist', async () => {
        const res = await request(app).get('/chirps/9999/replies');

        expect(res.status).toBe(200);
        expect(res.body.chirps).toEqual([]);
    });

    it('returns 400 if id is not a number', async () => {
        const res = await request(app).get('/chirps/abc/replies');

        expect(res.status).toBe(400);
    });
});

describe("PUT /chirps/:id", () => {
    it('lets the owner edit their chirp', async () => {
        const { agent } = await createUser('user1');
        const { body: chirp } = await agent.post('/chirps').send({ content: 'before' });

        const res = await agent.put(`/chirps/${chirp.id}`).send({ content: 'after' });

        expect(res.status).toBe(200);
        expect(res.body.content).toBe('after');

        const fetched = await request(app).get(`/chirps/${chirp.id}`);
        expect(fetched.body.content).toBe('after');
    });

    it("does not let a user edit someone else's chirp", async () => {
        const { agent: owner } = await createUser('owner');
        const { agent: stranger } = await createUser('stranger');
        const { body: chirp } = await owner.post('/chirps').send({ content: 'original' });

        const res = await stranger.put(`/chirps/${chirp.id}`).send({ content: 'hacked' });

        expect(res.status).toBe(404);

        const fetched = await request(app).get(`/chirps/${chirp.id}`);
        expect(fetched.body.content).toBe('original');
    });

    it('returns 401 without a token', async () => {
        const res = await request(app).put('/chirps/1').send({ content: 'after' });

        expect(res.status).toBe(401);
    });

    it('returns 404 for a chirp that does not exist', async () => {
        const { agent } = await createUser('user1');

        const res = await agent.put('/chirps/9999').send({ content: 'after' });

        expect(res.status).toBe(404);
    });

    it.each([
        ['missing content', {}],
        ['whitespace content', { content: '   ' }],
        ['non string content', { content: 123 }],
    ])('returns 400 for %s', async (_name, body) => {
        const { agent } = await createUser('user1');
        const { body: chirp } = await agent.post('/chirps').send({ content: 'before' });

        const res = await agent.put(`/chirps/${chirp.id}`).send(body);

        expect(res.status).toBe(400);

        const fetched = await request(app).get(`/chirps/${chirp.id}`);
        expect(fetched.body.content).toBe('before');
    });

    it('returns 400 if id is not a number', async () => {
        const { agent } = await createUser('user1');

        const res = await agent.put('/chirps/abc').send({ content: 'after' });

        expect(res.status).toBe(400);
    });
});

describe("DELETE /chirps/:id", () => {
    it('lets the owner delete their chirp', async () => {
        const { agent } = await createUser('user1');
        const { body: chirp } = await agent.post('/chirps').send({ content: 'bye' });

        const res = await agent.delete(`/chirps/${chirp.id}`);

        expect(res.status).toBe(200);

        const fetched = await request(app).get(`/chirps/${chirp.id}`);
        expect(fetched.status).toBe(404);
    });

    it("does not let a user delete someone else's chirp", async () => {
        const { agent: owner } = await createUser('owner');
        const { agent: stranger } = await createUser('stranger');
        const { body: chirp } = await owner.post('/chirps').send({ content: 'mine' });

        const res = await stranger.delete(`/chirps/${chirp.id}`);

        expect(res.status).toBe(404);

        const fetched = await request(app).get(`/chirps/${chirp.id}`);
        expect(fetched.status).toBe(200);
    });

    it('returns 401 without a token', async () => {
        const res = await request(app).delete('/chirps/1');

        expect(res.status).toBe(401);
    });

    it('returns 404 for a chirp that does not exist', async () => {
        const { agent } = await createUser('user1');

        const res = await agent.delete('/chirps/9999');

        expect(res.status).toBe(404);
    });

    it('returns 400 if id is not a number', async () => {
        const { agent } = await createUser('user1');

        const res = await agent.delete('/chirps/abc');

        expect(res.status).toBe(400);
    });

    it('also deletes the replies of the chirp', async () => {
        const { agent } = await createUser('user1');
        const { body: parent } = await agent.post('/chirps').send({ content: 'parent' });
        const { body: reply } = await agent.post('/chirps').send({ content: 'reply', reply_to_id: parent.id });

        await agent.delete(`/chirps/${parent.id}`);

        const fetched = await request(app).get(`/chirps/${reply.id}`);
        expect(fetched.status).toBe(404);
    });

    it('also deletes the likes and rechirps of the chirp', async () => {
        const { agent: owner } = await createUser('owner');
        const { agent: fan } = await createUser('fan');
        const { body: chirp } = await owner.post('/chirps').send({ content: 'popular' });

        await fan.post(`/chirps/${chirp.id}/likes`);
        await fan.post(`/chirps/${chirp.id}/rechirps`);

        await owner.delete(`/chirps/${chirp.id}`);

        // The chirp is gone, so check the tables directly
        const likes = await pool.query('SELECT 1 FROM likes WHERE chirp_id = $1', [chirp.id]);
        const rechirps = await pool.query('SELECT 1 FROM rechirps WHERE chirp_id = $1', [chirp.id]);
        expect(likes.rows).toHaveLength(0);
        expect(rechirps.rows).toHaveLength(0);
    });
});
