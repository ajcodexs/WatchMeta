import React, { useEffect, useLayoutEffect, useState, useCallback, memo, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import PropTypes from "prop-types";
import { fetchMovieDetails, fetchRelatedMovies } from "../Fetcher";
import { getIdFromDetailSlug, toDetailPath } from "../urlUtils";
import { saveToContinueWatching } from "../../../utils/continueWatching";
import { FaRedo, FaStar, FaArrowLeft, FaInfoCircle, FaBookmark } from "react-icons/fa";
import { BiCalendar, BiTime, BiGlobe } from "react-icons/bi";
import DetailPageSkeleton from "../reused/DetailPageSkeleton";
import VideoPlayer from "../VideoPlayer";
import SEO from "../SEO";
import ContentCard from "../ContentCard";
import CastRow from "../reused/CastRow";
import { useWatchlist } from "../../../context/WatchlistContext";
import AdsterraBanner from "../../../components/AdsterraBanner";
import AdsterraSmartlink from '../../../components/AdsterraSmartlink';
import AdsterraNative from '../../../components/AdsterraNative';

const MemoizedVideoPlayer = memo(VideoPlayer);

const BACKDROP = "https://image.tmdb.org/t/p/original";
const POSTER   = "https://image.tmdb.org/t/p/w500";

const MovieDetails = ({ movieId: movieIdProp }) => {
  const { slug } = useParams();
  const location = useLocation();
  const movieId = movieIdProp ?? getIdFromDetailSlug(slug);
  const navigate = useNavigate();
  const [movie,        setMovie]        = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(null);
  const [retrying,     setRetrying]     = useState(false);
  const [showOverview, setShowOverview] = useState(false);
  const [related,      setRelated]      = useState([]);
  const [isDraggingRelated, setIsDraggingRelated] = useState(false);
  const { watchlistIds, toggleWatchlist: ctxToggleWatchlist } = useWatchlist();
  const inWatchlist = movie?.id ? watchlistIds.has(String(movie.id)) : false;

  const relatedListRef = useRef(null);
  const relatedDragStateRef = useRef({ active: false, startX: 0, startScrollLeft: 0, moved: false });
  const suppressRelatedClickRef = useRef(false);
  const continueWatchingSavedRef = useRef(false);

  // Prevent one-frame stale detail flash when navigating between related titles.
  useLayoutEffect(() => {
    setLoading(true);
    setError(null);
    setMovie(null);
    setRelated([]);
    setShowOverview(false);
    setIsDraggingRelated(false);
    suppressRelatedClickRef.current = false;
    continueWatchingSavedRef.current = false;
  }, [movieId]);

  const handleBack = () => {
    if (location.state?.from) {
      navigate(location.state.from);
      return;
    }
    navigate(-1);
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setRetrying(true);
    try {
      const [data, relatedData] = await Promise.all([
        fetchMovieDetails(movieId),
        fetchRelatedMovies(movieId),
      ]);
      setMovie(data);
      setRelated((relatedData ?? []).filter((item) => item?.id && item.id !== data.id).slice(0, 18));
    } catch {
      setError("Failed to load movie. Please try again.");
    } finally {
      setLoading(false);
      setRetrying(false);
    }
  }, [movieId]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [movieId]);

  const handlePlaybackStart = useCallback(() => {
    if (!movie || continueWatchingSavedRef.current) return;
    saveToContinueWatching({
      id: movie.id,
      mediaType: 'movie',
      title: movie.title,
      poster_path: movie.poster_path,
      vote_average: movie.vote_average,
      release_date: movie.release_date,
    });
    continueWatchingSavedRef.current = true;
  }, [movie]);

  useEffect(() => {
    if (!movie?.id) return;
    const isLegacyRoute = location.pathname.startsWith('/movie/');
    if (!isLegacyRoute) return;
    const canonicalPath = toDetailPath('movie', movie.id, movie.title);
    if (location.pathname !== canonicalPath) {
      navigate(canonicalPath, { replace: true, state: location.state });
    }
  }, [movie, location.pathname, location.state, navigate]);

  const toggleWatchlist = () => {
    if (!movie?.id) return;
    ctxToggleWatchlist({
      mediaId: movie.id,
      type: 'movie',
      title: movie.title,
      poster_path: movie.poster_path,
      vote_average: movie.vote_average,
      release_date: movie.release_date,
    });
  };

  const handleRelatedSelect = useCallback((item) => {
    navigate(toDetailPath('movie', item.id, item.title || item.name), {
      state: { from: '/movies' },
    });
  }, [navigate]);

  const onRelatedMouseDown = useCallback((e) => {
    if (e.button !== 0) return;
    const el = relatedListRef.current;
    if (!el) return;
    relatedDragStateRef.current = {
      active: true,
      startX: e.pageX,
      startScrollLeft: el.scrollLeft,
      moved: false,
    };
    setIsDraggingRelated(true);
  }, []);

  const onRelatedMouseMove = useCallback((e) => {
    const el = relatedListRef.current;
    const drag = relatedDragStateRef.current;
    if (!el || !drag.active) return;

    const delta = e.pageX - drag.startX;
    if (Math.abs(delta) > 4) drag.moved = true;
    el.scrollLeft = drag.startScrollLeft - delta;
  }, []);

  const endRelatedDrag = useCallback(() => {
    const drag = relatedDragStateRef.current;
    if (!drag.active) return;

    drag.active = false;
    suppressRelatedClickRef.current = drag.moved;
    setIsDraggingRelated(false);

    setTimeout(() => {
      suppressRelatedClickRef.current = false;
    }, 0);
  }, []);

  useEffect(() => {
    window.addEventListener('mouseup', endRelatedDrag);
    return () => window.removeEventListener('mouseup', endRelatedDrag);
  }, [endRelatedDrag]);

  const formatRuntime = (m) => {
    if (!m) return null;
    const h = Math.floor(m / 60), min = m % 60;
    return h > 0 ? `${h}h ${min}m` : `${min}m`;
  };

  if (loading) return (
    <DetailPageSkeleton type="movie" />
  );

  if (error) return (
    <div className="min-h-[60vh] flex items-center justify-center p-6 bg-[#090b10]">
      <div className="w-full max-w-sm p-8 text-center border bg-red-900/10 border-red-700/30 rounded-2xl backdrop-blur-md">
        <p className="mb-6 font-medium text-red-400">{error}</p>
        <button
          onClick={load}
          disabled={retrying}
          className="flex items-center justify-center w-full gap-2 px-6 py-3 font-semibold text-white transition-all bg-red-600 shadow-lg hover:bg-red-500 disabled:opacity-50 rounded-xl shadow-red-600/20"
        >
          <FaRedo className={retrying ? "animate-spin" : ""} />
          {retrying ? "Retrying…" : "Retry"}
        </button>
      </div>
    </div>
  );

  if (!movie) return null;

  const year     = movie.release_date?.slice(0, 4);
  const runtime  = formatRuntime(movie.runtime);
  const rating   = movie.vote_average > 0 ? movie.vote_average.toFixed(1) : null;
  const genres   = (movie.genres ?? []).slice(0, 4);
  const overview = movie.overview ?? "";
  const truncated = overview.length > 280 && !showOverview
    ? overview.slice(0, 280) + "…"
    : overview;

  return (
    <div className="min-h-screen bg-zinc-950 text-gray-200 selection:bg-[#ef4444]/30">
      <SEO
        title={`${movie.title}${year ? ` (${year})` : ''} — Watch Free on WatchMeta`}
        description={
          movie.overview
            ? `${movie.overview.slice(0, 150).trim()}… Watch ${movie.title} free on WatchMeta.`
            : `Watch ${movie.title} free on WatchMeta.`
        }
        image={
          movie.backdrop_path
            ? `https://image.tmdb.org/t/p/w1280${movie.backdrop_path}`
            : movie.poster_path
            ? `https://image.tmdb.org/t/p/w780${movie.poster_path}`
            : undefined
        }
        type="video.movie"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'Movie',
          name: movie.title,
          description: movie.overview,
          image: movie.poster_path ? `https://image.tmdb.org/t/p/w780${movie.poster_path}` : undefined,
          dateCreated: movie.release_date,
          ...(movie.vote_average > 0 && {
            aggregateRating: {
              '@type': 'AggregateRating',
              ratingValue: movie.vote_average.toFixed(1),
              bestRating: 10,
              ratingCount: movie.vote_count,
            },
          }),
          genre: (movie.genres ?? []).map(g => g.name),
        }}
      />

      {/* ── HERO SECTION ── */}
      <div className="relative w-full min-h-[70vh] flex flex-col justify-end pt-32 pb-20">
        {/* Backdrop Image */}
        <div className="absolute inset-0 z-0 overflow-hidden select-none">
          {movie.backdrop_path ? (
            <img
              src={`${BACKDROP}${movie.backdrop_path}`}
              alt=""
              className="object-cover object-top w-full h-full"
              style={{ filter: "brightness(0.6) contrast(1.1) saturate(1.1)", transform: "scale(1.02)" }}
            />
          ) : (
            <div className="w-full h-full bg-[#111319] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-800 to-[#111319]" />
          )}
          {/* Gradients for text legibility */}
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-zinc-950/90 via-zinc-950/50 to-transparent" />
        </div>

        {/* Back Button */}
        <div className="absolute top-0 left-0 right-0 z-20 flex p-6 md:p-10">
          <button
            onClick={handleBack}
            className="group flex items-center gap-2 bg-black/30 hover:bg-black/50 backdrop-blur-md border border-white/10 text-gray-200 hover:text-white text-sm font-medium px-5 py-2.5 rounded-full transition-all duration-300"
          >
            <FaArrowLeft className="transition-transform duration-300 group-hover:-translate-x-1" />
            <span>Back</span>
          </button>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 flex flex-col items-end w-full gap-8 px-6 mx-auto max-w-7xl md:px-12 md:flex-row lg:gap-14">
          
          {/* Poster (Desktop) */}
          {movie.poster_path && (
            <div className="z-10 hidden md:block shrink-0">
              <img
                src={`${POSTER}${movie.poster_path}`}
                alt={movie.title}
                className="w-48 lg:w-64 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.6)] ring-1 ring-white/10 group-hover:scale-105 transition-transform duration-700"
              />
            </div>
          )}

          {/* Info */}
          <div className="flex-1 max-w-3xl pb-2">
            {movie.tagline && (
              <p className="mb-3 text-xs font-semibold tracking-wider text-red-400 uppercase md:text-sm drop-shadow-md">
                {movie.tagline}
              </p>
            )}

            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white tracking-tight leading-[1.05] mb-4 drop-shadow-2xl font-sans">
              {movie.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 mb-6 text-sm font-medium text-gray-300 drop-shadow-md">
              {year && <span className="flex items-center gap-1.5"><BiCalendar className="text-base text-gray-400" /> {year}</span>}
              {runtime && <span className="flex items-center gap-1.5"><BiTime className="text-base text-gray-400" /> {runtime}</span>}
              {rating && <span className="flex items-center gap-1.5"><FaStar className="text-base text-yellow-500" /> {rating}</span>}
            </div>

            {genres.length > 0 && (
               <div className="flex flex-wrap gap-2 mb-6">
                 {genres.map(g => (
                   <span key={g.id} className="px-3 py-1 text-xs font-semibold text-gray-200 transition-colors border rounded-full shadow-sm bg-white/10 hover:bg-white/20 backdrop-blur-md border-white/10">
                     {g.name}
                   </span>
                 ))}
               </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap gap-4 mb-6">
               <button
                 onClick={toggleWatchlist}
                 className={`flex items-center gap-2 backdrop-blur-md text-white font-bold px-6 py-3 rounded-xl transition-all active:scale-[0.98] ${
                   inWatchlist 
                     ? 'bg-red-600/20 hover:bg-red-600/30 border border-red-500/50' 
                     : 'bg-white/10 hover:bg-white/20 border border-white/10'
                 }`}
               >
                 <FaBookmark className={inWatchlist ? "text-red-400" : ""} /> 
                 {inWatchlist ? "Remove from Watchlist" : "Add to Watchlist"}
               </button>
            </div>

            {overview && (
              <div className="relative">
                <p className="max-w-2xl leading-relaxed text-gray-300/90 md:text-lg drop-shadow-md">
                  {truncated}
                </p>
                {overview.length > 280 && (
                  <button
                    onClick={() => setShowOverview(p => !p)}
                    className="mt-3 text-sm font-semibold text-white underline transition-colors hover:text-red-400 underline-offset-4"
                  >
                    {showOverview ? "Show Less" : "Read More"}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── PLAYER & EXTRA CONTENT ── */}
      <div className="relative z-20 px-4 mx-auto mb-20 -mt-4 max-w-7xl sm:px-6 md:px-12 md:-mt-10">
        
        {/* Video Player Container */}
        <div className="relative">
          {/* Subtle Video Player Glow Backdrop */}
          {/* <div className="absolute -inset-1 bg-gradient-to-r from-red-600/30 to-blue-600/30 blur-2xl opacity-50 z-0 rounded-2xl md:rounded-[2rem]"></div> */}
          
          <div className="relative z-10 bg-zinc-900 border border-zinc-800 rounded-2xl md:rounded-[2rem] p-2 md:p-4 mb-6">
            <MemoizedVideoPlayer
              key={movieId}
              id={movieId}
              mediaType="movie"
              title={movie.title}
              poster={`${BACKDROP}${movie.backdrop_path || movie.poster_path}`}
              onPlaybackStart={handlePlaybackStart}
            />
          </div>
        </div>

        {/* <AdsterraSmartlink>Sponsored link</AdsterraSmartlink> */}
        {/* Info Banner */}
        <div className="flex items-start gap-4 p-4 mx-2 border bg-blue-900/10 border-blue-500/20 rounded-2xl md:p-5 md:mx-0">
          <FaInfoCircle className="text-white text-xl shrink-0 mt-0.5" />
          <p className="text-sm leading-relaxed text-white">
            For an ad-free streaming experience, we highly recommend using{" "}
            <a
              href="https://rubbingcane.com/xf4synry?key=3cf4dbd751face0ed2e325defec1ab76"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-white underline transition-colors underline-offset-2 hover:text-blue-300"
            >
              Brave Browser
            </a>
            . Enjoy watching without ads!
          </p>
        </div>
      </div>

      {/* ── CAST & CREW ── */}
      {movie.credits?.cast && movie.credits.cast.length > 0 && (
        <CastRow cast={movie.credits.cast} />
      )}

      <AdsterraBanner />
      {/* <AdsterraBanner desktop="banner468x60" mobile="banner320x50" /> */}

      {/* ── RELATED TITLES ── */}
      {related.length > 0 && (
        <section className="px-4 pb-16 sm:px-6 md:px-12">
          <div className="mx-auto max-w-7xl">
            <h3 className="flex items-center gap-3 mb-6 text-xl font-bold tracking-tight text-white md:text-2xl">
              <span className="w-1.5 h-6 bg-red-500 rounded-full inline-block"></span>
              More Like This
            </h3>
            
            <div
              ref={relatedListRef}
              onMouseDown={onRelatedMouseDown}
              onMouseMove={onRelatedMouseMove}
              onMouseLeave={endRelatedDrag}
              className={`grid grid-flow-col auto-cols-[140px] md:auto-cols-[180px] gap-4 md:gap-5 overflow-x-auto hide-scrollbar px-4 pt-6 pb-6 -mx-4 -mt-6 select-none ${isDraggingRelated ? 'cursor-grabbing' : 'cursor-grab'}`}
            >
              {related.map((item) => (
                <div key={item.id} className="transition-transform duration-300 shrink-0 hover:-translate-y-2">
                  <ContentCard
                    title={item.title || item.name}
                    poster={item.poster_path ? `${POSTER}${item.poster_path}` : '/placeholder.svg'}
                    rating={item.vote_average}
                    releaseDate={item.release_date}
                    onClick={() => {
                      if (suppressRelatedClickRef.current) return;
                      handleRelatedSelect(item);
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* <AdsterraBanner desktop="banner468x60" mobile="banner320x50" /> */}
      <AdsterraNative />

      {/* ── FOOTER ── */}
      <footer className="bg-[#040507] border-t border-white/5">
        <div className="flex flex-col items-center justify-between gap-4 px-6 py-8 mx-auto text-xs text-gray-500 max-w-7xl sm:flex-row md:text-sm">
          <div className="flex items-center gap-2">
            <span className="text-base font-black text-white">WatchMeta</span>
            {/* <span className="mx-2 opacity-50">|</span> */}
          </div>
          <div className="flex items-center gap-2">
            <span>© {new Date().getFullYear()} WatchMeta</span>
            <span className="mx-2 opacity-50">|</span>
            <span>
              Data by{' '}
              <a href="https://www.themoviedb.org" target="_blank" rel="noopener noreferrer" className="font-medium text-gray-400 transition-colors hover:text-white">
                TMDB
              </a>
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};

MovieDetails.propTypes = {
  movieId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};

export default memo(MovieDetails);
