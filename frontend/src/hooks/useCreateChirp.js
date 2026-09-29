import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createChirp } from '../api/chirps';

const addChirpToFeed = (old, newChirp) => {
    if (!old) return old;

    const [firstPage, ...otherPages] = old.pages;

    return {
        ...old,
        pages: [
            { ...firstPage, chirps: [newChirp, ...firstPage.chirps] },
            ...otherPages,
        ],
    };
};

export function useCreateChirp() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: createChirp,
        onSuccess: (newChirp) => {
            // Update the feed and following queries
            queryClient.setQueryData(['chirps', 'feed'], (old) => addChirpToFeed(old, newChirp));
            queryClient.setQueryData(['chirps', 'following'], (old) => addChirpToFeed(old, newChirp));
        },
    });
}