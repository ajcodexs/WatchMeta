// Continue Watching is tracked locally in the browser via localStorage —
// no account/auth needed since this app only uses TMDB for data.

const CW_KEY = 'wf_continue_watching';
const MAX_ITEMS = 20;
const UPDATED_EVENT = 'wf-continue-watching-updated';

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
    const existing = getContinueWatching().filter((i) => String(i.id) !== String(item.id));
    const next = [{ ...item, updatedAt: Date.now() }, ...existing].slice(0, MAX_ITEMS);
    localStorage.setItem(CW_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event(UPDATED_EVENT));
  } catch (err) {
    console.error('Failed to save to continue watching', err);
  }
};

export const removeFromContinueWatching = (id) => {
  if (!id) return;
  try {
    const next = getContinueWatching().filter((i) => String(i.id) !== String(id));
    localStorage.setItem(CW_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event(UPDATED_EVENT));
  } catch (err) {
    console.error('Failed to remove from continue watching', err);
  }
};

export const CONTINUE_WATCHING_UPDATED_EVENT = UPDATED_EVENT;
