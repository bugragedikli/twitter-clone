import { useInfiniteQuery } from '@tanstack/react-query';
import { fetchUserReplies } from '../api/users';

const PAGE_SIZE = 10;

export function useUserReplies(viewerId, userId) {
    return useInfiniteQuery({
        queryKey: ['chirps', 'replies', userId],
        queryFn: ({ pageParam }) => fetchUserReplies({ userId, before: pageParam, limit: PAGE_SIZE }),
        initialPageParam: null,
        getNextPageParam: (lastPage) => lastPage.nextCursor,
        select: (data) => data.pages.flatMap((page) => page.chirps),
        enabled: !!userId,
    });
}
