import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

const STORAGE_KEY = 'wf_watchlist';

const WatchlistContext = createContext(null);

const readStoredWatchlist = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const { ids, items } = JSON.parse(stored);
      return { ids: new Set(ids || []), items: items || [] };
    }
  } catch { /* ignore malformed cache */ }
  return { ids: new Set(), items: [] };
};

export function WatchlistProvider({ children }) {
  const [watchlistIds, setWatchlistIds] = useState(() => readStoredWatchlist().ids);
  const [watchlistItems, setWatchlistItems] = useState(() => readStoredWatchlist().items);

  // Persist to localStorage whenever the watchlist changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ids: [...watchlistIds], items: watchlistItems }));
    } catch { /* quota exceeded — ignore */ }
  }, [watchlistIds, watchlistItems]);

  const toggleWatchlist = useCallback((item) => {
    const id = String(item.mediaId);

    setWatchlistIds((prevIds) => {
      const nextIds = new Set(prevIds);
      if (nextIds.has(id)) nextIds.delete(id);
      else nextIds.add(id);
      return nextIds;
    });

    setWatchlistItems((prevItems) => {
      const exists = prevItems.some((i) => String(i.mediaId) === id);
      if (exists) {
        return prevItems.filter((i) => String(i.mediaId) !== id);
      }
      return [{ ...item, addedAt: new Date().toISOString() }, ...prevItems];
    });
  }, []);

  return (
    <WatchlistContext.Provider value={{ watchlistIds, watchlistItems, toggleWatchlist, ready: true }}>
      {children}
    </WatchlistContext.Provider>
  );
}

export function useWatchlist() {
  const ctx = useContext(WatchlistContext);
  if (!ctx) throw new Error('useWatchlist must be used inside WatchlistProvider');
  return ctx;
}
