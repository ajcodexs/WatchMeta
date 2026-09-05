import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { BiBookmark, BiTime } from 'react-icons/bi';
import { FaTrash } from 'react-icons/fa';
import { useNavigate, useLocation } from 'react-router-dom';
import PropTypes from 'prop-types';
import { useWatchlist } from '../../context/WatchlistContext';
import {
  clearContinueWatching,
  CONTINUE_WATCHING_UPDATED_EVENT,
  getContinueWatching,
  removeFromContinueWatching,
} from '../../utils/continueWatching';
import ContentCard from './ContentCard';
import SEO from './SEO';
import { toDetailPath } from './urlUtils';

const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';
const GRID_CLASSES = 'grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3 sm:gap-4';

const sortByDateDesc = (field) => (a, b) => {
  const first = Date.parse(a[field] || '') || 0;
  const second = Date.parse(b[field] || '') || 0;
  return second - first;
};

const SectionEmpty = ({ icon: Icon, title, description, actionLabel, onAction }) => (
  <div className="border border-dashed border-white/15 rounded-2xl px-6 py-12 text-center">
    <Icon className="mx-auto text-4xl text-gray-600 mb-3" />
    <h3 className="text-lg font-bold text-white">{title}</h3>
    <p className="text-gray-500 text-sm mt-2 mb-5">{description}</p>
    <button
      type="button"
      onClick={onAction}
      className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#00B7FF] to-[#8B5CF6] px-4 py-2.5 text-sm font-bold text-white"
    >
      {actionLabel}
    </button>
  </div>
);

SectionEmpty.propTypes = {
  icon: PropTypes.elementType.isRequired,
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  actionLabel: PropTypes.string.isRequired,
  onAction: PropTypes.func.isRequired,
};

const LibrarySection = ({ title, icon: Icon, children, count, action }) => (
  <section className="mb-12">
    <div className="flex items-center justify-between gap-4 mb-5">
      <div className="flex items-center gap-3">
        <Icon className="text-2xl text-[#22D3EE]" />
        <h2 className="text-2xl font-bold tracking-tight text-white">{title}</h2>
        <span className="text-xs font-bold text-[#A1A1AA] bg-white/[0.07] rounded-full px-2.5 py-1">{count}</span>
      </div>
      {action}
    </div>
    {children}
  </section>
);

LibrarySection.propTypes = {
  title: PropTypes.string.isRequired,
  icon: PropTypes.elementType.isRequired,
  children: PropTypes.node.isRequired,
  count: PropTypes.number.isRequired,
  action: PropTypes.node,
};

const LibraryPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { watchlistItems, ready, toggleWatchlist, clearWatchlist } = useWatchlist();
  const [continueItems, setContinueItems] = useState(() => getContinueWatching());

  useEffect(() => {
    const refresh = () => setContinueItems(getContinueWatching());
    window.addEventListener(CONTINUE_WATCHING_UPDATED_EVENT, refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener(CONTINUE_WATCHING_UPDATED_EVENT, refresh);
      window.removeEventListener('storage', refresh);
    };
  }, []);

  const sortedContinueItems = useMemo(
    () => [...continueItems].filter((item) => item?.id && item?.updatedAt).sort(sortByDateDesc('updatedAt')),
    [continueItems],
  );
  const sortedWatchlistItems = useMemo(
    () => [...watchlistItems].sort(sortByDateDesc('addedAt')),
    [watchlistItems],
  );

  const handleContinueSelect = (item) => {
    const section = item.mediaType === 'tv' ? 'tv' : 'movie';
    const pathname = toDetailPath(section, item.id, item.title);
    const search = item.mediaType === 'tv' && item.season && item.episode
      ? `?season=${item.season}&episode=${item.episode}`
      : '';
    navigate({ pathname, search }, { state: { from: location.pathname } });
  };

  const handleWatchlistSelect = (item) => {
    const type = item.type === 'tv' ? 'tv' : 'movie';
    navigate(toDetailPath(type, item.mediaId, item.title), { state: { from: location.pathname } });
  };

  const handleClearWatchlist = () => {
    if (sortedWatchlistItems.length && window.confirm('Remove all watchlist items?')) clearWatchlist();
  };

  return (
    <motion.main
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
      className="min-h-screen bg-[#050508] text-white px-4 sm:px-8 pt-16 md:pt-12 pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-16"
    >
      <SEO
        title="My Library"
        description="Resume watching saved movies and TV episodes, and manage your WatchMeta watchlist."
        url="https://watchmeta.site/library"
      />

      <div className="max-w-7xl mx-auto">
        <header className="mb-12">
          <p className="text-[#C084FC] text-xs font-bold uppercase tracking-[0.22em] mb-3">Your collection</p>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight">My Library</h1>
          <p className="text-[#A1A1AA] mt-3">Resume what you started and keep your next favorites close.</p>
        </header>

        {!ready ? (
          <div className="flex justify-center py-24">
            <div className="w-8 h-8 border-2 border-white/20 border-t-[#00B7FF] rounded-full animate-spin" />
          </div>
        ) : (
          <>
            <LibrarySection
              title="Continue Watching"
              icon={BiTime}
              count={sortedContinueItems.length}
              action={sortedContinueItems.length > 0 ? (
                <button type="button" onClick={() => {
                  if (window.confirm('Remove all Continue Watching items?')) clearContinueWatching();
                }} className="inline-flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-300 hover:bg-red-500/20 transition-colors">
                  <FaTrash className="text-[10px]" />
                  Remove all
                </button>
              ) : null}
            >
              {sortedContinueItems.length ? (
                <div className={GRID_CLASSES}>
                  {sortedContinueItems.map((item) => (
                    <ContinueCard
                      key={`${item.mediaType}-${item.id}-${item.season || ''}-${item.episode || ''}`}
                      item={item}
                      onSelect={handleContinueSelect}
                      onRemove={removeFromContinueWatching}
                    />
                  ))}
                </div>
              ) : (
                <SectionEmpty
                  icon={BiTime}
                  title="No continue watching yet"
                  description="Start streaming a movie or episode and it will appear here."
                  actionLabel="Start streaming"
                  onAction={() => navigate('/')}
                />
              )}
            </LibrarySection>

            <div className="h-px bg-gradient-to-r from-transparent via-white/15 to-transparent mb-12" />

            <LibrarySection
              title="Watchlist"
              icon={BiBookmark}
              count={sortedWatchlistItems.length}
              action={sortedWatchlistItems.length > 0 ? (
                <button type="button" onClick={handleClearWatchlist} className="inline-flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-300 hover:bg-red-500/20 transition-colors">
                  <FaTrash className="text-[10px]" />
                  Remove all
                </button>
              ) : null}
            >
              {sortedWatchlistItems.length ? (
                <motion.div layout className={GRID_CLASSES}>
                  <AnimatePresence mode="popLayout">
                    {sortedWatchlistItems.map((item, index) => (
                      <motion.div key={item.mediaId} layout className="relative" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} transition={{ delay: Math.min(index, 20) * 0.03 }}>
                        <ContentCard
                          title={item.title}
                          poster={item.poster_path ? `${IMAGE_BASE_URL}${item.poster_path}` : '/placeholder.svg'}
                          rating={item.vote_average}
                          releaseDate={item.release_date || item.addedAt}
                          onClick={() => handleWatchlistSelect(item)}
                          mediaId={item.mediaId}
                          mediaType={item.type}
                          posterPath={item.poster_path}
                          voteAverage={item.vote_average}
                          isWatchlistPage
                        />
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            toggleWatchlist(item);
                          }}
                          aria-label={`Remove ${item.title} from Watchlist`}
                          title="Remove from Watchlist"
                          className="absolute right-2 top-2 z-30 flex h-9 w-9 items-center justify-center rounded-full bg-black/75 text-gray-200 shadow-lg ring-1 ring-white/20 hover:bg-red-600 hover:text-white transition-colors"
                        >
                          <FaTrash className="text-xs" />
                        </button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </motion.div>
              ) : (
                <SectionEmpty
                  icon={BiBookmark}
                  title="Your watchlist is empty"
                  description="Add movies and shows you want to watch next."
                  actionLabel="Discover titles"
                  onAction={() => navigate('/movies')}
                />
              )}
            </LibrarySection>
          </>
        )}
      </div>
    </motion.main>
  );
};

const ContinueCard = ({ item, onSelect, onRemove }) => {
  const progress = Number.isFinite(Number(item.progress))
    ? Math.round(Math.min(1, Math.max(0, Number(item.progress))) * 100)
    : null;
  const title = item.title || 'Untitled';
  const releaseDate = item.release_date || '';

  return (
    <article className="group relative overflow-hidden rounded-xl bg-[#0d1117] ring-1 ring-white/5">
      <button type="button" onClick={() => onSelect(item)} className="block w-full text-left">
        <div className="relative aspect-[2/3] bg-[#111827]">
          <img src={item.poster_path ? `${IMAGE_BASE_URL}${item.poster_path}` : '/placeholder.svg'} alt={title} className="w-full h-full object-cover" loading="lazy" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent" />
          <span className="absolute left-3 bottom-3 text-white text-xs font-bold">Resume</span>
          {item.mediaType === 'tv' && <span className="absolute top-3 left-3 rounded-md bg-black/70 px-2 py-1 text-[10px] font-bold text-[#C084FC]">S{item.season} E{item.episode}</span>}
        </div>
        {progress !== null && <div className="h-1 bg-white/10"><div className="h-full bg-gradient-to-r from-[#00B7FF] to-[#8B5CF6]" style={{ width: `${progress}%` }} /></div>}
        <div className="px-2.5 pt-2 pb-2.5">
          <p className="text-white text-[13px] font-semibold leading-tight line-clamp-1">{title}</p>
          <p className="text-gray-500 text-[11px] mt-0.5">{releaseDate.slice(0, 4)}{progress !== null ? ` · ${progress}% watched` : ''}</p>
        </div>
      </button>
      <button
        type="button"
        onClick={() => onRemove(item)}
        aria-label={`Remove ${title} from Continue Watching`}
        title="Remove from Continue Watching"
        className="absolute top-3 right-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/70 text-gray-300 hover:bg-red-600 hover:text-white transition-colors"
      >
        <FaTrash className="text-xs" />
      </button>
    </article>
  );
};

ContinueCard.propTypes = {
  item: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    title: PropTypes.string,
    poster_path: PropTypes.string,
    mediaType: PropTypes.string,
    season: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    episode: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    progress: PropTypes.number,
    release_date: PropTypes.string,
  }).isRequired,
  onSelect: PropTypes.func.isRequired,
  onRemove: PropTypes.func.isRequired,
};

export default LibraryPage;
