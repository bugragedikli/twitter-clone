import api from './client';

const fetchChirps = async ({ tab, before, limit }) => {
    if (tab === "following") {
        const params = { limit };
        if (before) {
            params.beforeTime = before.time;
            params.beforeId = before.chirpId;
            params.beforeBy = before.by;
        }
        const res = await api.get("/chirps/following", { params });
        return res.data;
    }

    const res = await api.get("/chirps", { params: { limit, before } });
    return res.data;
};

const createChirp = async ({content, quote_of_id, reply_to_id}) => {
    const res = await api.post('/chirps', {content, quote_of_id, reply_to_id });
    return res.data;
}

const fetchChirpById = async (chirpId) => {
    const res = await api.get(`/chirps/${chirpId}`);
    return res.data;
}

const fetchReplies = async ({ chirpId, before, limit }) => {
    const res = await api.get(`/chirps/${chirpId}/replies`, { params: { before, limit } });
    return res.data;
}

export { fetchChirps, createChirp, fetchChirpById, fetchReplies };