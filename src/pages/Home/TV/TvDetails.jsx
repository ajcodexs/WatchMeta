import React, {
  useEffect,
  useLayoutEffect,
  useState,
  useCallback,
  memo,
  useRef,
} from "react";
import { useParams, useNavigate, useLocation, useSearchParams } from "react-router-dom";
import PropTypes from "prop-types";
import { motion, AnimatePresence } from "framer-motion";
import { fetchSeriesDetails, fetchAllEpisodes, fetchRelatedSeries } from "../Fetcher";
import { getIdFromDetailSlug, toDetailPath } from "../urlUtils";
import { saveToContinueWatching } from "../../../utils/continueWatching";
import { FaRedo, FaStar, FaArrowLeft, FaTv, FaStepBackward, FaStepForward, FaInfoCircle, FaBookmark } from "react-icons/fa";
import { BiCalendar, BiGlobe, BiTv, BiChevronLeft, BiChevronRight, BiSearch } from "react-icons/bi";
import DetailPageSkeleton from "../reused/DetailPageSkeleton";
import VideoPlayer from "../VideoPlayer";
import SEO from "../SEO";
import ContentCard from "../ContentCard";
import CastRow from "../reused/CastRow";
import { useWatchlist } from "../../../context/WatchlistContext";
import AdsterraBanner from "../../../components/AdsterraBanner";
import AdsterraNative from '../../../components/AdsterraNative';


const MemoizedVideoPlayer = memo(VideoPlayer);

const BACKDROP = "https://image.tmdb.org/t/p/original";
const POSTER = "https://image.tmdb.org/t/p/w342";
const STILL = "https://image.tmdb.org/t/p/w300";

const MetaBadge = ({ icon: Icon, children }) => (
  <span className="flex items-center gap-1.5 bg-white/[0.06] border border-white/[0.12] text-gray-200 text-xs font-semibold px-3 py-1.5 rounded-full">
    {Icon && <Icon className="text-gray-400 shrink-0 text-[12px]" />}
    {children}
  </span>
);

const getValidParamNumber = (params, key) => {
  const raw = params.get(key);
  if (!raw) return null;
  const value = Number(raw);
  return Number.isInteger(value) && value > 0 ? value : null;
};

const TvDetails = ({ tvId: tvIdProp }) => {
  const { slug } = useParams();
  const location = useLocation();
  const [, setSearchParams] = useSearchParams();
  const tvId = tvIdProp ?? getIdFromDetailSlug(slug);
  const navigate = useNavigate();
  const [tv, setTv] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retrying, setRetrying] = useState(false);
  const [allSeasons, setAllSeasons] = useState([]);
  const [viewingSeason, setViewingSeason] = useState(null);
  const [playingSeason, setPlayingSeason] = useState(null);
  const [playingEpisode, setPlayingEpisode] = useState(null);
  const [showOverview, setShowOverview] = useState(false);
  const [episodeQuery, setEpisodeQuery] = useState('');
  const [isDraggingEpisodes, setIsDraggingEpisodes] = useState(false);
  const [isDraggingSeasons, setIsDraggingSeasons] = useState(false);
  const [isDraggingRelated, setIsDraggingRelated] = useState(false);
  const [related, setRelated] = useState([]);
  const { watchlistIds, toggleWatchlist: ctxToggleWatchlist } = useWatchlist();
  const inWatchlist = tv?.id ? watchlistIds.has(String(tv.id)) : false;
  const numericTvId = Number(tvId);

  const handleBack = () => {
    if (location.state?.from) {
      navigate(location.state.from);
      return;
    }
    navigate(-1);
  };

  const activeEpisodeRef = useRef(null);
  const episodeListRef = useRef(null);
  const dragStateRef = useRef({ active: false, startX: 0, startScrollLeft: 0, moved: false });
  const suppressClickRef = useRef(false);
  const seasonListRef = useRef(null);
  const seasonDragStateRef = useRef({ active: false, startX: 0, startScrollLeft: 0, moved: false });
  const suppressSeasonClickRef = useRef(false);
  const relatedListRef = useRef(null);
  const relatedDragStateRef = useRef({ active: false, startX: 0, startScrollLeft: 0, moved: false });
  const suppressRelatedClickRef = useRef(false);
  const continueWatchingSavedRef = useRef('');

  // Prevent one-frame stale detail flash when navigating between related titles.
  useLayoutEffect(() => {
    setLoading(true);
    setError(null);
    setTv(null);
    setAllSeasons([]);
    setViewingSeason(null);
    setPlayingSeason(null);
    setPlayingEpisode(null);
    setShowOverview(false);
    setEpisodeQuery('');
    setRelated([]);
    setIsDraggingEpisodes(false);
    setIsDraggingSeasons(false);
    setIsDraggingRelated(false);
    suppressClickRef.current = false;
    suppressSeasonClickRef.current = false;
    suppressRelatedClickRef.current = false;
    continueWatchingSavedRef.current = '';
  }, [tvId]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setRetrying(true);
    try {
      const [seriesData, seasonsData, relatedData] = await Promise.all([
        fetchSeriesDetails(tvId),
        fetchAllEpisodes(tvId),
        fetchRelatedSeries(tvId),
      ]);
      setTv(seriesData);
      setRelated((relatedData ?? []).filter((item) => item?.id && item.id !== seriesData.id).slice(0, 18));
      const filtered = (seasonsData ?? [])
        .filter(s => s.season_number > 0)
        .sort((a, b) => a.season_number - b.season_number);
      setAllSeasons(filtered);

      if (filtered.length > 0) {
        // Read URL params at fetch time so the correct season/episode is set as the
        // initial state directly — prevents S1E1 flash before URL sync can override.
        const urlParams = new URLSearchParams(window.location.search);
        let urlSeason = getValidParamNumber(urlParams, 'season');
        let urlEpisode = getValidParamNumber(urlParams, 'episode');

        // ++ Progress Tracking: Resume from exact episode if found in Continue Watching cache ++
        if (urlSeason === null && urlEpisode === null) {
          try {
            const cwCache = JSON.parse(localStorage.getItem('wf_cw_cache_items') || '[]');
            const cwMatch = cwCache.find(cw => cw.id === numericTvId);
            if (cwMatch && cwMatch.season && cwMatch.episode) {
              urlSeason = cwMatch.season;
              urlEpisode = cwMatch.episode;
            }
          } catch { /* ignore cache parse errors */ }
        }

        const selectedSeason =
          (urlSeason && filtered.find((s) => s.season_number === urlSeason))
          ?? filtered[0];
        const selectedEpisode =
          (urlEpisode && selectedSeason.episodes?.find((e) => e.episode_number === urlEpisode)?.episode_number)
          ?? selectedSeason.episodes?.find((e) => e.episode_number)?.episode_number
          ?? 1;

        setViewingSeason(selectedSeason.season_number);
        setPlayingSeason(selectedSeason.season_number);
        setPlayingEpisode(selectedEpisode);
      }
    } catch {
      setError("Failed to load TV show details. Please try again.");
    } finally {
      setLoading(false);
      setRetrying(false);
    }
  }, [tvId]);

  useEffect(() => {
    load();
    return () => {
      setTv(null); setAllSeasons([]);
      setViewingSeason(null); setPlayingSeason(null); setPlayingEpisode(null);
    };
  }, [load]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [tvId]);

  useEffect(() => {
    if (!tv?.id) return;
    const isLegacyRoute = location.pathname.startsWith('/tv/');
    if (!isLegacyRoute) return;
    const canonicalPath = toDetailPath('tv', tv.id, tv.name);
    if (location.pathname !== canonicalPath) {
      navigate({ pathname: canonicalPath, search: location.search }, { replace: true, state: location.state });
    }
  }, [tv, location.pathname, location.search, location.state, navigate]);

  const toggleWatchlist = () => {
    if (!tv?.id) return;
    ctxToggleWatchlist({
      mediaId: tv.id,
      type: 'tv',
      title: tv.name,
      poster_path: tv.poster_path,
      vote_average: tv.vote_average,
      release_date: tv.first_air_date,
    });
  };

  useEffect(() => {
    if (!allSeasons.length) return;
    if (loading) return;
    if (!tv?.id || Number(tv.id) !== numericTvId) return;

    const params = new URLSearchParams(location.search);
    const urlSeason = getValidParamNumber(params, 'season');
    const urlEpisode = getValidParamNumber(params, 'episode');
    if (urlSeason === null && urlEpisode === null) return;

    const selectedSeason = allSeasons.find((s) => s.season_number === urlSeason) ?? allSeasons[0];
    const selectedEpisode =
      selectedSeason.episodes?.find((e) => e.episode_number === urlEpisode)?.episode_number
      ?? selectedSeason.episodes?.find((e) => e.episode_number)?.episode_number
      ?? 1;

    if (viewingSeason !== selectedSeason.season_number) {
      setViewingSeason(selectedSeason.season_number);
    }
    if (playingSeason !== selectedSeason.season_number) {
      setPlayingSeason(selectedSeason.season_number);
    }
    if (playingEpisode !== selectedEpisode) {
      setPlayingEpisode(selectedEpisode);
    }
  }, [allSeasons, location.search, loading, tv, numericTvId]);

  useEffect(() => {
    if (!allSeasons.length || playingSeason === null || playingEpisode === null) return;
    if (loading) return;
    if (!tv?.id || Number(tv.id) !== numericTvId) return;

    const params = new URLSearchParams(location.search);
    const currentSeason = getValidParamNumber(params, 'season');
    const currentEpisode = getValidParamNumber(params, 'episode');
    if (currentSeason === playingSeason && currentEpisode === playingEpisode) return;

    const nextParams = new URLSearchParams(location.search);
    nextParams.set('season', String(playingSeason));
    nextParams.set('episode', String(playingEpisode));
    setSearchParams(nextParams, { replace: true });
  }, [allSeasons.length, playingSeason, playingEpisode, location.search, setSearchParams, loading, tv, numericTvId]);

  const handlePlaybackStart = useCallback(() => {
    if (!tv || playingSeason === null || playingEpisode === null) return;
    const itemKey = `${tv.id}:${playingSeason}:${playingEpisode}`;
    if (continueWatchingSavedRef.current === itemKey) return;
    saveToContinueWatching({
      id: tv.id,
      mediaType: 'tv',
      title: `${tv.name} - S${playingSeason}E${playingEpisode}`,
      poster_path: tv.poster_path,
      vote_average: tv.vote_average,
      release_date: tv.first_air_date,
      season: playingSeason,
      episode: playingEpisode,
    });
    continueWatchingSavedRef.current = itemKey;
  }, [tv, playingSeason, playingEpisode]);

  useEffect(() => {
    if (activeEpisodeRef.current && episodeListRef.current && viewingSeason === playingSeason) {
      const container = episodeListRef.current;
      const activeEl = activeEpisodeRef.current;
      const containerRect = container.getBoundingClientRect();
      const activeRect = activeEl.getBoundingClientRect();

      const targetLeft =
        container.scrollLeft +
        (activeRect.left - containerRect.left) -
        (containerRect.width / 2 - activeRect.width / 2);

      container.scrollTo({ left: Math.max(0, targetLeft), behavior: "smooth" });
    }
  }, [viewingSeason, playingSeason, playingEpisode]);

  const currentSeasonData = allSeasons.find(s => s.season_number === viewingSeason);
  const sortedEpisodes = [...(currentSeasonData?.episodes ?? [])].sort((a, b) => a.episode_number - b.episode_number);
  const filteredEpisodes = sortedEpisodes.filter((ep) => {
    const q = episodeQuery.trim().toLowerCase();
    if (!q) return true;
    const title = (ep.name || '').toLowerCase();
    return title.includes(q) || String(ep.episode_number).includes(q);
  });

  const activeEpisodeIndex = sortedEpisodes.findIndex((ep) => (
    ep.episode_number === playingEpisode && currentSeasonData?.season_number === playingSeason
  ));

  const jumpEpisode = (direction) => {
    if (!sortedEpisodes.length || activeEpisodeIndex < 0 || !currentSeasonData) return;
    const nextIndex = activeEpisodeIndex + direction;
    if (nextIndex < 0 || nextIndex >= sortedEpisodes.length) return;
    const nextEpisode = sortedEpisodes[nextIndex];
    setPlayingSeason(currentSeasonData.season_number);
    setPlayingEpisode(nextEpisode.episode_number);
  };

  const onEpisodeMouseDown = useCallback((e) => {
    const el = episodeListRef.current;
    if (!el) return;
    dragStateRef.current = {
      active: true,
      startX: e.pageX,
      startScrollLeft: el.scrollLeft,
      moved: false,
    };
    setIsDraggingEpisodes(true);
  }, []);

  const onEpisodeMouseMove = useCallback((e) => {
    const el = episodeListRef.current;
    const drag = dragStateRef.current;
    if (!el || !drag.active) return;

    const delta = e.pageX - drag.startX;
    if (Math.abs(delta) > 4) drag.moved = true;
    el.scrollLeft = drag.startScrollLeft - delta;
  }, []);

  const endEpisodeDrag = useCallback(() => {
    const drag = dragStateRef.current;
    if (!drag.active) return;
    drag.active = false;
    suppressClickRef.current = drag.moved;
    setIsDraggingEpisodes(false);

    // Clear click suppression after the current event loop.
    setTimeout(() => {
      suppressClickRef.current = false;
    }, 0);
  }, []);

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

  const onSeasonMouseDown = useCallback((e) => {
    if (e.button !== 0) return;
    const el = seasonListRef.current;
    if (!el) return;
    seasonDragStateRef.current = {
      active: true,
      startX: e.pageX,
      startScrollLeft: el.scrollLeft,
      moved: false,
    };
    setIsDraggingSeasons(true);
  }, []);

  const onSeasonMouseMove = useCallback((e) => {
    const el = seasonListRef.current;
    const drag = seasonDragStateRef.current;
    if (!el || !drag.active) return;

    const delta = e.pageX - drag.startX;
    if (Math.abs(delta) > 4) drag.moved = true;
    el.scrollLeft = drag.startScrollLeft - delta;
  }, []);

  const endSeasonDrag = useCallback(() => {
    const drag = seasonDragStateRef.current;
    if (!drag.active) return;
    drag.active = false;
    suppressSeasonClickRef.current = drag.moved;
    setIsDraggingSeasons(false);

    setTimeout(() => {
      suppressSeasonClickRef.current = false;
    }, 0);
  }, []);

  useEffect(() => {
    window.addEventListener('mouseup', endSeasonDrag);
    return () => window.removeEventListener('mouseup', endSeasonDrag);
  }, [endSeasonDrag]);

  useEffect(() => {
    window.addEventListener('mouseup', endEpisodeDrag);
    return () => window.removeEventListener('mouseup', endEpisodeDrag);
  }, [endEpisodeDrag]);

  useEffect(() => {
    window.addEventListener('mouseup', endRelatedDrag);
    return () => window.removeEventListener('mouseup', endRelatedDrag);
  }, [endRelatedDrag]);

  if (loading) return (
    <DetailPageSkeleton type="tv" />
  );

  if (error) return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="w-full max-w-sm p-8 text-center border bg-red-900/20 border-red-700/50 rounded-2xl">
        <p className="mb-6 text-red-300">{error}</p>
        <button
          onClick={load}
          disabled={retrying}
          className="flex items-center justify-center w-full gap-2 px-6 py-3 font-semibold text-white transition-colors bg-red-600 hover:bg-red-700 disabled:opacity-50 rounded-xl"
        >
          <FaRedo className={retrying ? "animate-spin" : ""} />
          {retrying ? "Retrying…" : "Retry"}
        </button>
      </div>
    </div>
  );

  if (!tv) return null;

  const rating = tv.vote_average > 0 ? tv.vote_average.toFixed(1) : null;
  const year = (tv.first_air_date ?? "").slice(0, 4);
  const genres = (tv.genres ?? []).slice(0, 3).map(g => g.name).join(" · ");
  const overview = tv.overview ?? "";
  const truncated = overview.length > 240 && !showOverview
    ? overview.slice(0, 240) + "…"
    : overview;

  const handleRelatedSelect = (item) => {
    navigate({ pathname: toDetailPath('tv', item.id, item.name || item.title), search: '' }, {
      state: { from: '/series' },
    });
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-gray-200 selection:bg-[#ef4444]/30">
      <SEO
        title={`${tv.name}${year ? ` (${year})` : ''} — Watch Free on WatchMeta`}
        description={
          tv.overview
            ? `${tv.overview.slice(0, 150).trim()}… Stream ${tv.name} free on WatchMeta.`
            : `Stream ${tv.name} free on WatchMeta.`
        }
        image={
          tv.backdrop_path
            ? `https://image.tmdb.org/t/p/w1280${tv.backdrop_path}`
            : tv.poster_path
              ? `https://image.tmdb.org/t/p/w780${tv.poster_path}`
              : undefined
        }
        type="video.episode"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'TVSeries',
          name: tv.name,
          description: tv.overview,
          image: tv.poster_path ? `https://image.tmdb.org/t/p/w780${tv.poster_path}` : undefined,
          startDate: tv.first_air_date,
          numberOfSeasons: allSeasons.length || undefined,
          ...(tv.vote_average > 0 && {
            aggregateRating: {
              '@type': 'AggregateRating',
              ratingValue: tv.vote_average.toFixed(1),
              bestRating: 10,
              ratingCount: tv.vote_count,
            },
          }),
          genre: (tv.genres ?? []).map(g => g.name),
        }}
      />

      {/* ── HERO SECTION ── */}
      <div className="relative w-full min-h-[70vh] flex flex-col justify-end pt-32 pb-20">
        {/* Backdrop Image */}
        <div className="absolute inset-0 z-0 overflow-hidden select-none">
          {tv.backdrop_path ? (
            <img
              src={`${BACKDROP}${tv.backdrop_path}`}
              alt=""
              className="object-cover object-top w-full h-full"
              style={{ filter: "brightness(0.6) contrast(1.1) saturate(1.1)", transform: "scale(1.02)" }}
            />
          ) : (
            <div className="w-full h-full bg-[#111319] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-800 to-[#111319]" />
          )}
          {/* Gradients */}
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
          
          {/* Poster */}
          {tv.poster_path && (
            <div className="z-10 hidden md:block shrink-0">
              <img
                src={`${POSTER}${tv.poster_path}`}
                alt={tv.name}
                className="w-48 transition-transform duration-700 lg:w-64 rounded-2xl ring-1 ring-white/10 group-hover:scale-105"
              />
            </div>
          )}

          {/* Info */}
          <div className="flex-1 max-w-3xl pb-2">
            {tv.tagline && (
              <p className="mb-3 text-xs font-semibold tracking-wider text-red-400 uppercase md:text-sm drop-shadow-md">
                {tv.tagline}
              </p>
            )}

            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white tracking-tight leading-[1.05] mb-4 drop-shadow-2xl font-sans">
              {tv.name}
            </h1>

            <div className="flex flex-wrap items-center gap-4 mb-6 text-sm font-medium text-gray-300 drop-shadow-md">
              {year && <span className="flex items-center gap-1.5"><BiCalendar className="text-base text-gray-400" /> {year}</span>}
              {allSeasons.length > 0 && <span className="flex items-center gap-1.5"><BiTv className="text-base text-gray-400" /> {allSeasons.length} Season{allSeasons.length !== 1 ? 's' : ''}</span>}
              {rating && <span className="flex items-center gap-1.5"><FaStar className="text-base text-yellow-500" /> {rating}</span>}
            </div>

            {(tv.genres ?? []).length > 0 && (
               <div className="flex flex-wrap gap-2 mb-6">
                 {(tv.genres ?? []).map(g => (
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
                {overview.length > 240 && (
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

      {/* ── PLAYER SECTION ── */}
      <div className="relative z-20 px-4 mx-auto mb-12 -mt-4 max-w-7xl sm:px-6 md:px-12 md:-mt-10">
        <div className="relative mb-6">
          {/* Subtle Video Player Glow Backdrop */}
          {/* <div className="absolute -inset-1 bg-gradient-to-r from-red-600/30 to-blue-600/30 blur-2xl opacity-50 z-0 rounded-2xl md:rounded-[2rem]"></div> */}
          
          <div className="relative z-10 bg-zinc-900 border border-zinc-800 rounded-2xl md:rounded-[2rem] p-2 md:p-4 mb-6">
            {playingSeason !== null && playingEpisode !== null ? (
              <MemoizedVideoPlayer
                id={tvId}
                mediaType="tv"
                season={playingSeason}
                episode={playingEpisode}
                title={tv.name}
                poster={`${BACKDROP}${tv.backdrop_path || tv.poster_path}`}
                onPlaybackStart={handlePlaybackStart}
                key={`${tvId}-${playingSeason}-${playingEpisode}`}
              />
            ) : (
              <div className="flex items-center justify-center w-full font-medium text-gray-400 bg-black aspect-video rounded-xl">
                Select an episode to start watching
              </div>
            )}

          
          {/* Controls */}
          {playingSeason !== null && playingEpisode !== null && sortedEpisodes.length > 1 && (
            <div className="flex items-center justify-between gap-3 px-2 mt-4 mb-2">
              <button
                onClick={() => jumpEpisode(-1)}
                disabled={activeEpisodeIndex <= 0}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/[0.05] border border-white/[0.1] text-gray-300 hover:text-white hover:bg-white/[0.10] disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 text-sm font-semibold"
              >
                <FaStepBackward className="text-xs" />
                Prev
              </button>

              <span className="hidden max-w-sm text-xs font-semibold tracking-wide text-center text-gray-400 truncate sm:block">
                S{String(playingSeason).padStart(2, '0')} · E{String(playingEpisode).padStart(2, '0')}
                {activeEpisodeIndex >= 0 && sortedEpisodes[activeEpisodeIndex]?.name
                  ? ` — ${sortedEpisodes[activeEpisodeIndex].name}`
                  : ''}
              </span>

              <button
                onClick={() => jumpEpisode(1)}
                disabled={activeEpisodeIndex < 0 || activeEpisodeIndex >= sortedEpisodes.length - 1}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600/90 hover:bg-red-500 border border-red-500/50 text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 text-sm font-semibold"
              >
                Next
                <FaStepForward className="text-xs" />
              </button>
            </div>
          )}
          </div>
        </div>
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

          
      {/* ── EPISODES SELECTOR ── */}
      {allSeasons.length > 0 && (
        <div className="px-4 pb-16 mx-auto max-w-7xl sm:px-6 md:px-12">
          <section className="bg-[#111319]/50 backdrop-blur-md rounded-[2rem] border border-white/5 overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 md:px-8 border-b border-white/[0.04]">
              <div className="flex items-center w-full min-w-0 gap-4 sm:w-auto">
                <div className="flex items-center justify-center w-10 h-10 border rounded-2xl bg-gradient-to-br from-red-500/20 to-red-500/5 border-red-500/20 shrink-0">
                  <BiTv className="text-lg text-white" />
                </div>
                <div>
                  <h2 className="text-lg md:text-xl font-bold text-white mb-0.5">Episodes</h2>
                  <p className="text-xs font-medium text-gray-400">
                    {currentSeasonData?.episodes?.length ?? 0} episodes in Season {viewingSeason}
                  </p>
                </div>
              </div>

              {/* Search */}
              <div className="relative w-full sm:w-64">
                <BiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white text-sm" />
                <input
                  type="text"
                  value={episodeQuery}
                  onChange={(e) => setEpisodeQuery(e.target.value)}
                  placeholder="Search episodes…"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-sm text-white placeholder-white focus:outline-none focus:border-red-500/50 focus:bg-white/[0.05] transition-all"
                />
              </div>
            </div>

            {/* Seasons List */}
            {allSeasons.length > 1 && (
              <div className="px-5 pt-6 pb-2 md:px-8">
                <div
                  ref={seasonListRef}
                  onMouseDown={onSeasonMouseDown}
                  onMouseMove={onSeasonMouseMove}
                  onMouseLeave={endSeasonDrag}
                  className={`flex gap-3 overflow-x-auto hide-scrollbar ${isDraggingSeasons ? 'cursor-grabbing' : 'cursor-grab'}`}
                >
                  {allSeasons.map(season => {
                    const isViewing = viewingSeason === season.season_number;
                    return (
                      <button
                        key={season.id ?? season.season_number}
                        onClick={(e) => {
                          if (suppressSeasonClickRef.current) {
                            e.preventDefault();
                            e.stopPropagation();
                            return;
                          }
                          const defaultEpisode =
                            season.episodes?.find((ep) => ep.episode_number === 1)?.episode_number
                            ?? season.episodes?.[0]?.episode_number
                            ?? 1;
                          setViewingSeason(season.season_number);
                          setPlayingSeason(season.season_number);
                          setPlayingEpisode(defaultEpisode);
                        }}
                        className={`shrink-0 px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ${isViewing ? 'bg-red-600 text-white' : 'bg-white/[0.04] text-gray-400 hover:bg-white/[0.08] hover:text-white border border-white/5'}`}
                      >
                        Season {season.season_number}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Episodes List */}
            <div className="p-5 pt-4 pb-8 md:px-8">
              {filteredEpisodes.length > 0 ? (
                <div
                  ref={episodeListRef}
                  onMouseDown={onEpisodeMouseDown}
                  onMouseMove={onEpisodeMouseMove}
                  onMouseLeave={endEpisodeDrag}
                  className={`grid grid-flow-col auto-cols-[180px] sm:auto-cols-[220px] gap-4 overflow-x-auto hide-scrollbar pb-4 select-none ${isDraggingEpisodes ? 'cursor-grabbing' : 'cursor-grab'}`}
                >
                  {filteredEpisodes.map(ep => {
                    const isPlaying = playingSeason === viewingSeason && playingEpisode === ep.episode_number;
                    return (
                      <button
                        ref={isPlaying ? activeEpisodeRef : null}
                        key={ep.id ?? ep.episode_number}
                        onClick={() => {
                          if (suppressClickRef.current) return;
                          setPlayingSeason(currentSeasonData.season_number);
                          setPlayingEpisode(ep.episode_number);
                        }}
                        className="relative flex flex-col overflow-hidden text-left transition-all duration-300 bg-black group rounded-2xl hover:ring-2 hover:ring-white/20 shrink-0"
                        style={isPlaying ? {
                          ringWidth: '2px',
                          ringColor: '#dc2626',
                        } : {
                           ringWidth: '1px',
                           ringColor: 'rgba(255,255,255,0.1)'
                        }}
                      >
                        <div className={`absolute inset-0 border-2 rounded-2xl pointer-events-none z-20 ${isPlaying ? 'border-red-500' : 'border-white/5 group-hover:border-white/20'} transition-colors`}></div>
                        
                        {/* Thumbnail */}
                        <div className="relative w-full aspect-video bg-[#0d1117] overflow-hidden">
                          {ep.still_path ? (
                            <img
                              src={`${STILL}${ep.still_path}`}
                              alt=""
                              className={`w-full h-full object-cover transition-transform duration-500 ${isPlaying ? 'scale-105' : 'group-hover:scale-110'}`}
                              draggable={false}
                            />
                          ) : (
                            <div className="flex items-center justify-center w-full h-full">
                              <BiTv className="text-2xl text-gray-700" />
                            </div>
                          )}

                          <span className="absolute top-2 left-2 bg-black/80 backdrop-blur-md text-white/90 text-[10px] font-bold px-2 py-1 rounded-md border border-white/10 z-10">
                            E{ep.episode_number}
                          </span>

                          {isPlaying && (
                            <span className="absolute top-2 right-2 flex items-center gap-1.5 text-[10px] font-bold bg-red-600 text-white px-2.5 py-1 rounded-full z-10">
                              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                              PLAYING
                            </span>
                          )}

                          {!isPlaying && (
                            <div className="absolute inset-0 z-10 flex items-center justify-center transition-opacity duration-300 opacity-0 bg-black/40 group-hover:opacity-100">
                              <div className="flex items-center justify-center w-12 h-12 text-white transition-transform duration-300 transform scale-90 rounded-full shadow-lg bg-red-600/90 group-hover:scale-100">
                                <svg className="w-5 h-5 ml-1" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M8 5v14l11-7z" />
                                </svg>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Info */}
                        <div className={`px-4 py-3.5 flex-1 relative z-10 ${isPlaying ? 'bg-red-950/40' : 'bg-[#151821]'}`}>
                          <p className={`text-sm font-bold line-clamp-2 leading-snug ${isPlaying ? 'text-white' : 'text-gray-300 group-hover:text-white'}`}>
                            {ep.name || `Episode ${ep.episode_number}`}
                          </p>
                          {ep.runtime && (
                            <p className="text-[11px] text-white font-medium mt-1.5">{ep.runtime} min</p>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="py-10 text-center text-gray-500 bg-white/[0.02] rounded-2xl border border-white/5">
                  <p className="text-sm">{episodeQuery.trim() ? 'No episodes found matching your search.' : 'No episodes available for this season.'}</p>
                </div>
              )}
            </div>
          </section>
        </div>
      )}

        <AdsterraBanner />

      {/* ── CAST & CREW ── */}
      {tv.credits?.cast && tv.credits.cast.length > 0 && (
        <CastRow cast={tv.credits.cast} />
      )}

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
                    title={item.name || item.title}
                    poster={item.poster_path ? `https://image.tmdb.org/t/p/w342${item.poster_path}` : '/placeholder.svg'}
                    rating={item.vote_average}
                    releaseDate={item.first_air_date}
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

TvDetails.propTypes = {
  tvId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};

export default memo(TvDetails);
