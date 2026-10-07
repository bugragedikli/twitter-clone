import request from 'supertest';
import app from '../../src/app.js';

// Registers a user and returns an agent that is already logged in
export async function createUser(username = 'testuser') {
    const agent = request.agent(app);
    const res = await agent.post('/auth/register').send({
        username,
        email: `${username}@test.com`,
        password: 'secret123',
    });
    return { agent, user: res.body.user };
}
