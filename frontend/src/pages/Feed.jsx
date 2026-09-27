import React from 'react';
import Chirp from '../components/Chirp';
import DefaultProfileImage from '../assets/default-profile.jpg';

const Feed = () => {
    return (
        <div>
            <h1>Feed</h1>
            <Chirp 
                profileImage={DefaultProfileImage}
                displayName="John Doe"
                username="johndoe"
                content="lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua."
                timestamp="2026-09-27 12:00"
            />
            <Chirp 
                profileImage={DefaultProfileImage}
                displayName="John Doe"
                username="johndoe"
                content="lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua."
                timestamp="2026-01-01 12:00"
            />
            <Chirp 
                profileImage={DefaultProfileImage}
                displayName="John Doe"
                username="johndoe"
                content="lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua."
                timestamp="2025-01-01 12:00"
            />
            <Chirp 
                profileImage={DefaultProfileImage}
                displayName="John Doe"
                username="johndoe"
                content="lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua."
                timestamp="2026-01-01 12:00"
            />
        </div>
    )
};

export default Feed;