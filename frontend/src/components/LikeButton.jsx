import { BsHeart, BsHeartFill } from 'react-icons/bs';

export default function LikeButton({ chirp, toggleLike }) {
    return(
        <button
        onClick={(e) => {
            e.preventDefault(); // Prevent the default link navigation
            e.stopPropagation(); // Prevent the click from navigating to the chirp detail page
            toggleLike({ chirpId: chirp.id, liked: !chirp.liked_by_me });
        }}
        className="flex items-center gap-1 hover:text-red-500 hover:bg-red-500/10 px-2 py-1 rounded-full">
            {chirp.liked_by_me ? <BsHeartFill className="w-4 h-4 text-red-500"/> : <BsHeart className="w-4 h-4"/>}
            <p className={chirp.liked_by_me ? 'text-red-500' : ''}>{chirp.like_count}</p>
        </button>   
    )
}