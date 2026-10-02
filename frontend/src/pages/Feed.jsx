import React, { useState } from 'react';
import EnterChirpField from '../components/EnterChirpField';
import { useFeed } from '../hooks/useFeed';
import ChirpList from '../components/ChirpList';

const Feed = ({user}) => {
    const [activeTab, setActiveTab] = useState(
        () => localStorage.getItem('activeTab') || 'feed'
    );

    const changeTab = (tab) => {
        setActiveTab(tab);
        localStorage.setItem('activeTab', tab);
    };
    
    return (
        <div>
            <div className="flex items-center justify-between border-b border-(--accent-color) font-bold sticky top-0 bg-(--background-color) z-10">
                <button 
                onClick={() => changeTab('feed')}
                className={`w-1/2 p-4 hover:bg-(--accent-color) 
                ${activeTab === 'feed' ? 'border-b-2 border-(--primary-color)' : ''}`}>
                    <h1>Feed</h1>
                </button>
                <button
                onClick={() => changeTab('following')}
                className={`w-1/2 p-4 hover:bg-(--accent-color)
                ${activeTab === 'following' ? 'border-b-2 border-(--primary-color)' : ''}`}>
                    <h1>Following</h1>
                </button>
            </div>

            <EnterChirpField user={user} />

            <div className="border-t border-(--accent-color)">
                <ChirpList user={user} query={useFeed(activeTab)} />
            </div>
        </div>
    )
};

export default Feed;