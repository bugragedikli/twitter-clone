import express from "express";
import pool from '../config/database.js';

const router = express.Router();

router.get('/', async (req, res) => {
    const limit = Math.min(Number(req.query.limit) || 20, 50);
    const before = req.query.before ? Number(req.query.before) : null;

    if (before !== null && !Number.isInteger(before)) {
        return res.status(400).json({ error: 'Invalid cursor' });
    }

    try {
        const result = await pool.query(`
            SELECT c.*, u.display_name, u.username, u.profile_image_url 
            FROM chirps c 
            JOIN users u ON c.user_id = u.id 
            WHERE $2::int IS NULL
                OR (c.created_at, c.id) < (SELECT created_at, id FROM chirps WHERE id = $2)
            ORDER BY c.created_at DESC, c.id DESC
            LIMIT $1`, 
            [limit + 1, before]);

            const hasMore = result.rows.length > limit;
            const chirps = hasMore ? result.rows.slice(0, limit) : result.rows;
        
        res.json({
            chirps,
            nextCursor: hasMore ? chirps[chirps.length - 1].id : null,
        });
    }
    catch (error){
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.get('/following', async (req, res) => {
    const limit = Math.min(Number(req.query.limit) || 20, 50);
    const before = req.query.before ? Number(req.query.before) : null;

    if (before !== null && !Number.isInteger(before)) {
        return res.status(400).json({ error: 'Invalid cursor' });
    }

    try {
        const result = await pool.query(`
            SELECT c.*, u.display_name, u.username, u.profile_image_url 
            FROM chirps c 
            JOIN users u ON c.user_id = u.id 
            WHERE $2::int IS NULL
                OR (c.created_at, c.id) < (SELECT created_at, id FROM chirps WHERE id = $2)
            ORDER BY c.created_at DESC, c.id DESC
            LIMIT $1`, 
            [limit + 1, before]);

            const hasMore = result.rows.length > limit;
            const chirps = hasMore ? result.rows.slice(0, limit) : result.rows;
        
        res.json({
            chirps,
            nextCursor: hasMore ? chirps[chirps.length - 1].id : null,
        });
    }
    catch (error){
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const chirp = await pool.query('SELECT c.*, u.display_name, u.username, u.profile_image_url FROM chirps c JOIN users u ON c.user_id = u.id WHERE c.id = $1', [id]);
        if (chirp.rows.length === 0) {
            return res.status(404).json({ error: 'Chirp not found' });
        }
        res.json(chirp.rows[0]);
    }
    catch {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.post("/", async (req, res) => {
    const { user_id, content } = req.body;

    if (!user_id || !content) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        const newChirp = await pool.query(
            `WITH inserted AS (
                INSERT INTO chirps (user_id, content)
                VALUES ($1, $2)
                RETURNING *
            )
            SELECT inserted.*, u.display_name, u.username, u.profile_image_url
            FROM inserted
            JOIN users u ON inserted.user_id = u.id`,
            [user_id, content]
        );

        res.status(201).json(newChirp.rows[0]);
    }
    catch {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { content } = req.body;

    if (!content) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        const updatedChirp = await pool.query(
            'UPDATE chirps SET content = $1 WHERE id = $2 RETURNING *',
            [content, id]
        );
        if (updatedChirp.rows.length === 0) {
            return res.status(404).json({ error: 'Chirp not found' });
        }
        res.json(updatedChirp.rows[0]);
    }
    catch {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.delete('/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const deletedChirp = await pool.query('DELETE FROM chirps WHERE id = $1 RETURNING *', [id]);
        if (deletedChirp.rows.length === 0) {
            return res.status(404).json({ error: 'Chirp not found' });
        }
        res.json({ message: 'Chirp deleted successfully' });
    }
    catch {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

export default router;