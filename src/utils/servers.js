// VidLink is confirmed to emit Vidking-style postMessage events.
// VidNest, VidSrc RU, and Super have unconfirmed event formats and are unsupported for progress events.
export const SOURCES = [
  {
    name: 'Server 1 (VidNest)',
    url: (id, type, season, episode) => type === 'tv'
      ? `https://vidnest.fun/tv/${id}/${season}/${episode}`
      : `https://vidnest.fun/movie/${id}`,
  },
  {
    name: 'Server 2 (VidLink)',
    url: (id, type, season, episode) => type === 'tv'
      ? `https://vidlink.pro/tv/${id}/${season}/${episode}?primaryColor=c45454&secondaryColor=a2a2a2&iconColor=eefdec&poster=true&title=true&nextbutton=false&player=jw&autoplay=false`
      : `https://vidlink.pro/movie/${id}?primaryColor=c45454&secondaryColor=a2a2a2&iconColor=eefdec&poster=true&title=true&nextbutton=false&player=jw&autoplay=false`,
  },
  {
    name: 'Server 3 (VidSrc RU)',
    url: (id, type, season, episode) => type === 'tv'
      ? `https://vidsrc-embed.ru/embed/tv/${id}/${season}/${episode}`
      : `https://vidsrc-embed.ru/embed/movie/${id}?autoPlay=true`,
  },
  {
    name: 'Server 4 (Super)',
    url: (id, type, season, episode) => type === 'tv'
      ? `https://multiembed.mov/?video_id=${id}&tmdb=1&s=${season}&e=${episode}`
      : `https://multiembed.mov/?video_id=${id}&tmdb=1&autoPlay=true`,
  },
];
