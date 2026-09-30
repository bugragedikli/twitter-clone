import jwt from 'jsonwebtoken';
import pool from '../config/database.js';

export const protect = async (req, res, next) => {
    try{
        const token = req.cookies.token;

        if (!token) {
            return res.status(401).json({ message: 'Not authorized, no token' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await pool.query('SELECT * FROM users WHERE id = $1', [decoded.id]);

        if (!user.rows.length) {
            return res.status(401).json({ message: 'Not authorized, user not found' });
        }

        req.user = user.rows[0];
        next();
    }catch (error) {
        console.error(error);
        res.status(401).json({ message: 'Not authorized, token failed' });
    }
}

export const optionalAuth = (req, res, next) => {
    const token = req.cookies.token;

    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = { id: decoded.id };
        } catch {
            // Invalid or expired token: continue as a logged-out visitor
        }
    }

    next();
};