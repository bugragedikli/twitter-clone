import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import DefaultProfileImage from '../assets/default-profile.jpg';
import { BsArrowLeft, BsSearch } from "react-icons/bs";
import { Link } from 'react-router-dom';
import ChirpList from '../components/ChirpList';
import { useUserChirps } from '../hooks/useUserChirps';
import { useUserRechirps } from '../hooks/useUserRechirps';
import { useUserReplies } from '../hooks/useUserReply';
import { ClipLoader } from "react-spinners";
import { useProfile } from '../hooks/useProfile';
import { useToggleFollow } from '../hooks/useToggleFollow';

const Profile = ({ user }) => {
    const { username } = useParams();
    const [tab, setTab] = useState('chirps'); // State to manage the active tab

    const {data: profile, isPending, isError} = useProfile(username);
    const toggleFollow = useToggleFollow();

    const userChirpsQuery = useUserChirps(user?.id, profile?.id);
    const userRechirpsQuery = useUserRechirps(user?.id, profile?.id);
    const userRepliesQuery = useUserReplies(user?.id, profile?.id);


    if (isPending) {
        return <div className="flex justify-center p-10"><ClipLoader color="#ffffff" /></div>;
    }

    if (isError) {
        return <p className="p-4 text-center">This account doesn't exist.</p>;
    }

    return(
    <>
        {/* Profile Header */}
        <div className="flex justify-between border-b border-(--accent-color) px-2 pt-2 pb-1 sticky top-0 bg-(--background-color) z-10">
            <div className="gap-4 ">
                <div className="flex items-center gap-6">
                    <Link to="/" className="flex items-center justify-center text-gray-500 hover:text-white cursor-pointer size-9 hover:bg-(--primary-color)/10 rounded-full">
                        <BsArrowLeft className="size-9 p-2" />
                    </Link>
                    <div className="leading-3">
                        <p className="font-bold text-lg leading-5">{profile.display_name}</p>
                        <p className="text-gray-500 text-sm leading-5">{profile.chirps_count} chirps</p>
                    </div>
                </div>
            </div>
            <div>
                <button className="flex items-center justify-center text-gray-500 hover:text-white cursor-pointer size-9 hover:bg-(--primary-color)/10 rounded-full">
                    <BsSearch className="size-9 p-2" />
                </button>
            </div>
        </div>

        {/* Profile Banner */}
        <div>
            <div className="h-48 bg-gray-700">
                <img src={DefaultProfileImage} alt="Profile Banner" className="w-full h-full object-cover" />
            </div>
        </div>

        {/* Profile Photo */}
        <div className="flex justify-between items-start px-4">
            <img src={profile.profile_image_url ? profile.profile_image_url : DefaultProfileImage} alt="Profile" className="-mt-16 relative w-32 h-32 rounded-full border-4 border-(--background-color)" />
            {profile.id === user?.id ?
                <button
                className="mt-3 border border-gray-500 font-semibold text-white px-4 py-2 rounded-full leading-4.25 hover:bg-gray-500/10 transition-colors duration-300"
                >
                    Edit Profile
                </button>
                :
                <button
                onClick={() => toggleFollow.mutate({ userId: profile.id, follow: !profile.is_following })}
                className="mt-3 border border-gray-500 font-semibold text-white px-4 py-2 rounded-full leading-4.25 hover:bg-gray-500/10 transition-colors duration-300"
                >
                    {profile.is_following ? 'Unfollow' : 'Follow'}
                </button>
            }
        </div>

        {/* Profile Info */}
        <div className="px-4 mt-2">
            <p className="font-bold text-lg">{profile.display_name}</p>
            <p className="text-gray-500 text-sm">@{profile.username}</p>
            <p>{profile.bio}</p>
            <div className="flex gap-4 mt-2 text-sm">
                <Link 
                to={`/${profile.username}/followings`}
                className="hover:underline">
                    {profile.following_count} <span className="text-gray-500">Following</span>
                </Link>
                <Link
                to={`/${profile.username}/followers`} 
                className="hover:underline">
                    {profile.followers_count} <span className="text-gray-500">Followers</span></Link>
            </div>
        </div>

        {/* Chirps Section */}
        <div className="flex justify-between mt-4">
            <button
            onClick={() => setTab('chirps')}
            className={`text-[16px] border-b border-(--accent-color) w-1/3 py-4 hover:bg-gray-500/10 transition-colors duration-300 ${tab === 'chirps' ? 'border-(--primary-color) border-b-2' : ''}`}
            >
                Chirps
            </button>
            <button
            onClick={() => setTab('replies')}
            className={`text-[16px] border-b border-(--accent-color) w-1/3 py-4 hover:bg-gray-500/10 transition-colors duration-300 ${tab === 'replies' ? 'border-(--primary-color) border-b-2' : ''}`}
            >
                Replies
            </button>
            <button
            onClick={() => setTab('rechirps')}
            className={`text-[16px] border-b border-(--accent-color) w-1/3 py-4 hover:bg-gray-500/10 transition-colors duration-300 ${tab === 'rechirps' ? 'border-(--primary-color) border-b-2' : ''}` } >
                Rechirps
            </button>
        </div>

        <div>
            {tab === 'chirps' && 
            <div>
                <ChirpList user={user} query={userChirpsQuery} />
            </div>
            }
            {tab === 'replies' && 
            <div>
                <ChirpList user={user} query={userRepliesQuery} />
            </div>
            }
            {tab === 'rechirps' && 
            <div>
                <ChirpList user={user} query={userRechirpsQuery} />
            </div>
            }
        </div>
    </>
    )
}

export default Profile;