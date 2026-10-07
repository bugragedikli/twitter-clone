import express from 'express';
import bcrypet from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../config/database.js';
import { protect } from '../middleware/auth.js';
import { USERNAME_PATTERN, RESERVED_USERNAMES, MIN_PASSWORD_LENGTH } from '../config/constants.js';

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
    const { username, password } = req.body;

    if (!username || !req.body.email || !password) {
        return res.status(400).json({ message: 'Please fill in all fields.' });
    }

    if (typeof username !== 'string' || typeof req.body.email !== 'string' || typeof password !== 'string') {
        return res.status(400).json({ message: 'Please fill in all fields.' });
    }

    if (!USERNAME_PATTERN.test(username)) {
        return res.status(400).json({ message: 'Username must be 3-15 characters and can only contain letters, numbers and underscores (_).' });
    }

    // React Router matches paths case-insensitively, so "Login" would also open the login page
    if (RESERVED_USERNAMES.includes(username.toLowerCase())) {
        return res.status(400).json({ message: 'This username is not available. Please choose another one.' });
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
        return res.status(400).json({ message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters long.` });
    }

    // Emails are stored lowercase so Test@x.com and test@x.com are the same account
    const email = req.body.email.trim().toLowerCase();

    const userMailExists = await pool.query('SELECT * FROM users WHERE LOWER(email) = $1', [email]);

    if (userMailExists.rows.length > 0) {
        return res.status(400).json({ message: 'An account with this email already exists. Try signing in instead.' });
    }

    const userNameExists = await pool.query('SELECT * FROM users WHERE username = $1', [username]);

    if (userNameExists.rows.length > 0) {
        return res.status(400).json({ message: 'This username is already taken. Please choose another one.' });
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
        return res.status(400).json({ message: 'Please fill in all fields.' });
    }

    if (typeof email !== 'string' || typeof password !== 'string') {
        return res.status(400).json({ message: 'Incorrect email or password.' });
    }

    const user = await pool.query('SELECT * FROM users WHERE LOWER(email) = $1', [email.trim().toLowerCase()]);

    if (user.rows.length === 0) {
        return res.status(400).json({ message: 'Incorrect email or password.' });
    }

    const userData = user.rows[0];

    const isMatch = await bcrypet.compare(password, userData.password_hash);

    if (!isMatch) {
        return res.status(400).json({ message: 'Incorrect email or password.' });
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