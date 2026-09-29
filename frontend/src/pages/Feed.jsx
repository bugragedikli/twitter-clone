import React, { useState, useEffect, useRef} from 'react';
import axios from 'axios';
import Chirp from '../components/Chirp';
import EnterChirpField from '../components/EnterChirpField';
import { ClipLoader } from "react-spinners";

const PAGE_SIZE = 5;

const Feed = ({user}) => {
    const [isChirpsLoaded, setChirpsLoaded] = useState(false);
    const [chirps, setChirps] = useState([]);
    const [pendingChirps, setPendingChirps] = useState([]);
    const [activeTab, setActiveTab] = useState(
        () => localStorage.getItem('activeTab') || 'feed'
    );
    const [offset, setOffset] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);

    const chirpsCache = useRef({
        feed: null,
        following: null,
    });

    const pendingChirpsCache = useRef({
        feed: [],
        following: [],
    });

    const wasAtTop = useRef(true);

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

        localStorage.setItem("activeTab", activeTab);

        const getEndpoint = (pageOffset = 0) => {
            const route =
                activeTab === "following"
                    ? "/chirps/following"
                    : "/chirps";

            return `http://localhost:3000${route}?limit=${PAGE_SIZE}&offset=${pageOffset}`;
        };

        // Function to load the latest chirps and update the state
        const loadLatestChirps = async (showLoader = false) => {
            //Show loader when chirps are loading for the first time
            if (showLoader) {
                setChirpsLoaded(false);
            }

            try {
                // Fetch the latest chirps from the server
                const response = await axios.get(getEndpoint(0));

                if (cancelled) {
                    return;
                }

                const responseChirps = response.data.chirps;
                const cachedChirps = chirpsCache.current[activeTab];

                //First loading of chirps
                if (cachedChirps === null) {
                    chirpsCache.current[activeTab] = responseChirps;
                    setChirps(responseChirps);
                    setPendingChirps([]);
                    setOffset(responseChirps.length);
                    setHasMore(response.data.hasMore);
                    return;
                }
                
                // Identify new chirps that are not already in the cache
                const newChirps = responseChirps.filter(
                    (incomingChirp) =>
                        !cachedChirps.some(
                            (cachedChirp) =>
                                cachedChirp.id === incomingChirp.id
                        )
                );
                
                // Update the cache with the latest chirps
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
                    console.error("Error fetching latest chirps:", error);
                }
            } finally {
                if (!cancelled) {
                    setChirpsLoaded(true);
                }
            }
        };

        const cachedChirps = chirpsCache.current[activeTab];

        if (cachedChirps !== null) {
            setChirps(cachedChirps);
            setPendingChirps(pendingChirpsCache.current[activeTab]);
            setOffset(cachedChirps.length);
            setHasMore(true);
            setChirpsLoaded(true);
        } else {
            loadLatestChirps(true);
        }

        const handleScroll = () => {
            const isAtTop = window.scrollY <= 10;

            if (isAtTop && !wasAtTop.current) {
                loadLatestChirps();
            }

            wasAtTop.current = isAtTop;
        };

        window.addEventListener("scroll", handleScroll);

        return () => {
            cancelled = true;
            window.removeEventListener("scroll", handleScroll);
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

    const loadMoreChirps = async () => {
        if (isLoadingMore || !hasMore) {
            return;
        }

        setIsLoadingMore(true);

        try {
            const res = await axios.get(
                `http://localhost:3000/chirps?limit=${PAGE_SIZE}&offset=${offset}`
            );

            setChirps((currentChirps) => [
                ...currentChirps,
                ...res.data.chirps
            ]);

            setOffset((currentOffset) =>
                currentOffset + res.data.chirps.length
            );

            setHasMore(res.data.hasMore);
        } finally {
            setIsLoadingMore(false);
        }
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

                {isChirpsLoaded && hasMore && (
                    <button
                        onClick={loadMoreChirps}
                        disabled={isLoadingMore}
                        className="w-full border-t border-(--accent-color) p-4 hover:bg-(--accent-color)"
                    >
                        {isLoadingMore ? "Loading..." : "Load more chirps"}
                    </button>
                )}
            </div>
        </div>
    )
};

export default Feed;