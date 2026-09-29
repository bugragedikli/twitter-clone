import api from './client';

const getMe = async () => {
    const res = await api.get('/auth/me');
    return res.data;
}

const login = async (form) => {
    const res = await api.post('/auth/login', form);
    return res.data;
}

const register = async (form) => {
    const res = await api.post('/auth/register', form);
    return res.data;
}

const logout = async () => {
    const res = await api.post('/auth/logout');
    return res.data;
}

export { getMe, login, register, logout };