import { ClipLoader } from "react-spinners";
import Chirp from './Chirp';

export default function ChirpList({ query }) {
    const {
        data: chirps,
        isPending,
        isError,
        refetch,
        hasNextPage,
        fetchNextPage,
        isFetchingNextPage
    } = query;

    if( isPending ){
            return (
                <div className="flex justify-center items-center h-32">
                    <ClipLoader size={40} color="#ffffff" />
                </div>
            );
        }

        if( isError ){
            return (
                <div className="p-4 text-center">
                    <p className="text-red-500">Error loading chirps.</p>
                    <button onClick={() => refetch()} className="mt-2 text-(--primary-color)">
                        Try again
                    </button>
                </div>
            );
        }

        if (chirps.length === 0) {
            return <p className="p-4 text-center">No chirps to display.</p>;
        }

        return (
            <>
                {chirps.map((chirp) => (
                    <Chirp key={chirp.id}
                        chirpId={chirp.id}
                        profileImage={chirp.profile_image_url}
                        displayName={chirp.display_name}
                        username={chirp.username}
                        content={chirp.content}
                        timestamp={chirp.created_at}
                        likeCount={chirp.like_count}
                        likedByMe={chirp.liked_by_me}
                        rechirpCount={chirp.rechirp_count}
                        rechirpedByMe={chirp.rechirped_by_me}
                     />
                ))}

                {hasNextPage && (
                    <button
                        onClick={() => fetchNextPage()}
                        disabled={isFetchingNextPage}
                        className="w-full border-t border-(--accent-color) p-4 hover:bg-(--accent-color)"
                    >
                        {isFetchingNextPage ? "Loading..." : "Load more chirps"}
                    </button>
                )}
            </>
        );
}