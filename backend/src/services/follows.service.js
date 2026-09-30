import pool from '../config/database.js';

// followers: people who follow userId  → match on following_id, list follower_id
// followings: people userId follows    → match on follower_id, list following_id
const DIRECTIONS = {
    followers: { match: 'following_id', other: 'follower_id' },
    followings: { match: 'follower_id', other: 'following_id' },
};

export async function getFollowList({ userId, type, limit, before = null, viewerId = null }) {
    const { match, other } = DIRECTIONS[type];

    const result = await pool.query(`
        SELECT u.id, u.username, u.display_name, u.profile_image_url, u.bio,
            EXISTS (
                SELECT 1 FROM follows v WHERE v.follower_id = $4 AND v.following_id = u.id
            ) AS is_following
        FROM follows f
        JOIN users u ON u.id = f.${other}
        WHERE f.${match} = $1
            AND ($2::int IS NULL OR (f.created_at, u.id) < (
                SELECT created_at, ${other} FROM follows
                WHERE ${match} = $1 AND ${other} = $2
            ))
        ORDER BY f.created_at DESC, u.id DESC
        LIMIT $3`,
        [userId, before, limit + 1, viewerId]);

    const hasMore = result.rows.length > limit;
    const users = hasMore ? result.rows.slice(0, limit) : result.rows;

    return {
        users,
        nextCursor: hasMore ? users[users.length - 1].id : null,
    };
}
