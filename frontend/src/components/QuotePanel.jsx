import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import DefaultProfileImage from '../assets/default-profile.jpg';
import { useCreateChirp } from '../hooks/useCreateChirp';

export default function QuotePanel({ user, chirp, onClose }) {
    const [content, setContent] = useState('');
    const { mutate, isPending, isError } = useCreateChirp();

    // Close with the Escape key
    useEffect(() => {
        const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', handleKey);
        return () => document.removeEventListener('keydown', handleKey);
    }, [onClose]);

    const handleQuote = () => {
        const trimmed = content.trim();
        if (!trimmed) return;

        mutate(
            { content: trimmed, quote_of_id: chirp.id },
            { onSuccess: onClose }
        );
    };

    return createPortal(
        <div
            className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 pt-16"
            onClick={onClose}
        >
            <div
            className="w-full max-w-xl bg-(--background-color) rounded-2xl"
            onClick={(e) => e.stopPropagation()}
            >
                <div className="p-4">
                    <div className="bg-(--background-color) rounded-2xl w-full">
                    {/* Header */}
                    <button onClick={onClose} className="flex justify-center items-center text-white rounded-full font-bold mb-4 size-8 hover:bg-(--primary-color-hover)/10 transition-colors duration-300">
                        ✕
                    </button>
                        <div className="flex gap-2">
                            <img src={user.profile_image_url || DefaultProfileImage} alt="Profile" className="w-10 h-10 rounded-full" />
                            <div className="flex flex-col gap-2 w-full">
                                <textarea
                                    autoFocus
                                    value={content}
                                    rows={1}
                                    onChange={(e) => {
                                        setContent(e.target.value);
                                        e.target.style.height = 'auto';
                                        e.target.style.height = `${e.target.scrollHeight}px`;
                                        }
                                    }
                                    placeholder="What's happening?"
                                    className="w-full bg-(--background-color) text-xl font-light text-white p-2 rounded-lg focus:outline-none resize-none overflow-hidden"
                                />
                                <div className="border border-(--accent-color) rounded-xl p-2">
                                    <div className="flex gap-2 items-center">
                                        <img src={chirp.profile_image_url || DefaultProfileImage} alt="Profile" className="size-6 rounded-full" />
                                        <div className="flex items-baseline min-w-0">
                                            <p className="font-bold mr-2 truncate">{chirp.display_name}</p> 
                                            <p className="text-gray-500 text-sm truncate">@{chirp.username}</p>
                                        </div>
                                    </div>
                                    <p className="mt-1 whitespace-pre-wrap wrap-break-word">{chirp.content}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                {/* Footer */}
                    <div className="flex justify-end border-t border-(--accent-color) p-2">
                        {isError && (
                            <p className="text-red-500 mr-4">Error quoting chirp. Please try again.</p>
                        )}
                        <button
                            className="bg-(--primary-color) text-white leading-4.5 px-4 py-2 rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
                            onClick={handleQuote}
                            disabled={isPending || !content.trim()}
                        >
                            {isPending ? 'Quoting...' : 'Quote Chirp'}
                        </button>
                    </div>
            </div>
        </div>,
        document.body
    );
}
