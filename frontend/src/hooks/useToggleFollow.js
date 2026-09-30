import { useMutation, useQueryClient } from '@tanstack/react-query';
import { followUser, unfollowUser } from '../api/follow';

const updateProfile = (old, userId, follow) => {
    if (!old || old.id !== userId) return old;

    return {
        ...old,
        is_following: follow,
        followers_count: old.followers_count + (follow ? 1 : -1),
    };
};

const updateFollowList = (old, userId, follow) => {
    if (!old?.pages) return old;

    return {
        ...old,
        pages: old.pages.map((page) => ({
            ...page,
            users: page.users.map((u) => (u.id === userId ? { ...u, is_following: follow } : u)),
        })),
    };
};

export function useToggleFollow() {
    const queryClient = useQueryClient();

    return useMutation({
        // follow: the state we want to move to (true = follow, false = unfollow)
        mutationFn: ({ userId, follow }) => follow ? followUser(userId) : unfollowUser(userId),

        onMutate: async ({ userId, follow }) => {
            await queryClient.cancelQueries({ queryKey: ['profile'] });
            await queryClient.cancelQueries({ queryKey: ['follows'] });

            const previous = [
                ...queryClient.getQueriesData({ queryKey: ['profile'] }),
                ...queryClient.getQueriesData({ queryKey: ['follows'] }),
            ];

            queryClient.setQueriesData({ queryKey: ['profile'] }, (old) => updateProfile(old, userId, follow));
            queryClient.setQueriesData({ queryKey: ['follows'] }, (old) => updateFollowList(old, userId, follow));

            return { previous };
        },

        onError: (_error, _variables, context) => {
            context?.previous.forEach(([key, data]) => queryClient.setQueryData(key, data));
        },

        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['chirps', 'following'] });
            // Counts on other profiles (e.g. your own following_count) and the lists themselves
            // change too; mark them stale without refetching the list that is on screen right now
            queryClient.invalidateQueries({ queryKey: ['profile'], refetchType: 'none' });
            queryClient.invalidateQueries({ queryKey: ['follows'], refetchType: 'none' });
        },
    });
}
