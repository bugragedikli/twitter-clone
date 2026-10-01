import { useInfiniteQuery } from '@tanstack/react-query';
import { fetchUserRechirps } from '../api/users';

const PAGE_SIZE = 10;

export function useUserRechirps(viewerId, userId) {
    return useInfiniteQuery({
        queryKey: ['chirps', 'rechirps', userId],
        queryFn: ({ pageParam }) => fetchUserRechirps({ userId, before: pageParam, limit: PAGE_SIZE }),
        initialPageParam: null,
        getNextPageParam: (lastPage) => lastPage.nextCursor,
        select: (data) => data.pages.flatMap((page) => page.chirps),
        enabled: !!userId,
    });
}
