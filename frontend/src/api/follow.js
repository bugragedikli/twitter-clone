import api from './client';

const followUser = (followedId) => {
    return api.post(`/users/${followedId}/follow`);
}

const unfollowUser = (followedId) => {
    return api.delete(`/users/${followedId}/follow`);
}

export { followUser, unfollowUser};