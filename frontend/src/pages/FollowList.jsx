import { Link, useParams } from 'react-router-dom';
import { BsArrowLeft } from 'react-icons/bs';
import { ClipLoader } from 'react-spinners';
import DefaultProfileImage from '../assets/default-profile.jpg';
import { useProfile } from '../hooks/useProfile';
import { useFollowList } from '../hooks/useFollowList';
import { useToggleFollow } from '../hooks/useToggleFollow';

const FollowList = ({ type, user }) => {
    const { username } = useParams();
    const { data: profile } = useProfile(username);
    const toggleFollow = useToggleFollow();
    const {
        data: users,
        isPending,
        isError,
        hasNextPage,
        fetchNextPage,
        isFetchingNextPage,
    } = useFollowList(profile?.id, type);

    const tabClass = (tab) =>
        `w-1/2 py-4 text-center hover:bg-gray-500/10 transition-colors duration-300 border-b ${
            type === tab ? 'border-b-2 border-(--primary-color) font-bold' : 'border-(--accent-color) text-gray-500'
        }`;

    return (
        <>
            <div className="flex items-center gap-6 px-2 pt-2 pb-1">
                <Link to={`/${username}`} className="flex items-center justify-center text-gray-500 hover:text-white size-9 hover:bg-(--primary-color)/10 rounded-full">
                    <BsArrowLeft className="size-5" />
                </Link>
                <div>
                    <p className="font-bold text-lg leading-5">{profile?.display_name}</p>
                    <p className="text-gray-500 text-sm leading-5">@{username}</p>
                </div>
            </div>

            <div className="flex">
                <Link to={`/${username}/followers`} className={tabClass('followers')}>Followers</Link>
                <Link to={`/${username}/followings`} className={tabClass('followings')}>Followings</Link>
            </div>

            {isPending ? (
                <div className="flex justify-center p-10"><ClipLoader color="#ffffff" /></div>
            ) : isError ? (
                <p className="p-4 text-center text-red-500">Error loading users.</p>
            ) : users.length === 0 ? (
                <p className="p-4 text-center text-gray-500">
                    {type === 'followers' ? 'No followers yet.' : 'Not following anyone yet.'}
                </p>
            ) : (
                <>
                    {users.map((u) => (
                        <div key={u.id} className="flex items-start gap-3 px-4 py-3 hover:bg-gray-500/10 transition-colors duration-300">
                            <Link to={`/${u.username}`} className="flex gap-3 flex-1 min-w-0">
                                <img src={u.profile_image_url || DefaultProfileImage} alt="" className="size-10 rounded-full" />
                                <div className="min-w-0">
                                    <p className="font-bold leading-5 truncate">{u.display_name}</p>
                                    <p className="text-gray-500 text-sm leading-5 truncate">@{u.username}</p>
                                    {u.bio && <p className="text-sm mt-1">{u.bio}</p>}
                                </div>
                            </Link>

                            {user && u.id !== user.id && (
                                <button
                                    onClick={() => toggleFollow.mutate({ userId: u.id, follow: !u.is_following })}
                                    disabled={toggleFollow.isPending}
                                    className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-bold transition-colors duration-300 ${
                                        u.is_following
                                            ? 'border border-gray-500 text-white hover:bg-gray-500/10'
                                            : 'bg-white text-black hover:bg-gray-200'
                                    }`}
                                >
                                    {u.is_following ? 'Unfollow' : 'Follow'}
                                </button>
                            )}
                        </div>
                    ))}

                    {hasNextPage && (
                        <button
                            onClick={() => fetchNextPage()}
                            disabled={isFetchingNextPage}
                            className="w-full border-t border-(--accent-color) p-4 hover:bg-(--accent-color)"
                        >
                            {isFetchingNextPage ? 'Loading...' : 'Load more'}
                        </button>
                    )}
                </>
            )}
        </>
    );
};

export default FollowList;
