// Turns an axios error into a message the user can act on
export default function getErrorMessage(err, fallback = 'Something went wrong. Please try again.') {
    // No response at all: the server is down or the user is offline
    if (!err.response) {
        return "Can't reach the server. Check your connection and try again.";
    }

    // 5xx: our fault, the server's message would not help the user
    if (err.response.status >= 500) {
        return 'Something went wrong on our side. Please try again in a moment.';
    }

    // 4xx: the backend explains what was wrong (auth routes use `message`, others use `error`)
    return err.response.data?.message || err.response.data?.error || fallback;
}
