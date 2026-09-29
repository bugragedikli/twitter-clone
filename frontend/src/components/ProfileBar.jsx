import { useId, useState } from 'react';
import { BsThreeDots} from "react-icons/bs";
import defaultProfileImage from '../assets/default-profile.jpg';
import { logout } from '../api/auth';

export default function ProfileBar({user, setUser}) {
    const [isOpen, setIsOpen] = useState(false);
    const panelId = useId();

    const handleLogout = async () => {
        await logout();
        setUser(null);
    }

    return (
        <div
        className="relative"
        onKeyDown={(event) => {
            if (event.key === 'Escape') setIsOpen(false);
        }}
        onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget)) {
                setIsOpen(false);
            }
        }}
        >
            {isOpen && (
                <div
                    id={panelId}
                    className="absolute bottom-full left-0 z-20 w-full rounded-2xl border border-(--accent-color) bg-(--background-color) py-2 cursor-pointer"
                >
                    <button 
                    className="text-sm hover:bg-(--accent-color) w-full py-2 cursor-pointer text-left"
                    onClick={handleLogout}>
                        <span className="mx-2">Logout from @{user.username}</span>
                    </button>
                </div>
            )}
            <button
            aria-expanded={isOpen}
            aria-controls={panelId}
            onClick={() => setIsOpen((previous) => !previous)}
            className="flex items-center justify-between gap-4 rounded-full p-4 w-full hover:bg-(--accent-color) transition-colors duration-300 cursor-pointer">
                <span className="flex items-center gap-4">
                    <img src={user.profile_image_url || defaultProfileImage} alt="Profile" className="w-10 h-10 rounded-full" />
                    <span className="flex flex-col items-start gap-0 m-0 text-[14px] leading-5">
                        <span className="truncate">{user.display_name}</span>
                        <span className="truncate text-gray-500">
                            @{user.username}
                        </span>
                    </span>
                </span>
                <BsThreeDots />
            </button>
        </div>
    )
}