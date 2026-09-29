import api from './client';

const fetchChirps = async ({tab, before, limit}) =>{
    const route = tab === "following" 
    ? "/chirps/following" 
    : "/chirps";

    const res = await api.get(route, { params: { limit, before } });
    return res.data;
};

const createChirp = async ({user_id, content}) => {
    const res = await api.post('/chirps', { user_id, content });
    return res.data;
}

export { fetchChirps, createChirp };