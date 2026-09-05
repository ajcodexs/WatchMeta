import { useEffect, useState } from 'react';
import { BiTime } from 'react-icons/bi';
import { FaPlay, FaTrash } from 'react-icons/fa';
import { useLocation, useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import SEO from './SEO';
import {
  clearContinueWatching,
  CONTINUE_WATCHING_UPDATED_EVENT,
  getContinueWatching,
  removeFromContinueWatching,
} from '../../utils/continueWatching';
import { toDetailPath } from './urlUtils';

const POSTER = 'https://image.tmdb.org/t/p/w500';

const formatUpdatedAt = (timestamp) => {
  if (!timestamp) return 'Recently added';
  const date = new Date(timestamp);
  return Number.isNaN(date.getTime()) ? 'Recently added' : `Updated ${date.toLocaleDateString()}`;
};

const ContinueWatchingItem = ({ item, onSelect, onRemove }) => {
  const progress = Number.isFinite(Number(item.progress))
    ? Math.round(Math.min(1, Math.max(0, Number(item.progress))) * 100)
    : null;
  const isTv = item.mediaType === 'tv';

  return (
    <article className="group relative overflow-hidden rounded-2xl bg-white/[0.04] border border-white/[0.08]">
      <button type="button" onClick={() => onSelect(item)} className="block w-full text-left">
        <div className="relative aspect-[2/3] bg-[#111827]">
          {item.poster_path ? (
            <img src={`${POSTER}${item.poster_path}`} alt={item.title} className="w-full h-full object-cover" loading="lazy" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-500">No poster</div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent" />
          <span className="absolute left-3 bottom-3 flex items-center gap-2 text-white text-xs font-bold">
            <FaPlay className="text-[#22D3EE]" />
            Resume
          </span>
          <span className="absolute top-3 left-3 rounded-md bg-black/70 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[#C084FC]">
            {isTv ? `S${item.season} E${item.episode}` : 'Movie'}
          </span>
        </div>
        {progress !== null && (
          <div className="h-1 bg-white/10">
            <div className="h-full bg-gradient-to-r from-[#00B7FF] to-[#8B5CF6]" style={{ width: `${progress}%` }} />
          </div>
        )}
        <div className="p-4">
          <h2 className="text-white font-bold line-clamp-1">{item.title}</h2>
          <p className="text-gray-500 text-xs mt-1">{progress !== null ? `${progress}% watched` : 'Ready to resume'} · {formatUpdatedAt(item.updatedAt)}</p>
        </div>
      </button>
      <button
        type="button"
        onClick={() => onRemove(item)}
        aria-label={`Remove ${item.title} from continue watching`}
        title="Remove from Continue Watching"
        className="absolute top-3 right-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/70 text-gray-300 hover:bg-red-600 hover:text-white transition-colors"
      >
        <FaTrash className="text-xs" />
      </button>
    </article>
  );
};

ContinueWatchingItem.propTypes = {
  item: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    mediaType: PropTypes.string,
    title: PropTypes.string.isRequired,
    poster_path: PropTypes.string,
    season: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    episode: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    progress: PropTypes.number,
    updatedAt: PropTypes.number,
  }).isRequired,
  onSelect: PropTypes.func.isRequired,
  onRemove: PropTypes.func.isRequired,
};

const ContinueWatchingPage = () => {
  const [items, setItems] = useState(() => getContinueWatching());
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const refresh = () => setItems(getContinueWatching());
    window.addEventListener(CONTINUE_WATCHING_UPDATED_EVENT, refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener(CONTINUE_WATCHING_UPDATED_EVENT, refresh);
      window.removeEventListener('storage', refresh);
    };
  }, []);

  const handleSelect = (item) => {
    const section = item.mediaType === 'tv' ? 'tv' : 'movie';
    const pathname = toDetailPath(section, item.id, item.title);
    const search = item.mediaType === 'tv' && item.season && item.episode
      ? `?season=${item.season}&episode=${item.episode}`
      : '';
    navigate({ pathname, search }, { state: { from: location.pathname } });
  };

  const handleRemove = (item) => removeFromContinueWatching(item);

  const handleClearAll = () => {
    if (items.length && window.confirm('Remove all Continue Watching items?')) clearContinueWatching();
  };

  return (
    <main className="min-h-screen bg-[#050508] text-white px-4 sm:px-6 md:px-12 pt-24 pb-20">
      <SEO title="Continue Watching" description="Resume your saved movies and TV episodes on WatchMeta." url="https://watchmeta.site/continue-watching" />
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5 mb-10">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <BiTime className="text-3xl text-[#22D3EE]" />
              <p className="text-[#C084FC] text-xs font-bold uppercase tracking-[0.22em]">Your library</p>
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight">Continue Watching</h1>
            <p className="text-[#A1A1AA] mt-3">Pick up where you left off across your saved movies and episodes.</p>
          </div>
          {items.length > 0 && (
            <button type="button" onClick={handleClearAll} className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm font-semibold text-red-300 hover:bg-red-500/20 transition-colors">
              <FaTrash className="text-xs" />
              Remove all
            </button>
          )}
        </div>

        {items.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-5">
            {items.map((item) => (
              <ContinueWatchingItem
                key={`${item.mediaType}-${item.id}-${item.season || ''}-${item.episode || ''}`}
                item={item}
                onSelect={handleSelect}
                onRemove={handleRemove}
              />
            ))}
          </div>
        ) : (
          <div className="border border-dashed border-white/15 rounded-2xl px-6 py-20 text-center">
            <BiTime className="mx-auto text-5xl text-gray-600 mb-4" />
            <h2 className="text-xl font-bold text-white">Nothing here yet</h2>
            <p className="text-gray-500 mt-2 mb-6">Start watching a movie or episode and it will appear here.</p>
            <button type="button" onClick={() => navigate('/')} className="rounded-xl bg-gradient-to-r from-[#00B7FF] to-[#8B5CF6] px-5 py-3 text-sm font-bold text-white">
              Browse titles
            </button>
          </div>
        )}
      </div>
    </main>
  );
};

export default ContinueWatchingPage;
