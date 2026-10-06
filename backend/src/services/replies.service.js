import pool from '../config/database.js';

export async function getReplyChirps({ userId, limit, before = null, viewerId = null}) {
    const result = await pool.query(`
        SELECT c.*, u.display_name, u.username, u.profile_image_url,
            pu.username AS reply_to_username,
            (SELECT COUNT(*) FROM likes l WHERE l.chirp_id = c.id)::int AS like_count,
            EXISTS (SELECT 1 FROM likes l WHERE l.chirp_id = c.id AND l.user_id = $3) AS liked_by_me,
            (SELECT COUNT(*) FROM rechirps r2 WHERE r2.chirp_id = c.id)::int AS rechirp_count,
            EXISTS (SELECT 1 FROM rechirps r2 WHERE r2.chirp_id = c.id AND r2.user_id = $3) AS rechirped_by_me,
            (SELECT COUNT(*) FROM chirps rp WHERE rp.reply_to_id = c.id)::int AS reply_count,
            CASE WHEN q.id IS NULL THEN NULL ELSE json_build_object(
                'id',                q.id,
                'content',           q.content,
                'created_at',        q.created_at,
                'username',          qu.username,
                'display_name',      qu.display_name,
                'profile_image_url', qu.profile_image_url
            ) END AS quoted_chirp
        FROM chirps c
        JOIN users u        ON u.id  = c.user_id
        LEFT JOIN chirps p  ON p.id  = c.reply_to_id
        LEFT JOIN users  pu ON pu.id = p.user_id
        LEFT JOIN chirps q  ON q.id  = c.quote_of_id
        LEFT JOIN users  qu ON qu.id = q.user_id
        WHERE c.user_id = $4
            AND c.reply_to_id IS NOT NULL
            AND ($2::int IS NULL
                OR (c.created_at, c.id) < (SELECT created_at, id FROM chirps WHERE id = $2))
        ORDER BY c.created_at DESC, c.id DESC
        LIMIT $1`,
        [limit + 1, before, viewerId, userId]);

    const hasMore = result.rows.length > limit;
    const chirps = hasMore ? result.rows.slice(0, limit) : result.rows;
    return { chirps, nextCursor: hasMore ? chirps[chirps.length - 1].id : null };
}
