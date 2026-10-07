import dotenv from 'dotenv';
import { afterAll } from 'vitest';

dotenv.config({ path: '.env.test', override: true });

// Safety check: never run tests against the development database
if (!process.env.DB_NAME?.endsWith('_test')) {
    throw new Error(`Tests must run against a *_test database, got "${process.env.DB_NAME}"`);
}

const { default: pool } = await import('../src/config/database.js');

afterAll(async () => {
    await pool.end();
});
