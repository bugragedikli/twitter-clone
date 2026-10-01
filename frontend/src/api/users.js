import api from './client';

const fetchUser = async (username) => {
    const res = await api.get(`/users/${username}`);
    return res.data;
};

const fetchUserChirps = async ({ userId, limit = 20, before = null, viewerId }) => {
    const res = await api.get(`/chirps`, {
        params: {
            limit,
            before,
            viewerId,
            authorId: userId,
        }
    });
    return res.data;
};

const fetchFollowList = async ({ userId, type, before = null, limit = 20 }) => {
    const res = await api.get(`/users/${userId}/${type}`, { params: { limit, before } });
    return res.data;
};

const fetchUserRechirps = async ({ userId, before = null, limit = 20 }) => {
    const res = await api.get(`/users/${userId}/rechirps`, { params: { limit, before } });
    return res.data;
};

export { fetchUser, fetchUserChirps, fetchFollowList, fetchUserRechirps };