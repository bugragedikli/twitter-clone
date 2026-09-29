import { useInfiniteQuery } from '@tanstack/react-query';
import { fetchChirps } from '../api/chirps';

const PAGE_SIZE = 20;

export function useFeed(tab) {
    return useInfiniteQuery({
        queryKey: ['chirps', tab],
        queryFn: async ({ pageParam }) => fetchChirps({ tab, before: pageParam, limit: PAGE_SIZE }),
        initialPageParam: null,
        getNextPageParam: (lastPage) => lastPage.nextCursor,
        select: (data) => data.pages.flatMap((page) => page.chirps),
        staleTime: Infinity,
    });
}