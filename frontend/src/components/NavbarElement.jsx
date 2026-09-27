import { useNavigate } from 'react-router-dom';

export default function NavbarElement({name, icon, navigateTo}) {
    const navigate = useNavigate();
    const handleClick = () => {
        navigate(navigateTo);
    }
    return (
        <div className="flex flex-col items-start gap-6">
            <button 
            onClick={handleClick}
            className="rounded-full px-4 py-2 hover:bg-(--accent-color) transition-colors duration-300 cursor-pointer">
                <div className="flex items-center gap-4">
                    {icon}
                    <p className="text-[20px] leading-8">{name}</p>
                </div>
            </button>
        </div>
    )
}