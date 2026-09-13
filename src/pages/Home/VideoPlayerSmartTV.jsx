import { memo, useCallback, useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { SOURCES } from '../../utils/servers';
import { writeVideoProgress } from '../../utils/videoProgress';
import { useSmartTVDetection } from '../../hooks/useSmartTVDetection';

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

const VideoPlayerSmartTV = ({ id, mediaType, season = 1, episode = 1, title, poster }) => {
    const isSmartTV = useSmartTVDetection();
    const [started, setStarted] = useState(false);
    const [sourceIdx, setSourceIdx] = useState(0);
    const [controlsVisible, setControlsVisible] = useState(true);
    const [selectedControlIndex, setSelectedControlIndex] = useState(0);
    const containerRef = useRef(null);
    const iframeRef = useRef(null);
    const hideControlsTimerRef = useRef(null);

    const source = SOURCES[sourceIdx];
    const iframeSrc = source.url(id, mediaType, season, episode);
    const iframeOrigin = new URL(iframeSrc).origin;

    // Smart TV: Disable complex fullscreen interactions
    // and focus on simple controls
    
    const showControls = useCallback(() => {
        setControlsVisible(true);
        if (hideControlsTimerRef.current) clearTimeout(hideControlsTimerRef.current);
        
        // On Smart TV, keep controls visible longer
        if (started && isSmartTV) {
            hideControlsTimerRef.current = setTimeout(() => setControlsVisible(false), 8000);
        } else if (started) {
            hideControlsTimerRef.current = setTimeout(() => setControlsVisible(false), 3000);
        }
    }, [started, isSmartTV]);

    useEffect(() => {
        setStarted(false);
        setControlsVisible(true);
    }, [id, mediaType, season, episode]);

    useEffect(() => () => {
        if (hideControlsTimerRef.current) clearTimeout(hideControlsTimerRef.current);
    }, []);

    // Smart TV: Handle remote control navigation
    useEffect(() => {
        if (!isSmartTV) return;

        const handleKeyDown = (event) => {
            showControls();

            // Arrow keys for navigation
            if (event.key === 'ArrowRight') {
                event.preventDefault();
                handleSourceChange((sourceIdx + 1) % SOURCES.length);
            } else if (event.key === 'ArrowLeft') {
                event.preventDefault();
                handleSourceChange((sourceIdx - 1 + SOURCES.length) % SOURCES.length);
            } else if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                if (!started) setStarted(true);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isSmartTV, sourceIdx, started]);

    // Progress tracking
    useEffect(() => {
        const handleMessage = (event) => {
            if (event.origin !== iframeOrigin || event.source !== iframeRef.current?.contentWindow) return;

            const payload = getMessagePayload(event.data);
            if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return;

            const eventType = typeof payload.type === 'string'
                ? payload.type
                : typeof payload.event === 'string' ? payload.event : '';
            
            if (eventType !== 'timeupdate') {
                showControls();
                return;
            }

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
    }, [episode, id, iframeOrigin, mediaType, season, showControls]);

    if (!id) return null;

    const handleSourceChange = (idx) => {
        setSourceIdx(idx);
        setStarted(false);
        setSelectedControlIndex(0);
        showControls();
    };

    // Smart TV: Simplified large button controls
    if (isSmartTV) {
        return (
            <div className="w-full flex flex-col gap-4 p-4">
                {/* Title */}
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-white">{title || 'Video'}</h2>
                </div>

                {/* Source Selector - Large buttons for remote control */}
                <div className="flex flex-wrap justify-center gap-4">
                    {SOURCES.map((src, idx) => (
                        <button
                            key={idx}
                            onClick={() => handleSourceChange(idx)}
                            onFocus={() => setSelectedControlIndex(idx)}
                            className={`px-6 py-3 rounded-lg text-lg font-bold transition-all ${
                                sourceIdx === idx
                                    ? 'bg-red-600 text-white ring-4 ring-white shadow-lg scale-105'
                                    : 'bg-gray-700 text-white hover:bg-gray-600 focus:ring-4 focus:ring-white'
                            }`}
                            style={{ minWidth: '120px', minHeight: '60px' }}
                        >
                            {src.name}
                        </button>
                    ))}
                </div>

                {/* Video Container */}
                <div
                    ref={containerRef}
                    className="relative w-full aspect-video bg-black rounded-xl overflow-hidden ring-2 ring-white/20"
                >
                    {started ? (
                        <>
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
                            {controlsVisible && (
                                <div className="absolute bottom-4 left-4 right-4 bg-black/70 p-4 rounded text-white text-center">
                                    <p className="text-sm">Use ← → to switch servers | Press Enter to play</p>
                                </div>
                            )}
                        </>
                    ) : (
                        <button
                            type="button"
                            onClick={() => { setStarted(true); showControls(); }}
                            className="absolute inset-0 w-full h-full group flex flex-col items-center justify-center"
                        >
                            {poster && <img src={poster} alt="" className="absolute inset-0 w-full h-full object-cover opacity-50" />}
                            <span className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent" />
                            <span className="relative z-10 text-center">
                                <div className="mb-4 text-4xl text-white">▶</div>
                                <p className="text-white text-lg font-semibold">Press Enter to Play</p>
                                <p className="text-gray-300 text-sm mt-2">Use ← → to change servers</p>
                            </span>
                        </button>
                    )}
                </div>

                {/* Info */}
                <div className="text-center text-gray-400 text-sm">
                    <p>Current Server: {source.name}</p>
                </div>
            </div>
        );
    }

    // Desktop version (keep original)
    return <OriginalVideoPlayer {...arguments} />;
};

VideoPlayerSmartTV.propTypes = {
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    mediaType: PropTypes.oneOf(['movie', 'tv']).isRequired,
    season: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    episode: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    title: PropTypes.string,
    poster: PropTypes.string,
};

export default memo(VideoPlayerSmartTV);