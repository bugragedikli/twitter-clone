import express from 'express';
import pool from '../config/database.js';
import { optionalAuth } from '../middleware/auth.js';
import { getFollowList } from '../services/follows.service.js';
import { getRechirpedChirps } from '../services/rechirps.service.js';
import { getReplyChirps } from '../services/replies.service.js';

const router = express.Router();

router.get('/:username', optionalAuth, async (req, res) => {
    const { username } = req.params;
    const viewerId = req.user?.id ?? null;

    try{
        if(!username) {
            return res.status(400).json({ message: 'Username is required' });
        }
        
        const result = await pool.query(`
            SELECT u.*,
                (SELECT COUNT(*) FROM chirps c WHERE c.user_id = u.id)::int AS chirps_count,
                (SELECT COUNT(*) FROM follows f WHERE f.following_id = u.id)::int AS followers_count,
                (SELECT COUNT(*) FROM follows f WHERE f.follower_id = u.id)::int AS following_count,
                EXISTS (
                    SELECT 1 FROM follows f WHERE f.follower_id = $2 AND f.following_id = u.id
                ) AS is_following
                FROM users u
            WHERE u.username = $1`
            , [username, viewerId]);

        if(result.rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json(result.rows[0]);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal server error' });
    }
});

const sendFollowList = async (req, res, type) => {
    const userId = Number(req.params.id);
    const limit = Math.min(Number(req.query.limit) || 20, 50);
    const before = req.query.before ? Number(req.query.before) : null;

    if (!Number.isInteger(userId) || (before !== null && !Number.isInteger(before))) {
        return res.status(400).json({ error: 'Invalid parameters' });
    }

    try {
        const data = await getFollowList({ userId, type, limit, before, viewerId: req.user?.id ?? null });
        res.json(data);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

router.get('/:id/followers', optionalAuth, (req, res) => sendFollowList(req, res, 'followers'));
router.get('/:id/followings', optionalAuth, (req, res) => sendFollowList(req, res, 'followings'));

router.get('/:id/rechirps', optionalAuth, async (req, res) => {
    const userId = Number(req.params.id);
    const limit = Math.min(Number(req.query.limit) || 20, 50);
    const before = req.query.before ? Number(req.query.before) : null;

    if (!Number.isInteger(userId) || (before !== null && !Number.isInteger(before))) {
        return res.status(400).json({ error: 'Invalid parameters' });
    }

    try {
        res.json(await getRechirpedChirps({ userId, limit, before, viewerId: req.user?.id ?? null }));
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.get('/:id/replies', optionalAuth, async (req, res) => {
    const userId = Number(req.params.id);
    const limit = Math.min(Number(req.query.limit) || 20, 50);
    const before = req.query.before ? Number(req.query.before) : null;

    if (!Number.isInteger(userId) || (before !== null && !Number.isInteger(before))) {
        return res.status(400).json({ error: 'Invalid parameters' });
    }

    try {
        res.json(await getReplyChirps({ userId, limit, before, viewerId: null, reply_to_id: null }));
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


export default router;