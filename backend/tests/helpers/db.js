import pool from '../../src/config/database.js';

export async function resetDb() {
    await pool.query(`
        TRUNCATE users, chirps, likes, rechirps, follows
        RESTART IDENTITY CASCADE
    `);
}
