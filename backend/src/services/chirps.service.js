import pool from '../config/database.js';

export async function getChirps({ limit, before = null, viewerId = null, authorId = null, followingOf = null }) {
    const result = await pool.query(`
        SELECT c.*, u.display_name, u.username, u.profile_image_url,
            (SELECT COUNT(*) FROM likes l WHERE l.chirp_id = c.id)::int AS like_count,
            EXISTS (
                SELECT 1 FROM likes l WHERE l.chirp_id = c.id AND l.user_id = $3
            ) AS liked_by_me
        FROM chirps c
        JOIN users u ON c.user_id = u.id
        WHERE ($2::int IS NULL
                OR (c.created_at, c.id) < (SELECT created_at, id FROM chirps WHERE id = $2))
            AND ($4::int IS NULL OR c.user_id = $4)
            AND ($5::int IS NULL OR c.user_id IN (
                SELECT following_id FROM follows WHERE follower_id = $5
            ))
        ORDER BY c.created_at DESC, c.id DESC
        LIMIT $1`,
        [limit + 1, before, viewerId, authorId, followingOf]);

    const hasMore = result.rows.length > limit;
    const chirps = hasMore ? result.rows.slice(0, limit) : result.rows;

    return {
        chirps,
        nextCursor: hasMore ? chirps[chirps.length - 1].id : null,
    };
}
