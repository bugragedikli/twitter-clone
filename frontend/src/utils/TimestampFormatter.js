import React from 'react';

export default function formatTimestamp(timestamp) {
    const postDate = new Date(timestamp);
            const now = new Date();
            const diffMs = now - postDate;
            const oneDayMs = 24 * 60 * 60 * 1000;
            const oneHourMs = 60 * 60 * 1000;
            const oneMinuteMs = 60 * 1000;
    
            if (diffMs < oneMinuteMs) {
                return `${Math.max(0, Math.floor(diffMs / 1000))}s`;
            }
    
            if (diffMs < oneHourMs) {
                const totalMinutes = Math.max(0, Math.floor(diffMs / 60000));
                return `${totalMinutes}m`;
            }
    
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