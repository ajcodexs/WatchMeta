import { memo, useCallback, useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { FaCompress, FaExpand, FaPlay, FaServer } from 'react-icons/fa';
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
    const [started, setStarted] = useState(false);
    const [sourceIdx, setSourceIdx] = useState(0);
    const [realFullscreen, setRealFullscreen] = useState(false);
    const [pseudoFullscreen, setPseudoFullscreen] = useState(false);
    const [controlsVisible, setControlsVisible] = useState(true);
    const containerRef = useRef(null);
    const iframeRef = useRef(null);
    const hideControlsTimerRef = useRef(null);

    const source = SOURCES[sourceIdx];
    const iframeSrc = source.url(id, mediaType, season, episode);
    const iframeOrigin = new URL(iframeSrc).origin;
    const fullscreenActive = realFullscreen || pseudoFullscreen;

    const showControls = useCallback(() => {
        setControlsVisible(true);
        if (hideControlsTimerRef.current) clearTimeout(hideControlsTimerRef.current);
        if (started && fullscreenActive) {
            hideControlsTimerRef.current = setTimeout(() => setControlsVisible(false), 3000);
        }
    }, [fullscreenActive, started]);

    useEffect(() => {
        setStarted(false);
        setRealFullscreen(false);
        setPseudoFullscreen(false);
        setControlsVisible(true);
    }, [id, mediaType, season, episode]);

    useEffect(() => () => {
        if (hideControlsTimerRef.current) clearTimeout(hideControlsTimerRef.current);
    }, []);

    useEffect(() => {
        document.body.style.overflow = pseudoFullscreen ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [pseudoFullscreen]);

    useEffect(() => {
        const handleFullscreenChange = () => {
            const element = document.fullscreenElement || document.webkitFullscreenElement;
            setRealFullscreen(element === containerRef.current);
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
            document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
        };
    }, []);

    useEffect(() => {
        const handleEscape = (event) => {
            if (event.key !== 'Escape') return;
            if (pseudoFullscreen) {
                event.preventDefault();
                setPseudoFullscreen(false);
            } else if (realFullscreen) {
                event.preventDefault();
                document.exitFullscreen?.();
                document.webkitExitFullscreen?.();
            }
        };
        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, [pseudoFullscreen, realFullscreen]);

    useEffect(() => {
        const handleBlur = () => {
            if (!started || document.activeElement !== iframeRef.current) return;
            showControls();
            window.setTimeout(() => window.focus(), 100);
        };
        window.addEventListener('blur', handleBlur);
        return () => window.removeEventListener('blur', handleBlur);
    }, [showControls, started]);

    useEffect(() => {
        const handleMessage = (event) => {
            if (event.origin !== iframeOrigin || event.source !== iframeRef.current?.contentWindow) return;

            const payload = getMessagePayload(event.data);
            if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return;

            const eventType = typeof payload.type === 'string'
                ? payload.type
                : typeof payload.event === 'string' ? payload.event : '';
            if (eventType !== 'timeupdate') showControls();
            if (eventType !== 'timeupdate') return;

            // VidLink is confirmed to emit Vidking-style timeupdate events.
            // VidNest, VidSrc RU, and multiembed.mov formats are unconfirmed and unsupported.
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

    const toggleFullscreen = async () => {
        const element = containerRef.current;
        if (!element) return;
        showControls();

        if (pseudoFullscreen) {
            setPseudoFullscreen(false);
            return;
        }
        if (realFullscreen) {
            try {
                await (document.exitFullscreen?.() || document.webkitExitFullscreen?.());
            } catch {
                setRealFullscreen(false);
            }
            return;
        }

        try {
            if (element.requestFullscreen) await element.requestFullscreen();
            else if (element.webkitRequestFullscreen) element.webkitRequestFullscreen();
            else throw new Error('Fullscreen API unavailable');
        } catch {
            setPseudoFullscreen(true);
        }
    };

    if (!id) return null;

    const handleSourceChange = (idx) => {
        setSourceIdx(idx);
        setStarted(false);
        setRealFullscreen(false);
        setPseudoFullscreen(false);
        showControls();
    };

    return (
        <div className="w-full flex flex-col gap-3">
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

            <div
                ref={containerRef}
                onPointerMove={showControls}
                onPointerDown={showControls}
                className={`relative w-full aspect-video bg-black rounded-xl overflow-hidden ring-1 ring-white/10 shadow-[0_0_40px_rgba(0,0,0,0.5)] ${pseudoFullscreen ? 'fixed inset-0 z-[9999] h-[100dvh] w-screen rounded-none' : ''}`}
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
                            <button
                                type="button"
                                onClick={toggleFullscreen}
                                aria-label={fullscreenActive ? 'Exit fullscreen' : 'Enter fullscreen'}
                                title={fullscreenActive ? 'Exit fullscreen' : 'Enter fullscreen'}
                                className="absolute left-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/10 text-white backdrop-blur-md transition-opacity hover:bg-white/20"
                            >
                                {fullscreenActive ? <FaCompress /> : <FaExpand />}
                            </button>
                        )}
                    </>
                ) : (
                    <button
                        type="button"
                        onClick={() => { setStarted(true); showControls(); }}
                        className="absolute inset-0 w-full h-full group"
                        aria-label={`Play ${title || 'video'}`}
                    >
                        {poster && <img src={poster} alt="" className="absolute inset-0 w-full h-full object-cover opacity-60" />}
                        <span className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/35 to-transparent" />
                        <span className="relative z-10 flex items-center justify-center w-16 h-16 mx-auto top-1/2 -translate-y-1/2 rounded-full bg-white text-black shadow-xl transition-transform group-hover:scale-110">
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
