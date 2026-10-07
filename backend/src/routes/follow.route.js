import express from "express";
import pool from "../config/database.js";
import { protect } from "../middleware/auth.js";

const router = express.Router({ mergeParams: true });

router.post("/", protect, async (req, res) => {
    const followingId = Number(req.params.followingId);
    const followerId = req.user.id;

    try {
        if (followerId === followingId) {
            return res.status(400).json({ error: 'You cannot follow yourself' });
        }

        if (!followingId || isNaN(followingId)) {
            return res.status(400).json({ error: 'Invalid followingId' });
        }

        if (!Number.isInteger(followerId) || !Number.isInteger(Number(followingId))) {
            return res.status(400).json({ error: 'Invalid user ID' });
        }

        const result = await pool.query(
            "INSERT INTO follows (follower_id, following_id) VALUES ($1, $2) ON CONFLICT DO NOTHING RETURNING *",
            [followerId, followingId]
        );

        if (result.rows.length === 0) {
            return res.status(409).json({ error: 'Already following this user' });
        }

        res.status(201).json(result.rows[0]);
    }
    catch (error) {
        if (error.code === '23503') {
            return res.status(404).json({ error: 'User not found' });
        }
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.delete("/", protect, async (req, res) => {
    const followingId = Number(req.params.followingId);
    const followerId = req.user.id;

    try {
        if (!followingId || isNaN(followingId)) {
            return res.status(400).json({ error: 'Invalid followingId' });
        }

        if (!Number.isInteger(followerId) || !Number.isInteger(Number(followingId))) {
            return res.status(400).json({ error: 'Invalid user ID' });
        }

        const result = await pool.query(
            "DELETE FROM follows WHERE follower_id = $1 AND following_id = $2 RETURNING *",
            [followerId, followingId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Failed to unfollow user' });
        }

        res.status(200).json(result.rows[0]);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

export default router;