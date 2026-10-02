import express from "express";
import pool from '../config/database.js';
import { protect, optionalAuth } from "../middleware/auth.js";
import { getChirps, getFollowingFeed } from "../services/chirps.service.js";

const router = express.Router();

router.get('/', optionalAuth, async (req, res) => {
    const limit = Math.min(Number(req.query.limit) || 20, 50);
    const before = req.query.before ? Number(req.query.before) : null;
    const authorId = req.query.authorId ? Number(req.query.authorId) : null;
    const viewerId = req.user?.id ?? null;

    if (before !== null && !Number.isInteger(before)) {
        return res.status(400).json({ error: 'Invalid cursor' });
    }

    try {
        const result = await getChirps({ limit, before, viewerId, authorId, followingOf: null });
        
        res.json({
            chirps: result.chirps,
            nextCursor: result.nextCursor,
        });
    }
    catch (error){
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.get('/following', protect, async (req, res) => {
    const limit = Math.min(Number(req.query.limit) || 20, 50);
    const beforeTime = req.query.beforeTime ? new Date(req.query.beforeTime) : null;
    const beforeId = req.query.beforeId ? Number(req.query.beforeId) : null;
    const beforeBy = req.query.beforeBy ? Number(req.query.beforeBy) : null;

    if (beforeTime !== null && (!Number.isInteger(beforeId) || !Number.isInteger(beforeBy))) {
        return res.status(400).json({ error: 'Invalid cursor' });
    }

    try {
        const result = await getFollowingFeed({ viewerId: req.user.id, limit, beforeTime, beforeId, beforeBy });
        res.json(result);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.get('/:id', optionalAuth, async (req, res) => {
    const { id } = req.params;
    const userId = req.user?.id ?? null;

    try {
        const chirp = await pool.query(`
            SELECT c.*, u.display_name, u.username, u.profile_image_url,
                (SELECT COUNT(*) FROM likes l WHERE l.chirp_id = c.id)::int AS like_count,
                EXISTS (
                    SELECT 1 FROM likes l WHERE l.chirp_id = c.id AND l.user_id = $2
                ) AS liked_by_me
            FROM chirps c 
            JOIN users u ON c.user_id = u.id 
            WHERE c.id = $1`
            , [id, userId]);
        if (chirp.rows.length === 0) {
            return res.status(404).json({ error: 'Chirp not found' });
        }
        res.json(chirp.rows[0]);
    }
    catch {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.post("/", protect, async (req, res) => {
    const { content, quote_of_id } = req.body;
    const user_id = req.user?.id;

    if(!user_id) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!content) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        const newChirp = await pool.query(
            `WITH inserted AS (
                INSERT INTO chirps (user_id, content, quote_of_id)
                VALUES ($1, $2, $3)
                RETURNING *
            )
            SELECT inserted.*, u.display_name, u.username, u.profile_image_url, 0 AS like_count, false AS liked_by_me
            FROM inserted
            JOIN users u ON inserted.user_id = u.id`,
            [user_id, content, quote_of_id]
        );

        res.status(201).json(newChirp.rows[0]);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.put('/:id', protect, async (req, res) => {
    const { id } = req.params;
    const { content } = req.body;

    if(!req.user?.id) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!content) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        const updatedChirp = await pool.query(
            'UPDATE chirps SET content = $1 WHERE id = $2 AND user_id = $3 RETURNING *',
            [content, id, req.user.id]
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

router.delete('/:id', protect, async (req, res) => {
    const { id } = req.params;

    if(!req.user?.id) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        const deletedChirp = await pool.query('DELETE FROM chirps WHERE id = $1 AND user_id = $2 RETURNING *'
            ,[id, req.user.id]);

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