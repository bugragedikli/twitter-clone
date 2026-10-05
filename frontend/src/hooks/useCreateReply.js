import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createChirp } from '../api/chirps';

export function useCreateReply(chirpId) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (content) => createChirp({ content, reply_to_id: Number(chirpId) }),
        onSuccess: (newReply) => {
            // Add the new reply to the top of the list
            queryClient.setQueryData(['chirps', 'replies', chirpId], (old) => {
                if (!old) return old;
                const [firstPage, ...otherPages] = old.pages;
                return {
                    ...old,
                    pages: [{ ...firstPage, chirps: [newReply, ...firstPage.chirps] }, ...otherPages],
                };
            });
            // Bump the parent's reply count
            queryClient.setQueryData(['chirp', chirpId], (old) =>
                old ? { ...old, reply_count: old.reply_count + 1 } : old
            );
        },
    });
}
