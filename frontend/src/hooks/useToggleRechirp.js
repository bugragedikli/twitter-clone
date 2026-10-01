import { useMutation, useQueryClient } from '@tanstack/react-query';
import { rechirp, unrechirp } from '../api/rechirps';

const updateChirpInFeed = (old, chirpId, rechirped) => {
    if (!old?.pages) return old;

    return {
        ...old,
        pages: old.pages.map((page) => ({
            ...page,
            chirps: page.chirps.map((chirp) =>
                chirp.id === chirpId
                    ? { ...chirp, rechirped_by_me: rechirped, rechirp_count: chirp.rechirp_count + (rechirped ? 1 : -1) }
                    : chirp
            ),
        })),
    };
};

export function useToggleRechirp() {
    const queryClient = useQueryClient();

    return useMutation({
        // rechirped: the state we want to move to (true = rechirp, false = unrechirp)
        mutationFn: ({ chirpId, rechirped }) => rechirped ? rechirp(chirpId) : unrechirp(chirpId),

        onMutate: async ({ chirpId, rechirped }) => {
            await queryClient.cancelQueries({ queryKey: ['chirps'] });
            const previous = queryClient.getQueriesData({ queryKey: ['chirps'] });

            queryClient.setQueriesData({ queryKey: ['chirps'] }, (old) => updateChirpInFeed(old, chirpId, rechirped));

            return { previous };
        },

        onError: (_error, _variables, context) => {
            context?.previous.forEach(([key, data]) => queryClient.setQueryData(key, data));
        },
    });
}
