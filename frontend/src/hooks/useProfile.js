import { useQuery } from '@tanstack/react-query';
import { fetchUser } from '../api/users';

export function useProfile(username) {
    return useQuery({
        queryKey: ['profile', username],
        queryFn: () => fetchUser(username),
    });
}