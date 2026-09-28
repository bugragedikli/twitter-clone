import React, { useState, useEffect, useRef} from 'react';
import axios from 'axios';
import Chirp from '../components/Chirp';
import EnterChirpField from '../components/EnterChirpField';
import { ClipLoader } from "react-spinners";

const Feed = ({user}) => {
    const [isChirpsLoaded, setChirpsLoaded] = useState(false);
    const [chirps, setChirps] = useState([]);
    const [pendingChirps, setPendingChirps] = useState([]);
    const [activeTab, setActiveTab] = useState(
        () => localStorage.getItem('activeTab') || 'feed'
    );

    const chirpsCache = useRef({
        feed: null,
        following: null,
    });

    const pendingChirpsCache = useRef({
        feed: [],
        following: [],
    });

    const mergeChirps = (existingChirps, incomingChirps) => {
        const chirpsById = new Map(
            existingChirps.map((chirp) => [chirp.id, chirp])
        );

        incomingChirps.forEach((chirp) => {
            chirpsById.set(chirp.id, chirp);
        });

        return [...chirpsById.values()].sort(
            (a, b) => new Date(b.created_at) - new Date(a.created_at)
        );
    };

    useEffect(() => {
        let cancelled = false;

        const endpoint =
            activeTab === "following"
                ? "http://localhost:3000/chirps/following"
                : "http://localhost:3000/chirps";

        const loadChirps = async (showLoader = false) => {
            if (showLoader) {
                setChirpsLoaded(false);
            }

            try {
                const res = await axios.get(endpoint);

                if (cancelled) {
                    return;
                }

                const cachedChirps = chirpsCache.current[activeTab];

                // First load: display posts immediately.
                if (cachedChirps === null) {
                    chirpsCache.current[activeTab] = res.data;
                    setChirps(res.data);
                    setPendingChirps([]);
                    return;
                }

                // Later requests: find posts not currently displayed.
                const newChirps = res.data.filter(
                    (incomingChirp) =>
                        !cachedChirps.some(
                            (cachedChirp) => cachedChirp.id === incomingChirp.id
                        )
                );

                if (newChirps.length > 0) {
                    const pending = mergeChirps(
                        pendingChirpsCache.current[activeTab],
                        newChirps
                    );

                    pendingChirpsCache.current[activeTab] = pending;
                    setPendingChirps(pending);
                }
            } catch (error) {
                if (!cancelled) {
                    console.error("Error fetching chirps:", error);
                }
            } finally {
                if (!cancelled) {
                    setChirpsLoaded(true);
                }
            }
        };

        localStorage.setItem("activeTab", activeTab);

        const cachedChirps = chirpsCache.current[activeTab];

        if (cachedChirps !== null) {
            setChirps(cachedChirps);
            setPendingChirps(pendingChirpsCache.current[activeTab]);
            setChirpsLoaded(true);
        } else {
            loadChirps(true);
        }

        const intervalId = setInterval(() => {
            loadChirps();
        }, 15000);

        return () => {
            cancelled = true;
            clearInterval(intervalId);
        };
    }, [activeTab]);

    const handleNewChirp = (newChirp) => {
        setChirps((prevChirps) => {
            const updatedChirps = [newChirp, ...prevChirps];

            chirpsCache.current[activeTab] = updatedChirps;

            return updatedChirps;
        });
    }

    const showNewChirps = () => {
            const pending = pendingChirpsCache.current[activeTab];

            const updatedChirps = mergeChirps(
                chirpsCache.current[activeTab] || [],
                pending
            );

            chirpsCache.current[activeTab] = updatedChirps;
            pendingChirpsCache.current[activeTab] = [];

            setChirps(updatedChirps);
            setPendingChirps([]);
        };

    return (
        <div>
            <div className="flex items-center justify-between border-b border-(--accent-color) font-bold sticky top-0 bg-(--background-color) z-10">
                <button 
                onClick={() => setActiveTab('feed')}
                className={`w-1/2 p-4 hover:bg-(--accent-color) 
                ${activeTab === 'feed' ? 'border-b-2 border-(--primary-color)' : ''}`}>
                    <h1>Feed</h1>
                </button>
                <button
                onClick={() => setActiveTab('following')}
                className={`w-1/2 p-4 hover:bg-(--accent-color)
                ${activeTab === 'following' ? 'border-b-2 border-(--primary-color)' : ''}`}>
                    <h1>Following</h1>
                </button>
            </div>
            <EnterChirpField user={user} handleNewChirp={handleNewChirp} />
            {pendingChirps.length > 0 && (
                <button
                    onClick={showNewChirps}
                    className="w-full border-t border-(--accent-color) p-3 text-(--primary-color) hover:bg-(--accent-color)"
                >
                    Show {pendingChirps.length} new chirp
                    {pendingChirps.length !== 1 ? "s" : ""}
                </button>
            )}
            <div className="border-t border-(--accent-color)">
                {isChirpsLoaded && chirps.map((chirp) => (
                    <Chirp key={chirp.id}
                        profileImage={chirp.profile_image_url}
                        displayName={chirp.display_name}
                        username={chirp.username}
                        content={chirp.content}
                        timestamp={chirp.created_at}
                     />
                ))}
                {isChirpsLoaded && chirps.length === 0 && <p>No chirps to display.</p>}
                {!isChirpsLoaded && 
                    <div className="flex justify-center items-center h-32">
                        <ClipLoader size={40} color="#ffffff" />
                    </div>
                }
            </div>
        </div>
    )
};

export default Feed;