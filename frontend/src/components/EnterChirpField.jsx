import {useState} from "react";
import DefaultProfileImage from '../assets/default-profile.jpg';
import { useCreateChirp } from "../hooks/useCreateChirp";

export default function EnterChirpField({ user }) {
    const [content, setContent] = useState('');
    const { mutate, isPending, isError } = useCreateChirp();

    const handleChirpSubmit = () => {
        const trimmed = content.trim();
        if (!trimmed) return;

        mutate(
            { user_id: user.id, content: trimmed },
            { onSuccess: () => setContent('') }
        );
    };

    return (
        <div>
            <div className="flex gap-2 not-last:border-(--accent-color) p-4">
                <img src={user?.profile_image_url || DefaultProfileImage} alt="Profile" className="w-10 h-10 rounded-full" />
                <textarea type="text" 
                placeholder="What's happening?" 
                className="p-2 w-full resize-none overflow-hidden" 
                rows={1}
                value={content}
                onChange={(e) => {
                    setContent(e.target.value);
                    e.target.style.height = 'auto';
                    e.target.style.height = `${e.target.scrollHeight}px`;
                    }
                } />
            </div>
            <div className="flex justify-end pr-4 pb-2">
                <button
                className="bg-(--primary-color) text-white leading-4.5 px-4 py-2 rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleChirpSubmit}
                disabled={isPending || !content.trim()}>
                    {isPending ? 'Chirping...' : 'Send Chirp'}
                </button>
                {isError && <p className="text-red-500 text-sm px-4">Chirp could not be sent.</p>}
            </div>
        </div>
    )
}