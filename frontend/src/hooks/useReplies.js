import { useInfiniteQuery } from '@tanstack/react-query';
import { fetchReplies } from '../api/chirps';

const PAGE_SIZE = 20;

export function useReplies(chirpId) {
    return useInfiniteQuery({
        queryKey: ['chirps', 'replies', chirpId],
        queryFn: ({ pageParam }) => fetchReplies({ chirpId, before: pageParam, limit: PAGE_SIZE }),
        initialPageParam: null,
        getNextPageParam: (lastPage) => lastPage.nextCursor,
        select: (data) => data.pages.flatMap((page) => page.chirps),
    });
}
