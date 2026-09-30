import { useInfiniteQuery } from '@tanstack/react-query';
import { fetchUserChirps } from '../api/users';

const PAGE_SIZE = 10;

export function useUserChirps(viewerId, userId) {
    return useInfiniteQuery({
        queryKey: ['chirps', 'user', userId],
        queryFn: ({ pageParam }) => fetchUserChirps({ userId, before: pageParam, limit: PAGE_SIZE, viewerId }),
        initialPageParam: null,
        getNextPageParam: (lastPage) => lastPage.nextCursor,
        select: (data) => data.pages.flatMap((page) => page.chirps),
        enabled: !!userId,
    });
}
