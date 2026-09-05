// Continue Watching is tracked locally in the browser via localStorage —
// no account/auth needed since this app only uses TMDB for data.

const CW_KEY = 'wf_continue_watching';
const MAX_ITEMS = 20;
const UPDATED_EVENT = 'wf-continue-watching-updated';

export const getContinueWatchingKey = (item) => [
  item?.mediaType || 'movie',
  item?.id,
  item?.season ?? '',
  item?.episode ?? '',
].join(':');

export const getContinueWatching = () => {
  try {
    return JSON.parse(localStorage.getItem(CW_KEY) || '[]');
  } catch {
    return [];
  }
};

export const saveToContinueWatching = (item) => {
  if (!item || !item.id) return;
  try {
    const itemKey = getContinueWatchingKey(item);
    const existing = getContinueWatching().filter((i) => getContinueWatchingKey(i) !== itemKey);
    const next = [{ ...item, updatedAt: Date.now() }, ...existing].slice(0, MAX_ITEMS);
    localStorage.setItem(CW_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event(UPDATED_EVENT));
  } catch (err) {
    console.error('Failed to save to continue watching', err);
  }
};

export const removeFromContinueWatching = (itemOrId) => {
  if (!itemOrId) return;
  try {
    const itemKey = typeof itemOrId === 'object'
      ? getContinueWatchingKey(itemOrId)
      : null;
    const next = getContinueWatching().filter((i) => itemKey
      ? getContinueWatchingKey(i) !== itemKey
      : String(i.id) !== String(itemOrId));
    localStorage.setItem(CW_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event(UPDATED_EVENT));
  } catch (err) {
    console.error('Failed to remove from continue watching', err);
  }
};

export const clearContinueWatching = () => {
  try {
    localStorage.removeItem(CW_KEY);
    window.dispatchEvent(new Event(UPDATED_EVENT));
  } catch (err) {
    console.error('Failed to clear continue watching', err);
  }
};

export const CONTINUE_WATCHING_UPDATED_EVENT = UPDATED_EVENT;
