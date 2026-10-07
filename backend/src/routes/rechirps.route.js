import express from 'express';
import pool from '../config/database.js';
import { protect } from '../middleware/auth.js';

const router = express.Router({ mergeParams: true });

router.post('/', protect, async (req, res) => {
    const chirpId = req.params.id;
    const userId = req.user.id;

    if (!Number.isInteger(Number(chirpId)) || chirpId <= 0) {
        return res.status(400).json({ message: 'Invalid chirp ID' });
    }

    try{
        const result = await pool.query(
            'INSERT INTO rechirps (chirp_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING RETURNING *',
            [chirpId, userId]
        );

        if(!result.rows[0]){
            return res.status(409).json({ message: 'Already rechirped' });
        }

        res.status(201).json(result.rows[0]);
    }
    catch(err){
        if (err.code === '23503') {
            return res.status(404).json({ message: 'Chirp not found' });
        }
        console.error(err);
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.delete('/', protect, async (req, res) => {
    const chirpId = req.params.id;
    const userId = req.user.id;

    if (!Number.isInteger(Number(chirpId)) || chirpId <= 0) {
        return res.status(400).json({ message: 'Invalid chirp ID' });
    }

    try{
        const result = await pool.query(
            'DELETE FROM rechirps WHERE chirp_id = $1 AND user_id = $2 RETURNING *',
            [chirpId, userId]
        );

        if(!result.rows[0]){
            return res.status(404).json({ message: 'Rechirp not found' });
        }

        res.status(200).json(result.rows[0]);
    }
    catch(err){
        console.error(err);
        res.status(500).json({ message: 'Internal server error' });
    }
});

export default router;
