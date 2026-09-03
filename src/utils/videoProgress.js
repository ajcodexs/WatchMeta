const PROGRESS_PREFIX = 'wf_video_progress';

const normalisePart = (value) => String(value ?? '').trim();

export const getVideoProgressKey = (mediaType, id, season, episode) => {
  const parts = [PROGRESS_PREFIX, mediaType, id];
  if (mediaType === 'tv') parts.push(season, episode);
  return parts.map(normalisePart).join(':');
};

export const readVideoProgress = (mediaType, id, season, episode) => {
  if (!mediaType || !id || typeof localStorage === 'undefined') return null;
  try {
    const value = JSON.parse(localStorage.getItem(getVideoProgressKey(mediaType, id, season, episode)) || 'null');
    return value && typeof value === 'object' ? value : null;
  } catch {
    return null;
  }
};

export const writeVideoProgress = (mediaType, id, progress) => {
  if (!mediaType || !id || !progress || typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(getVideoProgressKey(mediaType, id, progress.season, progress.episode), JSON.stringify(progress));
  } catch {
    // Ignore storage quota and private browsing failures.
  }
};

export const clearVideoProgress = (mediaType, id, season, episode) => {
  if (!mediaType || !id || typeof localStorage === 'undefined') return;
  try {
    localStorage.removeItem(getVideoProgressKey(mediaType, id, season, episode));
  } catch {
    // Ignore storage failures.
  }
};
