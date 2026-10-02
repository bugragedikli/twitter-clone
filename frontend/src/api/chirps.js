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

const createChirp = async ({content, quote_of_id}) => {
    const res = await api.post('/chirps', {content, quote_of_id });
    return res.data;
}

export { fetchChirps, createChirp };