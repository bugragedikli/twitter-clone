import { ClipLoader } from "react-spinners";
import Chirp from './Chirp';

export default function ChirpList({ user, query }) {
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
                    <Chirp 
                        key={`${chirp.id}-${chirp.rechirped_by_id ?? 'original'}`}
                        user={user}
                        chirp={chirp}
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