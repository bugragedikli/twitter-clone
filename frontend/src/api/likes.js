import api from './client.js';

const likeChirp = (chirpId) => {
    return api.post(`/chirps/${chirpId}/likes`);
};

const unlikeChirp = (chirpId) => {
    return api.delete(`/chirps/${chirpId}/likes`);
};

export { likeChirp, unlikeChirp };