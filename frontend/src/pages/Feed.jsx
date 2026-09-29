import React, { useState } from 'react';
import Chirp from '../components/Chirp';
import EnterChirpField from '../components/EnterChirpField';
import { ClipLoader } from "react-spinners";
import { useFeed } from '../hooks/useFeed';

const Feed = ({user}) => {
    const [activeTab, setActiveTab] = useState(
        () => localStorage.getItem('activeTab') || 'feed'
    );

    const {
        data: chirps,
        isPending,
        isError,
        refetch,            
        fetchNextPage,   
        hasNextPage,      
        isFetchingNextPage, 
    } = useFeed(activeTab);

    const changeTab = (tab) => {
        setActiveTab(tab);
        localStorage.setItem('activeTab', tab);
    };

    const renderContent = () => {
        if( isPending ){
            return (
                <div className="flex justify-center items-center h-32">
                    <ClipLoader size={40} color="#ffffff" />
                </div>
            );
        }

        if( isError ){
            return (
                <div className="p-4 text-center">
                    <p className="text-red-500">Error loading chirps.</p>
                    <button onClick={() => refetch()} className="mt-2 text-(--primary-color)">
                        Try again
                    </button>
                </div>
            );
        }

        if (chirps.length === 0) {
            return <p className="p-4 text-center">No chirps to display.</p>;
        }

        return (
            <>
                {chirps.map((chirp) => (
                    <Chirp key={chirp.id}
                        profileImage={chirp.profile_image_url}
                        displayName={chirp.display_name}
                        username={chirp.username}
                        content={chirp.content}
                        timestamp={chirp.created_at}
                     />
                ))}

                {hasNextPage && (
                    <button
                        onClick={() => fetchNextPage()}
                        disabled={isFetchingNextPage}
                        className="w-full border-t border-(--accent-color) p-4 hover:bg-(--accent-color)"
                    >
                        {isFetchingNextPage ? "Loading..." : "Load more chirps"}
                    </button>
                )}
            </>
        );
    }
    


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
                {renderContent()}
            </div>
        </div>
    )
};

export default Feed;