import pool from '../config/database.js';

export async function getRechirpedChirps({ userId, limit, before = null, viewerId = null }) {
    const result = await pool.query(`
        SELECT c.*, u.display_name, u.username, u.profile_image_url,
            r.created_at AS rechirped_at,
            ru.id          AS rechirped_by_id,
            ru.username     AS rechirped_by_username,
            ru.display_name AS rechirped_by_display_name,
            (SELECT COUNT(*) FROM likes l WHERE l.chirp_id = c.id)::int AS like_count,
            EXISTS (SELECT 1 FROM likes l WHERE l.chirp_id = c.id AND l.user_id = $3) AS liked_by_me,
            (SELECT COUNT(*) FROM rechirps r2 WHERE r2.chirp_id = c.id)::int AS rechirp_count,
            EXISTS (SELECT 1 FROM rechirps r2 WHERE r2.chirp_id = c.id AND r2.user_id = $3) AS rechirped_by_me,
            CASE WHEN q.id IS NULL THEN NULL ELSE json_build_object(
                'id',                q.id,
                'content',           q.content,
                'created_at',        q.created_at,
                'username',          qu.username,
                'display_name',      qu.display_name,
                'profile_image_url', qu.profile_image_url
            ) END AS quoted_chirp
        FROM rechirps r
        JOIN chirps c ON r.chirp_id = c.id
        JOIN users u ON c.user_id = u.id
        JOIN users ru  ON r.user_id = ru.id
        LEFT JOIN chirps q  ON q.id  = c.quote_of_id
        LEFT JOIN users  qu ON qu.id = q.user_id
        WHERE r.user_id = $4
            AND ($2::int IS NULL
                OR (r.created_at, r.chirp_id) < (
                    SELECT created_at, chirp_id FROM rechirps WHERE user_id = $4 AND chirp_id = $2
                ))
        ORDER BY r.created_at DESC, r.chirp_id DESC
        LIMIT $1`,
        [limit + 1, before, viewerId, userId]);

    const hasMore = result.rows.length > limit;
    const chirps = hasMore ? result.rows.slice(0, limit) : result.rows;
    return { chirps, nextCursor: hasMore ? chirps[chirps.length - 1].id : null };
}
