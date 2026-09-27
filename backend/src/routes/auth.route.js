import express from 'express';
import bcrypet from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../config/database.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
}

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
         expiresIn: '30d' 
    });
}

router.post('/register', async (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ message: 'Please provide all required fields' });
    }

    const userExists = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

    if (userExists.rows.length > 0) {
        return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypet.hash(password, 10);

    const newUser = await pool.query(
        'INSERT INTO users (username, email, password_hash, display_name) VALUES ($1, $2, $3, $1) RETURNING id, username, email, display_name',
        [username, email, hashedPassword]
    );

    const token = generateToken(newUser.rows[0].id);

    res.cookie('token', token, cookieOptions);

    res.status(201).json({ user: newUser.rows[0] });
});

router.post('/login', async (req, res) => {
    const { email, password} = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Please provide all required fields' });
    }

    const user = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

    if (user.rows.length === 0) {
        return res.status(400).json({ message: 'Invalid credentials' });
    }

    const userData = user.rows[0];

    const isMatch = await bcrypet.compare(password, userData.password_hash);

    if (!isMatch) {
        return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = generateToken(userData.id);

    res.cookie('token', token, cookieOptions);

    res.json({ user: { id: userData.id, username: userData.username, email: userData.email, profile_image_url: userData.profile_image_url, display_name: userData.display_name } });
});

//Me
router.get('/me', protect, async (req, res) => {
    res.json(req.user);
    //return info of the logged in user, which is stored in req.user by the auth middleware
});

router.post('/logout', (req, res) => {
    res.clearCookie('token', cookieOptions);
    res.json({ message: 'Logged out successfully' });
});

export default router;