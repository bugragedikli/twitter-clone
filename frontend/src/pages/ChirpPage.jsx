import { Link, useParams } from "react-router-dom";
import { BsArrowLeft } from "react-icons/bs";
import { useChirp } from "../hooks/useChirp";
import { ClipLoader } from "react-spinners";
import DefaultProfileImage from "../assets/default-profile.jpg";
import CommentButton from "../components/CommentButton";
import RechirpButton from "../components/RechirpButton";
import LikeButton from "../components/LikeButton";
import BookmarkButton from "../components/BookmarkButton";
import SendButton from "../components/SendButton";
import { useToggleLike } from "../hooks/useToggleLike";
import { useToggleRechirp } from "../hooks/useToggleRechirp";

const ChirpPage = ({user}) => {
    const { chirpId } = useParams();
    const {data: chirp, isPending, isError} = useChirp(chirpId);

    const { mutate: toggleLike } = useToggleLike();
    const { mutate: toggleRechirp } = useToggleRechirp();

    if (isPending) {
        return <div className="flex justify-center p-10"><ClipLoader color="#ffffff" /></div>;
    }

    if (isError) {
        return <p className="p-4 text-center">This chirp doesn't exist.</p>;
    }

    return (
        <>
        {/* Header */}
        <div className=" flex justify-between px-2 pt-2 pb-1 sticky top-0 bg-(--background-color) z-10gap-4 ">
            <div className="flex items-center gap-6">
                <Link to="/" className="flex items-center justify-center text-gray-500 hover:text-white cursor-pointer size-9 hover:bg-(--primary-color)/10 rounded-full">
                    <BsArrowLeft className="size-9 p-2" />
                </Link>
                <div className="leading-3">
                    <p className="font-bold text-lg leading-5">Chirp</p>
                </div>
            </div>
        </div>
        {/* Chirp Content */}
        <div>
            <div className="flex gap-2 p-4 leading-5">
                <img src={chirp.profile_image_url || DefaultProfileImage} alt="Default Profile" className="w-10 h-10 rounded-full" />
                <div>
                    <Link to={`/${chirp.username}`} className="font-bold hover:underline">{chirp.display_name}</Link>
                    <p className="text-sm text-gray-500">@{chirp.username}</p>
                </div>
            </div>
            <div className="min-w-0 w-full px-4">
                <p className="whitespace-pre-wrap wrap-break-word">{chirp.content}</p>
            </div>

            {/* Quoted Chirp Section */}
            {chirp.quoted_chirp && (
                <div className="border border-(--accent-color) rounded-xl p-2 m-4">
                    <div className="flex gap-2 items-center">
                        <img src={chirp.quoted_chirp.profile_image_url || DefaultProfileImage} alt="Profile" className="size-6 rounded-full" />
                        <div className="flex items-baseline min-w-0 ">
                            <p className="font-bold mr-2 truncate">{chirp.quoted_chirp.display_name}</p> 
                            <p className="text-gray-500 text-sm truncate">@{chirp.quoted_chirp.username}</p>
                        </div>
                    </div>
                    <p className="mt-1 whitespace-pre-wrap wrap-break-word">{chirp.quoted_chirp.content}</p>
                </div>
            )}

            {/* Footer with timestamp */}
            <div className="flex justify-between gap-4 py-2 text-gray-500 px-4">
                <p>{new Date(chirp.created_at).toLocaleString()}</p>
            </div>
            
            {/* Action buttons */}
            <div className="flex justify-between gap-4 m-2 py-2 border-b border-t border-(--accent-color) text-gray-500">
                {/* Comment button with placeholder count */}
                <CommentButton />

                {/* Rechirp button with toggle functionality */}
                <RechirpButton chirp={chirp} toggleRechirp={toggleRechirp} user={user} />
                
                {/* Like button with toggle functionality */}
                <LikeButton chirp={chirp} toggleLike={toggleLike} />

                {/* Bookmark and Send buttons */}
                <BookmarkButton />
                <SendButton />
            </div>

            {/* Send Comment Section */}
            <div className="p-2">
                Send Comment
            </div>
        </div>
        {/* Comments Section */}
        <div className="border-t border-(--accent-color) p-4">

        </div>
        </>
    )
}

export default ChirpPage;