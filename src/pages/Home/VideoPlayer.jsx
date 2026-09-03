import { memo, useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { FaPlay, FaServer } from 'react-icons/fa';
import { SOURCES } from '../../utils/servers';
import { writeVideoProgress } from '../../utils/videoProgress';

const isFiniteNumber = (value) => typeof value === 'number' && Number.isFinite(value);

const getMessagePayload = (data) => {
    if (typeof data === 'string') {
        try {
            return JSON.parse(data);
        } catch {
            return null;
        }
    }
    return data;
};

const VideoPlayer = ({ id, mediaType, season = 1, episode = 1, title, poster }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [sourceIdx, setSourceIdx] = useState(0);
    const iframeRef = useRef(null);

    const source = SOURCES[sourceIdx];
    const iframeSrc = source.url(id, mediaType, season, episode);
    const iframeOrigin = new URL(iframeSrc).origin;

    useEffect(() => {
        const handleMessage = (event) => {
            if (event.origin !== iframeOrigin || event.source !== iframeRef.current?.contentWindow) return;

            const payload = getMessagePayload(event.data);
            if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return;

            const eventType = payload.type || payload.event;
            if (eventType !== 'timeupdate') return;

            const currentTime = Number(payload.currentTime ?? payload.current_time);
            const duration = Number(payload.duration);
            if (!isFiniteNumber(currentTime) || !isFiniteNumber(duration) || duration <= 0 || currentTime < 0) return;

            writeVideoProgress(mediaType, id, {
                currentTime,
                duration,
                progress: Math.min(1, currentTime / duration),
                updatedAt: Date.now(),
                season: mediaType === 'tv' ? season : undefined,
                episode: mediaType === 'tv' ? episode : undefined,
            });
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [episode, id, iframeOrigin, mediaType, season]);

    if (!id) return null;

    const handleSourceChange = (idx) => {
        setSourceIdx(idx);
        setIsPlaying(false);
    };

    return (
        <div className="w-full flex flex-col gap-3">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-2 px-1">
                <FaServer className="text-gray-400 text-sm mr-1" />
                <span className="text-sm text-gray-400 font-medium mr-2">Source:</span>
                {SOURCES.map((src, idx) => (
                    <button
                        key={idx}
                        onClick={() => handleSourceChange(idx)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                            sourceIdx === idx 
                                ? 'bg-red-600 text-white shadow-md' 
                                : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                        }`}
                    >
                        {src.name}
                    </button>
                ))}
            </div>

            {/* Player */}
            <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden ring-1 ring-white/10 shadow-[0_0_40px_rgba(0,0,0,0.5)]">
                {isPlaying ? (
                    <iframe
                        ref={iframeRef}
                        key={iframeSrc}
                        src={iframeSrc}
                        allow="fullscreen *; picture-in-picture *; autoplay *; encrypted-media *; screen-wake-lock *;"
                        allowFullScreen
                        webkitallowfullscreen="true"
                        mozallowfullscreen="true"
                        title={title || `${mediaType === 'tv' ? 'TV Show' : 'Movie'} Stream`}
                        referrerPolicy="origin"
                        className="absolute inset-0 w-full h-full border-0"
                        style={{ userSelect: 'none' }}
                    />
                ) : (
                    <button
                        type="button"
                        onClick={() => setIsPlaying(true)}
                        className="absolute inset-0 w-full h-full group"
                        aria-label={`Play ${title || 'video'}`}
                    >
                        {poster && (
                            <img
                                src={poster}
                                alt=""
                                className="absolute inset-0 w-full h-full object-cover opacity-60 transition-opacity group-hover:opacity-75"
                            />
                        )}
                        <span className="absolute inset-0 bg-black/40" />
                        <span className="relative z-10 flex items-center justify-center w-16 h-16 mx-auto top-1/2 -translate-y-1/2 rounded-full bg-red-600 text-white shadow-xl transition-transform group-hover:scale-110">
                            <FaPlay className="ml-1" />
                        </span>
                    </button>
                )}
            </div>
        </div>
    );
};

VideoPlayer.propTypes = {
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    mediaType: PropTypes.oneOf(['movie', 'tv']).isRequired,
    season: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    episode: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    title: PropTypes.string,
    poster: PropTypes.string,
};

export default memo(VideoPlayer);
