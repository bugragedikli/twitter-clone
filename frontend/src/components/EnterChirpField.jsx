import {useState} from "react";
import axios from "axios";
import DefaultProfileImage from '../assets/default-profile.jpg';

export default function EnterChirpField({ user , handleNewChirp}) {
    const [content, setContent] = useState('');

    const handleChirpSubmit = async () => {
        if (!content.trim()) {
            return;
        }

        // Submit the chirp
        try {
            const res = await axios.post('http://localhost:3000/chirps', {
                user_id: user.id,
                content: content.trim(),
            });
            setContent('');
            handleNewChirp(res.data);
        } catch (error) {
            console.error('Error submitting chirp:', error);
        }
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
                className="bg-(--primary-color) text-white leading-4.5 px-4 py-2 rounded-full"
                onClick={handleChirpSubmit}>
                    Send Chirp
                </button>
            </div>
        </div>
    )
}