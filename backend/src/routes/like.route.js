import express from "express";
import pool from "../config/database.js";
import { protect } from "../middleware/auth.js";

const router = express.Router({ mergeParams: true });

router.post("/", protect, async (req, res) => {
    const chirpId = req.params.id;
    const userId = req.user.id;

    try {
        const result = await pool.query(
            "INSERT INTO likes (chirp_id, user_id) VALUES ($1, $2) RETURNING *",
            [chirpId, userId]
        );
        res.status(201).json(result.rows[0]);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.delete("/", protect, async (req, res) => {
    try{
        const chirpId = req.params.id;
        const userId = req.user.id;

        const result = await pool.query(
            "DELETE FROM likes WHERE chirp_id = $1 AND user_id = $2 RETURNING *",
            [chirpId, userId]
        );
        res.status(200).json(result.rows[0]);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

export default router;