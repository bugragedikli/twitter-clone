import express from "express";
import pool from "../config/database.js";
import { protect } from "../middleware/auth.js";

const router = express.Router({ mergeParams: true });

router.post("/", protect, async (req, res) => {
    const chirpId = req.params.id;
    const userId = req.user.id;

    if (!Number.isInteger(Number(chirpId)) || chirpId <= 0) {
        return res.status(400).json({ error: 'Invalid chirp ID' });
    }

    try {
        const result = await pool.query(
            `INSERT INTO likes (chirp_id, user_id) 
            VALUES ($1, $2) 
            ON CONFLICT DO NOTHING
            RETURNING *`,
            [chirpId, userId]
        );

        if (result.rows.length == 0) {
            return res.status(409).json({ error: 'Like already exists' });
        }

        res.status(201).json(result.rows[0]);
    }
    catch (error) {
        if (error.code === '23503') {
            return res.status(404).json({ error: 'Chirp not found' });
        }
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.delete("/", protect, async (req, res) => {
    try{
        const chirpId = req.params.id;
        const userId = req.user.id;

        if (!Number.isInteger(Number(chirpId)) || chirpId <= 0) {
            return res.status(400).json({ error: 'Invalid chirp ID' });
        }

        const result = await pool.query(
            `DELETE FROM likes WHERE chirp_id = $1 AND user_id = $2 RETURNING *`,
            [chirpId, userId]
        );

        if (result.rows.length == 0) {
            return res.status(404).json({ error: 'Like not found' });
        }

        if (result.rows[0].liked_by_me) {
            return res.status(500).json({ error: 'Failed to delete like' });
        }

        res.status(200).json(result.rows[0]);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

export default router;