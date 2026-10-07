export const MAX_CHIRP_LENGTH = 280;

// 3-15 characters: letters, numbers and underscore
export const USERNAME_PATTERN = /^[A-Za-z0-9_]{3,15}$/;

// Profiles live at /:username, so a username can't match a fixed frontend route.
// Keep this in sync when a new top-level route is added in frontend/src/App.jsx.
export const RESERVED_USERNAMES = [
    'login', 'register', 'logout',
    'home', 'explore', 'search', 'notifications', 'messages', 'settings',
    'admin', 'api',
];

export const MIN_PASSWORD_LENGTH = 8;
