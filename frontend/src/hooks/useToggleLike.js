import { useMutation, useQueryClient } from '@tanstack/react-query';
import { likeChirp, unlikeChirp } from '../api/likes';

const updateChirpInFeed = (old, chirpId, liked) => {
    if (!old?.pages) return old;

    return {
        ...old,
        pages: old.pages.map((page) => ({
            ...page,
            chirps: page.chirps.map((chirp) =>
                chirp.id === chirpId
                    ? { ...chirp, liked_by_me: liked, like_count: chirp.like_count + (liked ? 1 : -1) }
                    : chirp
            ),
        })),
    };
};

export function useToggleLike() {
    const queryClient = useQueryClient();

    return useMutation({
        // liked: the state we want to move to (true = like, false = unlike)
        mutationFn: ({ chirpId, liked }) => liked ? likeChirp(chirpId) : unlikeChirp(chirpId),

        onMutate: async ({ chirpId, liked }) => {
            await queryClient.cancelQueries({ queryKey: ['chirps'] });
            const previous = queryClient.getQueriesData({ queryKey: ['chirps'] });

            queryClient.setQueriesData({ queryKey: ['chirps'] }, (old) => updateChirpInFeed(old, chirpId, liked));

            return { previous };
        },

        onError: (_error, _variables, context) => {
            context?.previous.forEach(([key, data]) => queryClient.setQueryData(key, data));
        },

        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['chirp'] });
        }
    });
}
