import React from 'react';

export default function Chirp({ profileImage, displayName, username, content, timestamp }) {
    const formattedTimestamp = () => {
        const postDate = new Date(timestamp);
        const now = new Date();
        const diffMs = now - postDate;
        const oneDayMs = 24 * 60 * 60 * 1000;

        if (diffMs < oneDayMs) {
            const totalMinutes = Math.max(0, Math.floor(diffMs / 60000));
            const hours = Math.floor(totalMinutes / 60);

            return `${hours}h`;
        }

        const options = {
            day: 'numeric',
            month: 'short',
        };

        if (postDate.getFullYear() !== now.getFullYear()) {
            options.year = 'numeric';
        }

        return new Intl.DateTimeFormat('tr-TR', options).format(postDate);
    }
    
    return (
        <div className="flex gap-2 border-t border-b border-(--accent-color) p-4">
            <img src={profileImage} alt="Profile" className="w-10 h-10 rounded-full" />
            <div>
                <a href="#" className="hover:underline mr-2">{displayName}</a>
                <a href="#" className="text-gray-500">@{username}</a>
                <span className="text-gray-500"> · {formattedTimestamp()}</span>
                <p>{content}</p>
            </div>
        </div>
    );
}