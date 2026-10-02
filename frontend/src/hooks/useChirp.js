import { useQuery } from '@tanstack/react-query';
import { fetchChirpById } from '../api/chirps';

export function useChirp(chirpId) {
    return useQuery({
        queryKey: ['chirp', chirpId],
        queryFn: () => fetchChirpById(chirpId),
    });
}