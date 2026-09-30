import React, {useState} from 'react';
import { Link } from 'react-router-dom';
import NavbarElement from './NavbarElement';
import { BsHouse, BsSearch, BsPerson} from "react-icons/bs";
import ProfileBar from './ProfileBar';

function Navbar({ user, setUser }) {
    const [activeTab, setActiveTab] = useState('home');

    return (
        <nav className="flex flex-col gap-6 h-screen py-4 sticky top-0">
            <Link to="/" className="text-[36px] font-bold">Chirper</Link>
            {user ? (
                <div className="flex flex-col justify-between h-full">
                    <div className="flex flex-col items-start gap-4">
                        <NavbarElement active={activeTab === 'home'} setActive={setActiveTab} name="Home" icon={<BsHouse className="text-[24px]"/>} navigateTo="/" />
                        <NavbarElement active={activeTab === 'explore'} setActive={setActiveTab} name="Explore" icon={<BsSearch className="text-[24px]"/>} navigateTo="/explore" />
                        <NavbarElement active={activeTab === 'profile'} setActive={setActiveTab} name="Profile" icon={<BsPerson className="text-[24px]"/>} navigateTo={`/${user.username}`} />
                    </div>
                    <ProfileBar user={user} setUser={setUser} />
                </div>
                
                
            ) : (
                <div>
                    <p className="text-[24px] font-bold">Join Chirper</p>
                    <div className="flex gap-2 mt-2">
                        <Link to="/register" className="bg-(--primary-color) rounded-full leading-4.5 px-4 py-2 hover:bg-(--primary-color-hover) transition-colors duration-300">
                            <span className="relative -top-px leading-none">
                                Create Account
                            </span>
                        </Link>
                        <Link to="/login" className="bg-(--accent-color) rounded-full leading-4.5 px-4 py-2 hover:bg-(--accent-color-hover) transition-colors duration-300">
                            <span className="relative -top-px leading-none">
                                Sign In
                            </span>
                        </Link>
                    </div>
                </div>
            )}
        </nav>
    )
}

export default Navbar;