import { useState, useId } from 'react';
import { BsArrowRepeat, BsPencil } from 'react-icons/bs';
import QuotePanel from './QuotePanel';


export default function RechirpButton({ user, chirp, toggleRechirp }) {
    const [isRechirpOpen, setIsRechirpOpen] = useState(false);
    const rechirpPanelId = useId();

    const [isQuoteOpen, setIsQuoteOpen] = useState(false);

    return (
        <>
        <div className="relative"
        onKeyDown={(event) => {
            if (event.key === 'Escape') setIsRechirpOpen(false);
        }}
        onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget)) {
                setIsRechirpOpen(false);
            }
        }}
        >
            <button 
            onClick={(e) => {
                e.preventDefault(); // Prevent the default link navigation
                e.stopPropagation();
                setIsRechirpOpen((prev) => !prev)
            }}
            aria-expanded={isRechirpOpen}
            aria-controls={rechirpPanelId}
            className="flex items-center gap-1 hover:text-green-400 hover:bg-green-400/10 px-2 py-1 rounded-full">
                <BsArrowRepeat className={`w-4 h-4 ${chirp.rechirped_by_me ? 'text-green-400' : ''}`} />
                <p className={chirp.rechirped_by_me ? 'text-green-400' : ''}>{chirp.rechirp_count}</p>
            </button>
            {isRechirpOpen && (
                <div
                    id={rechirpPanelId}
                    className="absolute top-full right-0 z-20 w-max rounded-2xl bg-(--accent-color) text-white"
                >
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            toggleRechirp({ chirpId: chirp.id, rechirped: !chirp.rechirped_by_me });
                            setIsRechirpOpen(false);
                        }}
                        className="flex w-full px-4 py-4 text-left hover:bg-(--accent-color-hover) transition-colors duration-300 rounded-t-2xl">
                        <BsArrowRepeat className="w-4 h-4 mr-2" />
                        {chirp.rechirped_by_me ? 'Undo rechirp' : 'Rechirp'}
                    </button>
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setIsRechirpOpen(false);
                            setIsQuoteOpen(true);
                        }}
                        className="flex w-full px-4 py-4 text-left hover:bg-(--accent-color-hover) transition-colors duration-300 rounded-b-2xl">
                        <BsPencil className="w-4 h-4 mr-2" />
                        Quote
                    </button>
                </div>
            )}

        </div>
        {isQuoteOpen && (
            <QuotePanel
                user={user}
                chirp={chirp}
                onClose={() => setIsQuoteOpen(false)}
            />
        )}
        </>
    )
}