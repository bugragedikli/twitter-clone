import {useId, useState} from 'react';
import DefaultProfileImage from '../assets/default-profile.jpg';
import { BsHeart, BsHeartFill, BsChatSquare, BsSend, BsArrowRepeat, BsBookmark, BsPencil } from "react-icons/bs";
import formatTimestamp from '../utils/TimestampFormatter';
import { useToggleLike } from '../hooks/useToggleLike';
import { useToggleRechirp } from '../hooks/useToggleRechirp';
import { Link } from 'react-router-dom';
import QuotePanel from './QuotePanel';

export default function Chirp({ user, chirp }) {
    const { mutate: toggleLike } = useToggleLike();
    const { mutate: toggleRechirp } = useToggleRechirp();

    const [isRechirpOpen, setIsRechirpOpen] = useState(false);
    const rechirpPanelId = useId();

    const [isQuoteOpen, setIsQuoteOpen] = useState(false);
    
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
                        <button className="flex items-center gap-1 hover:text-(--primary-color) hover:bg-(--primary-color-hover)/10 px-2 py-1 rounded-full">
                            <BsChatSquare className="w-4 h-4"/>
                            <p>0</p>
                        </button>

                        {/* Rechirp button with toggle functionality */}
                        <div className="relative"
                        onKeyDown={(event) => {
                            if (event.key === 'Escape') setIsRechirpOpen(false);
                        }}
                        onBlur={(event) => {
                            if (!event.currentTarget.contains(event.relatedTarget)) {
                                setIsRechirpOpen(false);
                            }
                        }}
                        >
                            <button 
                            onClick={() => {setIsRechirpOpen((prev) => !prev)}}
                            aria-expanded={isRechirpOpen}
                            aria-controls={rechirpPanelId}
                            className="flex items-center gap-1 hover:text-green-400 hover:bg-green-400/10 px-2 py-1 rounded-full">
                                <BsArrowRepeat className={`w-4 h-4 ${chirp.rechirped_by_me ? 'text-green-400' : ''}`} />
                                <p className={chirp.rechirped_by_me ? 'text-green-400' : ''}>{chirp.rechirp_count}</p>
                            </button>

                            {isRechirpOpen && (
                                <div
                                    id={rechirpPanelId}
                                    className="absolute top-full right-0 z-20 w-max rounded-2xl bg-(--accent-color) text-white"
                                >
                                    <button
                                        onClick={() => {
                                            toggleRechirp({ chirpId: chirp.id, rechirped: !chirp.rechirped_by_me });
                                            setIsRechirpOpen(false);
                                        }}
                                        className="flex w-full px-4 py-4 text-left hover:bg-(--accent-color-hover) transition-colors duration-300 rounded-t-2xl">
                                        <BsArrowRepeat className="w-4 h-4 mr-2" />
                                        {chirp.rechirped_by_me ? 'Undo rechirp' : 'Rechirp'}
                                    </button>
                                    <button 
                                    onClick={() => {
                                        // Open quote panel logic here
                                        setIsRechirpOpen(false);
                                        setIsQuoteOpen(true);
                                    }}
                                    className="flex w-full px-4 py-4 text-left hover:bg-(--accent-color-hover) transition-colors duration-300 rounded-b-2xl">
                                        <BsPencil className="w-4 h-4 mr-2" />
                                        Quote
                                    </button>
                                </div>
                            )}
                        </div>
                        
                        {/* Like button with toggle functionality */}
                        <button 
                        onClick={() => toggleLike({ chirpId: chirp.id, liked: !chirp.liked_by_me })}
                        className="flex items-center gap-1 hover:text-red-500 hover:bg-red-500/10 px-2 py-1 rounded-full">
                            {chirp.liked_by_me ? <BsHeartFill className="w-4 h-4 text-red-500"/> : <BsHeart className="w-4 h-4"/>}
                            <p className={chirp.liked_by_me ? 'text-red-500' : ''}>{chirp.like_count}</p>
                        </button>

                        {/* Bookmark and Send buttons */}
                        <span className="flex items-center">
                            <button className="flex items-center gap-1 hover:text-(--primary-color) hover:bg-(--primary-color-hover)/10 px-2 py-2 rounded-full">
                                <BsBookmark className="w-4 h-4"/>
                            </button>
                            <button className="flex items-center gap-1 hover:text-(--primary-color) hover:bg-(--primary-color-hover)/10 px-2 py-2 rounded-full">
                                <BsSend className="w-4 h-4"/>
                            </button>
                        </span>
                    </div>
                </div>
            </div>
            {isQuoteOpen && (
                <QuotePanel
                    user={user}
                    chirp={chirp}
                    onClose={() => setIsQuoteOpen(false)}
                />
            )}
        </div>
    );
}