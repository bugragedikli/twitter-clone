import React from 'react';
import DefaultProfileImage from '../assets/default-profile.jpg';
import { BsHeart, BsChatSquare, BsSend, BsArrowRepeat, BsBookmark } from "react-icons/bs";
import formatTimestamp from '../utils/TimestampFormatter';

export default function Chirp({ profileImage, displayName, username, content, timestamp }) {
    return (
        <div className="flex border-t border-b border-(--accent-color) gap-2 px-4 pt-4 leading-5">
            <img src={profileImage || DefaultProfileImage} alt="Profile" className="w-10 h-10 rounded-full" />
            <div className="min-w-0 w-full">
                <a href="#" className="hover:underline mr-2">{displayName}</a>
                <a href="#" className="text-gray-500">@{username}</a>
                <span className="text-gray-500"> · {formatTimestamp(timestamp)}</span>
                <p className="whitespace-pre-wrap wrap-break-word pr-2">{content}</p>

                <div className="flex justify-between gap-4 py-2 text-gray-500">
                    <button className="flex items-center gap-1 hover:text-(--primary-color) hover:bg-(--primary-color-hover)/10 px-2 py-1 rounded-full">
                        <BsChatSquare className="w-4 h-4"/>
                        <p>0</p>
                    </button>
                    <button className="flex items-center gap-1 hover:text-green-400 hover:bg-green-400/10 px-2 py-1 rounded-full">
                        <BsArrowRepeat className="w-4 h-4"/>
                        <p>0</p>
                    </button>
                    <button className="flex items-center gap-1 hover:text-red-500 hover:bg-red-500/10 px-2 py-1 rounded-full">
                        <BsHeart className="w-4 h-4"/>
                        <p>0</p>
                    </button>
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
    );
}