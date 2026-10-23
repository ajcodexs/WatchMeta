import React from 'react';
import PropTypes from 'prop-types';
import {
  BiSearch,
  BiHomeAlt,
  BiMoviePlay,
  BiTv,
  BiBookmark
} from 'react-icons/bi';
import { GENRES, SPECIAL_CATEGORIES } from './tmdb';

const NAV_ITEMS = [
  { id: 'search', icon: BiSearch, action: 'navigate', label: 'Search' },
  { id: 'home', icon: BiHomeAlt, action: 'navigate', label: 'Home' },
  { id: 'movies', icon: BiMoviePlay, action: 'navigate', label: 'Movies' },
  { id: 'series', icon: BiTv, action: 'navigate', label: 'TV Shows' },
  { id: 'library', icon: BiBookmark, action: 'navigate', label: 'My Library' },
];

function Sidebar({ activePage, onNavigate, selectedGenreId, onGenreSelect }) {
  const ACTIVE_MAP = { search: 'search', movies: 'movies', series: 'series', library: 'library', home: 'home' };
  const activeId = ACTIVE_MAP[activePage] ?? 'home';

  const showCategories = activePage === 'movies' || activePage === 'series';
  const genreType = activePage === 'movies' ? 'movie' : 'tv';
  const allCategories = showCategories
    ? [...GENRES[genreType], ...SPECIAL_CATEGORIES[genreType]].sort((a, b) => a.name.localeCompare(b.name))
    : [];

  return (
    <aside className="
      group fixed top-0 left-0 h-full z-50
      hidden md:flex flex-col
      w-[84px] hover:w-[260px]
      bg-gray-900/95 backdrop-blur-xl
      border-r border-white/10
      shadow-2xl shadow-black/30
      overflow-hidden
      transition-[width] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]
      select-none
    ">

      {/* <div className="absolute inset-x-0 top-0 h-24 pointer-events-none bg-gradient-to-b from-red-500/10 to-transparent" /> */}

      {/* Logo */}
      <button onClick={() => onNavigate('home')} className="relative flex items-center gap-0 h-[92px] px-[30px] py-0 shrink-0 text-left hover:opacity-90 transition-transform duration-300 ease-out hover:scale-[1.03] active:scale-[0.98] origin-left">
        <div className="flex flex-col leading-tight">
          <span className="text-white font-black text-[20px] tracking-tight whitespace-nowrap leading-none">
            <span className="inline-block bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent">W</span>
            <span className="inline-block overflow-hidden max-w-0 opacity-0 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] delay-75 group-hover:max-w-[200px] group-hover:opacity-100"><span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent">atch</span><span className="text-white">Meta</span></span>
          </span>
          <span className="text-red-600 text-[10px] font-semibold tracking-[0.22em] uppercase mt-0.5 transition-all duration-500 ease-out delay-150 -translate-y-1 opacity-0 whitespace-nowrap group-hover:opacity-100 group-hover:translate-y-0">Streaming</span>
        </div>
      </button>

      {/* Nav section label */}
      <div className="px-[18px] mb-1 shrink-0">
        <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100 text-[11px] font-bold tracking-[0.22em] uppercase text-white whitespace-nowrap">
          Menu
        </span>
      </div>

      {/* Nav items */}
      <nav className={`flex flex-col gap-1 px-[10px] ${showCategories ? 'shrink-0 pb-3' : 'flex-1 pb-6'}`}>
        {NAV_ITEMS.map(({ id, icon: Icon, label }) => {
          const isActive = activeId === id;
          return (
            <button
              key={id}
              onClick={() => onNavigate(id)}
              title={label}
              className={`
                relative flex items-center gap-4 px-4 py-3.5 rounded-2xl
                w-full text-[14px] font-medium whitespace-nowrap
                border-2 transition-all duration-300 ease-out focus:outline-none active:scale-[0.98]
                ${isActive
                  ? 'border-red-500/35 bg-red-500/15 text-white shadow-sm shadow-red-950/30'
                  : 'border-transparent text-gray-400 hover:text-white hover:bg-white/5 hover:border-transparent active:scale-[0.98]'
                }
              `}
            >
              <Icon className={`text-[24px] shrink-0 transition-all duration-300 ease-out ${isActive ? 'text-white scale-110' : ''}`} />
              <span className="transition-all duration-300 delay-75 -translate-x-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-0">
                {label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Categories section — only on movies / series */}
      {showCategories && (
        <>
          <div className="mx-[18px] h-px bg-gradient-to-r from-transparent via-white/10 to-transparent shrink-0" />
          <div className="flex flex-col flex-1 min-h-0 pt-4 pb-4">
            {/* Section label */}
            <div className="px-[18px] mb-2 shrink-0">
              <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100 text-[11px] font-bold tracking-[0.22em] uppercase text-gray-500 whitespace-nowrap">
                Genres
              </span>
            </div>
            {/* Scrollable genre list */}
            <div className="flex-1 overflow-y-auto hide-scrollbar px-[10px] pt-1 flex flex-col gap-0.5">
              {allCategories.map((genre) => {
                const isActiveGenre = selectedGenreId === genre.id;
                return (
                  <button
                    key={genre.id}
                    onClick={() => onGenreSelect && onGenreSelect(genre.id)}
                    title={genre.name}
                    className={`
                      relative flex items-center gap-4 px-4 py-2.5 rounded-2xl
                      w-full text-[13px] font-medium whitespace-nowrap
                      border-2 transition-all duration-300 ease-out focus:outline-none text-left active:scale-[0.98]
                      ${isActiveGenre
                        ? 'border-red-500/30 bg-red-500/15 text-white'
                        : 'border-transparent text-gray-500 hover:text-gray-200 hover:bg-white/5 hover:border-transparent'
                      }
                    `}
                  >
                    <span className={`
                      w-2 h-2 rounded-full shrink-0 transition-all duration-300 ease-out
                      ${isActiveGenre ? 'bg-red-400 scale-150' : 'bg-gray-700'}
                    `} />
                    <span className="transition-all duration-300 delay-75 -translate-x-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-0">
                      {genre.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* Bottom spacer */}
      <div className="h-6 shrink-0" />
    </aside>
  );
}

Sidebar.propTypes = {
  activePage: PropTypes.string.isRequired,
  onNavigate: PropTypes.func.isRequired,
  selectedGenreId: PropTypes.number,
  onGenreSelect: PropTypes.func,
};

export default React.memo(Sidebar);
