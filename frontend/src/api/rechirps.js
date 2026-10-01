import api from './client.js';

const rechirp = (chirpId) => {
    return api.post(`/chirps/${chirpId}/rechirps`);
};

const unrechirp = (chirpId) => {
    return api.delete(`/chirps/${chirpId}/rechirps`);
};

export { rechirp, unrechirp };