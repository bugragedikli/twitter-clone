import DefaultProfileImage from '../assets/default-profile.jpg';
import {BsArrowRepeat } from "react-icons/bs";
import formatTimestamp from '../utils/TimestampFormatter';
import { useToggleLike } from '../hooks/useToggleLike';
import { useToggleRechirp } from '../hooks/useToggleRechirp';
import { Link } from 'react-router-dom';
import LikeButton from './LikeButton';
import RechirpButton from './RechirpButton';
import CommentButton from './CommentButton';
import BookmarkButton from './BookmarkButton';
import SendButton from './SendButton';

export default function Chirp({ user, chirp }) {
    const { mutate: toggleLike } = useToggleLike();
    const { mutate: toggleRechirp } = useToggleRechirp();
    
    const rechirpedByInfo = () => {
        if (!chirp.rechirped_by_id) return null;

        const label = user?.id === chirp.rechirped_by_id ? 'you' : chirp.rechirped_by_display_name;

        return (
            <p className="text-sm text-gray-500 -mt-2 mb-1 ml-6">
                <Link to={`/${chirp.rechirped_by_username}`} className="flex hover:underline">
                    <BsArrowRepeat className="w-4 h-4 mr-2" /> Rechirped by {label}
                </Link>
            </p>
        );
    }

    return (
        <Link to={`/${chirp.username}/status/${chirp.id}`} className="block hover:bg-(--background-color) transition-colors duration-300">
        <div className="border-t border-b border-(--accent-color) px-4 pt-4">
            {rechirpedByInfo()}
            <div className="flex gap-2 leading-5">
                <img src={chirp.profile_image_url || DefaultProfileImage} alt="Profile" className="w-10 h-10 rounded-full" />
                <div className="min-w-0 w-full">
                    <Link to={`/${chirp.username}`} className="hover:underline mr-2">{chirp.display_name}</Link>
                    <Link to={`/${chirp.username}`} className="text-gray-500">@{chirp.username}</Link>
                    <span className="text-gray-500"> · {formatTimestamp(chirp.created_at)}</span>
                    <p className="whitespace-pre-wrap wrap-break-word pr-2">{chirp.content}</p>
                    {chirp.quoted_chirp && (
                        <div className="border border-(--accent-color) rounded-xl p-2 mt-4">
                            <div className="flex gap-2 items-center">
                                <img src={chirp.quoted_chirp.profile_image_url || DefaultProfileImage} alt="Profile" className="size-6 rounded-full" />
                                <div className="flex items-baseline min-w-0 ">
                                    <p className="font-bold mr-2 truncate">{chirp.quoted_chirp.display_name}</p> 
                                    <p className="text-gray-500 text-sm truncate">@{chirp.quoted_chirp.username}</p>
                                </div>
                            </div>
                            <p className="mt-1 whitespace-pre-wrap wrap-break-word">{chirp.quoted_chirp.content}</p>
                        </div>
                    )}
                    {/* Footer with action buttons */}
                    <div className="flex justify-between gap-4 py-2 text-gray-500">
                        {/* Comment button with placeholder count */}
                        <CommentButton chirp={chirp} />

                        {/* Rechirp button with toggle functionality */}
                        <RechirpButton chirp={chirp} toggleRechirp={toggleRechirp} user={user} />
                        
                        {/* Like button with toggle functionality */}
                        <LikeButton chirp={chirp} toggleLike={toggleLike} />

                        {/* Bookmark and Send buttons */}
                        <span className="flex items-center">
                            <BookmarkButton />
                            <SendButton />
                        </span>
                    </div>
                </div>
            </div>
        </div>
        </Link>
    );
}