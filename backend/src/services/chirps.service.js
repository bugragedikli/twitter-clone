import pool from '../config/database.js';

export async function getChirps({ limit, before = null, viewerId = null, authorId = null, replyTo = null }) {
    const result = await pool.query(`
        SELECT c.*, u.display_name, u.username, u.profile_image_url,
            (SELECT COUNT(*) FROM likes l WHERE l.chirp_id = c.id)::int AS like_count,
            EXISTS (
                SELECT 1 FROM likes l WHERE l.chirp_id = c.id AND l.user_id = $3
            ) AS liked_by_me,
            (SELECT COUNT(*) FROM rechirps r WHERE r.chirp_id = c.id)::int AS rechirp_count,
            EXISTS (
                SELECT 1 FROM rechirps r WHERE r.chirp_id = c.id AND r.user_id = $3
            ) AS rechirped_by_me,
            (SELECT COUNT(*) FROM chirps rp WHERE rp.reply_to_id = c.id)::int AS reply_count,
            pu.username AS reply_to_username,
            CASE WHEN q.id IS NULL THEN NULL ELSE json_build_object(
                'id',                q.id,
                'content',           q.content,
                'created_at',        q.created_at,
                'username',          qu.username,
                'display_name',      qu.display_name,
                'profile_image_url', qu.profile_image_url
            ) END AS quoted_chirp
        FROM chirps c
        JOIN users u ON c.user_id = u.id
        LEFT JOIN chirps p  ON p.id  = c.reply_to_id
        LEFT JOIN users  pu ON pu.id = p.user_id
        LEFT JOIN chirps q  ON q.id  = c.quote_of_id
        LEFT JOIN users  qu ON qu.id = q.user_id
        WHERE ($2::int IS NULL
                OR (c.created_at, c.id) < (SELECT created_at, id FROM chirps WHERE id = $2))
            AND ($4::int IS NULL OR c.user_id = $4)
            AND (($5::int IS NULL AND c.reply_to_id IS NULL) OR c.reply_to_id = $5)
        ORDER BY c.created_at DESC, c.id DESC
        LIMIT $1`,
        [limit + 1, before, viewerId, authorId, replyTo]);

    const hasMore = result.rows.length > limit;
    const chirps = hasMore ? result.rows.slice(0, limit) : result.rows;

    return {
        chirps,
        nextCursor: hasMore ? chirps[chirps.length - 1].id : null,
    };
}

export async function getFollowingFeed({ viewerId, limit, beforeTime = null, beforeId = null, beforeBy = null}) {
    const result = await pool.query(`
        WITH feed AS (
            -- chirps written by people the viewer follows
            SELECT c.id AS chirp_id, c.created_at AS sort_time, NULL::int AS rechirper_id
            FROM chirps c
            WHERE c.reply_to_id IS NULL
                AND (c.user_id = $1
                    OR c.user_id IN (SELECT following_id FROM follows WHERE follower_id = $1))

            UNION ALL

            -- chirps rechirped by people the viewer follows
            SELECT r.chirp_id, r.created_at, r.user_id
            FROM rechirps r
            WHERE r.user_id = $1
                OR r.user_id IN (SELECT following_id FROM follows WHERE follower_id = $1)

        )
        SELECT c.*, u.display_name, u.username, u.profile_image_url,
            f.sort_time::text AS sort_time,
            ru.id          AS rechirped_by_id,
            ru.username     AS rechirped_by_username,
            ru.display_name AS rechirped_by_display_name,
            (SELECT COUNT(*) FROM likes l WHERE l.chirp_id = c.id)::int AS like_count,
            EXISTS (
                SELECT 1 FROM likes l WHERE l.chirp_id = c.id AND l.user_id = $1
            ) AS liked_by_me,
            (SELECT COUNT(*) FROM rechirps r2 WHERE r2.chirp_id = c.id)::int AS rechirp_count,
            EXISTS (
                SELECT 1 FROM rechirps r2 WHERE r2.chirp_id = c.id AND r2.user_id = $1
            ) AS rechirped_by_me,
            (SELECT COUNT(*) FROM chirps rp WHERE rp.reply_to_id = c.id)::int AS reply_count,
            CASE WHEN q.id IS NULL THEN NULL ELSE json_build_object(
                'id',                q.id,
                'content',           q.content,
                'created_at',        q.created_at,
                'username',          qu.username,
                'display_name',      qu.display_name,
                'profile_image_url', qu.profile_image_url
            ) END AS quoted_chirp
        FROM feed f
        JOIN chirps c      ON c.id = f.chirp_id
        JOIN users u       ON u.id = c.user_id
        LEFT JOIN users ru ON ru.id = f.rechirper_id
        LEFT JOIN chirps q  ON q.id  = c.quote_of_id
        LEFT JOIN users  qu ON qu.id = q.user_id
        WHERE $3::timestamptz IS NULL
            OR (f.sort_time, f.chirp_id, COALESCE(f.rechirper_id, 0)) < ($3::timestamptz, $4::int, $5::int)
        ORDER BY f.sort_time DESC, f.chirp_id DESC, COALESCE(f.rechirper_id, 0) DESC
        LIMIT $2`,
        [viewerId, limit + 1, beforeTime, beforeId, beforeBy]);

    const hasMore = result.rows.length > limit;
    const chirps = hasMore ? result.rows.slice(0, limit) : result.rows;
    const last = chirps[chirps.length - 1];

    return {
        chirps,
        nextCursor: hasMore
            ? { time: last.sort_time, chirpId: last.id, by: last.rechirped_by_id ?? 0 }
            : null
    };
}

