import { useInfiniteQuery } from "@tanstack/react-query";
import { fetchFollowList } from "../api/users";

const PAGE_SIZE = 20;

export function useFollowList(userId, type) {
    return useInfiniteQuery({
        queryKey: ['follows', type, userId],
        queryFn: ({ pageParam }) => fetchFollowList({ userId, type, before: pageParam, limit: PAGE_SIZE }),
        initialPageParam: null,
        getNextPageParam: (lastPage) => lastPage.nextCursor,
        select: (data) => data.pages.flatMap((page) => page.users),
        enabled: !!userId,
    });
}