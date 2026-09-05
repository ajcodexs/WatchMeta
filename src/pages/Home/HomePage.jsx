import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toDetailPath } from './urlUtils';
import HeroBanner from './HeroBanner';
import TrendingRow from './TrendingRow';
import ContinueWatchingRow from './ContinueWatchingRow';
import PersonalizedRow from './PersonalizedRow';
import SEO from './SEO';
import AdsterraBanner from '../../components/AdsterraBanner';
import AdsterraNative from '../../components/AdsterraNative';
import PropTypes from 'prop-types';

const STREAMING_PROVIDERS = [
  { id: '8', name: 'Netflix' },
  { id: '337', name: 'Disney+' },
  { id: '350', name: 'Apple TV+' },
  { id: '9', name: 'Amazon Prime Video' },
  { id: '15', name: 'Hulu' },
  { id: '531', name: 'Paramount+' },
  { id: '1899', name: 'Max' },
];

const SectionDivider = ({ label }) => (
  <div className="flex items-center gap-4 px-4 sm:px-6 mb-8 mt-4">
    <div className="flex-1 h-px bg-white/[0.05]" />
    <span className="text-gray-600 text-[11px] font-bold uppercase tracking-[0.25em]">{label}</span>
    <div className="flex-1 h-px bg-white/[0.05]" />
  </div>
);

SectionDivider.propTypes = {
  label: PropTypes.string.isRequired,
};

export default function HomePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [providerId, setProviderId] = useState(STREAMING_PROVIDERS[0].id);

  const handleSelect = (item, type) => {
    const mediaType = item.media_type ?? type;
    const pathname = toDetailPath(mediaType === 'tv' ? 'tv' : 'movie', item.id, item.title || item.name);
    
    let search = '';
    if (mediaType === 'tv' && item.season && item.episode) {
      search = `?season=${item.season}&episode=${item.episode}`;
    }

    navigate(
      { pathname, search },
      { state: { from: location.pathname + location.search } }
    );
  };

  const goMovies = () => navigate('/movies');
  const goSeries = () => navigate('/series');
  const selectedProvider = STREAMING_PROVIDERS.find(({ id }) => id === providerId) || STREAMING_PROVIDERS[0];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
      className="bg-[#0a0c12] min-h-screen"
    >
      <SEO
        title="WatchMeta — Stream Movies & TV Shows"
        description="Watch trending movies and TV shows for free. Browse by genre, discover new releases, and stream instantly on WatchMeta — powered by TMDB."
        noSuffix
      />
      
      {/* ── Visually Hidden H1 for SEO ── */}
      <h1 className="sr-only">WatchMeta - Free Movie & TV Show Streaming Platform</h1>

      <HeroBanner />

      <div className="pt-10 pb-8">
        <ContinueWatchingRow onSelect={handleSelect} />
        <PersonalizedRow onSelect={handleSelect} />

        {/* ── Movies ── */}
        <TrendingRow
          title="Trending Movies"
          type="movie"
          variant="trending"
          accent="#ef4444"
          onSelect={handleSelect}
          onSeeAll={goMovies}
        />
        <AdsterraBanner />
        <TrendingRow
          title="Top 10 Movies This Week"
          type="movie"
          variant="popular"
          showRank
          originalLanguage={['en', 'zh', 'ko', 'ja']}
          accent="#ef4444"
          onSelect={handleSelect}
          onSeeAll={goMovies}
        />
        <AdsterraBanner />
        <TrendingRow
          title="Now Playing in Theaters"
          type="movie"
          variant="now_playing"
          accent="#f59e0b"
          onSelect={handleSelect}
          onSeeAll={goMovies}
        />

        <section className="mb-12">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 sm:px-6 mb-5">
            <div className="flex items-center gap-3">
              <div className="w-1 h-6 rounded-full bg-[#C084FC]" />
              <h2 className="text-white font-bold text-lg md:text-xl tracking-tight">Only On</h2>
            </div>
            <label className="sr-only" htmlFor="streaming-provider">Choose a streaming provider</label>
            <select
              id="streaming-provider"
              value={providerId}
              onChange={(event) => setProviderId(event.target.value)}
              className="w-full sm:w-auto bg-white/[0.07] border border-[#00B7FF]/40 text-white text-sm font-semibold rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]/60"
            >
              {STREAMING_PROVIDERS.map((provider) => (
                <option key={provider.id} value={provider.id} className="bg-[#050508] text-white">
                  {provider.name}
                </option>
              ))}
            </select>
          </div>
          <TrendingRow
            title={`${selectedProvider.name} Movies`}
            type="movie"
            variant="popular"
            watchProvider={{ id: selectedProvider.id, region: 'US' }}
            accent="#00B7FF"
            onSelect={handleSelect}
            onSeeAll={goMovies}
          />
        </section>

        <TrendingRow
          title="Upcoming Movies"
          type="movie"
          variant="upcoming"
          accent="#22D3EE"
          onSelect={handleSelect}
          onSeeAll={goMovies}
        />

        <SectionDivider label="TV Shows" />

        {/* ── TV ── */}
        <TrendingRow
          title="Asian TV Shows"
          type="tv"
          variant="popular"
          originalLanguage={['ko', 'ja', 'zh']}
          sinceYear={2020}
          accent="#f97316"
          onSelect={handleSelect}
          onSeeAll={goSeries}
        />
        <AdsterraBanner />
        <TrendingRow
          title="Trending TV Shows"
          type="tv"
          variant="trending"
          accent="#8b5cf6"
          onSelect={handleSelect}
          onSeeAll={goSeries}
        />
        <TrendingRow
          title="Top 10 Series This Week"
          type="tv"
          variant="trending"
          showRank
          accent="#8b5cf6"
          onSelect={handleSelect}
          onSeeAll={goSeries}
        />
      </div>
      <AdsterraNative />
    </motion.div>
  );
}
