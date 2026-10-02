import React, {useId, useState} from 'react';
import DefaultProfileImage from '../assets/default-profile.jpg';
import { BsHeart, BsHeartFill, BsChatSquare, BsSend, BsArrowRepeat, BsBookmark, BsPencil } from "react-icons/bs";
import formatTimestamp from '../utils/TimestampFormatter';
import { useToggleLike } from '../hooks/useToggleLike';
import { useToggleRechirp } from '../hooks/useToggleRechirp';
import { Link } from 'react-router-dom';
import QuotePanel from './QuotePanel';

export default function Chirp({ user, chirpId, profileImage, displayName, username, content, timestamp, likeCount, likedByMe, rechirpCount, rechirpedByMe, rechirpedById, rechirpedByDisplayName, rechirpedByUsername, quotedChirp }) {
    const { mutate: toggleLike } = useToggleLike();
    const { mutate: toggleRechirp } = useToggleRechirp();

    const [isRechirpOpen, setIsRechirpOpen] = useState(false);
    const rechirpPanelId = useId();

    const [isQuoteOpen, setIsQuoteOpen] = useState(false);

    const rechirpedByInfo = () => {
        if (rechirpedById && user?.id === rechirpedById) {
            return (
                <p className="text-sm text-gray-500 -mt-2 mb-1 ml-6">
                    <Link to={`/${rechirpedByUsername}`} className="flex hover:underline">
                        <BsArrowRepeat className="w-4 h-4 mr-2" /> Rechirped by you
                    </Link>
                </p>
            );
        }

        if (rechirpedByDisplayName && rechirpedByUsername) {
            return (
                <p className="text-sm text-gray-500 -mt-2 mb-1 ml-6">
                    <Link to={`/${rechirpedByUsername}`} className="flex hover:underline">
                        <BsArrowRepeat className="w-4 h-4 mr-2" /> Rechirped by {rechirpedByDisplayName}
                    </Link>
                </p>
            );
        }
    }

    return (
        <div className="border-t border-b border-(--accent-color) px-4 pt-4">
            {rechirpedByInfo()}
            <div className="flex gap-2 leading-5">
                <img src={profileImage || DefaultProfileImage} alt="Profile" className="w-10 h-10 rounded-full" />
                <div className="min-w-0 w-full">
                    <Link to={`/${username}`} className="hover:underline mr-2">{displayName}</Link>
                    <Link to={`/${username}`} className="text-gray-500">@{username}</Link>
                    <span className="text-gray-500"> · {formatTimestamp(timestamp)}</span>
                    <p className="whitespace-pre-wrap wrap-break-word pr-2">{content}</p>
                    {quotedChirp && (
                        <div className="border border-(--accent-color) rounded-xl p-2 mt-4">
                            <div className="flex gap-2 items-center">
                                <img src={quotedChirp.profile_image_url || DefaultProfileImage} alt="Profile" className="size-6 rounded-full" />
                                <div className="flex items-baseline">
                                    <p className="font-bold mr-2">{quotedChirp.display_name}</p> 
                                    <p className="text-gray-500 text-sm">@{quotedChirp.username}</p>
                                </div>
                            </div>
                            <p className="mt-1 whitespace-pre-wrap wrap-break-word">{quotedChirp.content}</p>
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
                            onClick={() => setIsRechirpOpen((prev) => !prev)}
                            aria-expanded={isRechirpOpen}
                            aria-controls={rechirpPanelId}
                            className="flex items-center gap-1 hover:text-green-400 hover:bg-green-400/10 px-2 py-1 rounded-full">
                                <BsArrowRepeat className={`w-4 h-4 ${rechirpedByMe ? 'text-green-400' : ''}`} />
                                <p className={rechirpedByMe ? 'text-green-400' : ''}>{rechirpCount}</p>
                            </button>

                            {isRechirpOpen && (
                                <div
                                    id={rechirpPanelId}
                                    className="absolute top-full right-0 z-20 w-max rounded-2xl bg-(--accent-color) text-white"
                                >
                                    <button
                                        onClick={() => {
                                            toggleRechirp({ chirpId, rechirped: !rechirpedByMe });
                                            setIsRechirpOpen(false);
                                        }}
                                        className="flex w-full px-4 py-4 text-left hover:bg-(--accent-color-hover) transition-colors duration-300 rounded-t-2xl">
                                        <BsArrowRepeat className="w-4 h-4 mr-2" />
                                        {rechirpedByMe ? 'Undo rechirp' : 'Rechirp'}
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

                            {isQuoteOpen && (
                                <QuotePanel
                                    user={user}
                                    chirp={{ id: chirpId, displayName, username, profileImage, content }}
                                    onClose={() => setIsQuoteOpen(false)}
                                />
                            )}
                        </div>
                        
                        {/* Like button with toggle functionality */}
                        <button 
                        onClick={() => toggleLike({ chirpId, liked: !likedByMe })}
                        className="flex items-center gap-1 hover:text-red-500 hover:bg-red-500/10 px-2 py-1 rounded-full">
                            {likedByMe ? <BsHeartFill className="w-4 h-4 text-red-500"/> : <BsHeart className="w-4 h-4"/>}
                            <p className={likedByMe ? 'text-red-500' : ''}>{likeCount}</p>
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
        </div>
    );
}