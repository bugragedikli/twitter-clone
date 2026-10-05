import DefaultProfileImage from "../assets/default-profile.jpg";


export default function Comment({ comment }) {
    return (
        <div className="p-4">
            <img src={comment.user.profile_image_url || DefaultProfileImage} alt="Profile" className="w-10 h-10 rounded-full" />
        </div>
    )
}