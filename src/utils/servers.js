// VidLink is confirmed to emit Vidking-style postMessage events.
// VidNest, VidSrc RU, and Super have unconfirmed event formats and are unsupported for progress events.
export const SOURCES = [
  {
    // VidSrc RU
    name: 'Server 1',
    url: (id, type, season, episode) => type === 'tv'
      ? `https://vidsrc-embed.ru/embed/tv/${id}/${season}/${episode}`
      : `https://vidsrc-embed.ru/embed/movie/${id}?autoPlay=true`,
  },
  {
    // VidLink
    name: 'Server 2',
    url: (id, type, season, episode) => type === 'tv'
      ? `https://vidlink.pro/tv/${id}/${season}/${episode}?primaryColor=c45454&secondaryColor=a2a2a2&iconColor=eefdec&poster=true&title=true&nextbutton=false&player=jw&autoplay=false`
      : `https://vidlink.pro/movie/${id}?primaryColor=c45454&secondaryColor=a2a2a2&iconColor=eefdec&poster=true&title=true&nextbutton=false&player=jw&autoplay=false`,
  },
  {
    // VidNest
    name: 'Server 3',
    url: (id, type, season, episode) => type === 'tv'
      ? `https://vidnest.fun/tv/${id}/${season}/${episode}`
      : `https://vidnest.fun/movie/${id}`,
  },
  {
    // Super
    name: 'Server 4',
    url: (id, type, season, episode) => type === 'tv'
      ? `https://multiembed.mov/?video_id=${id}&tmdb=1&s=${season}&e=${episode}`
      : `https://multiembed.mov/?video_id=${id}&tmdb=1&autoPlay=true`,
  },
  {
    // ZxcStream
    name: 'Server 5',
    url: (id, type, season, episode) => type === 'tv'
      ? `https://embed.zxcstream.xyz/player/tv/${id}/${season}/${episode}`
      : `https://embed.zxcstream.xyz/player/movie/${id}`,
  },
  {
    // Vidsrc.to
    name: 'Server 6',
    url: (id, type, season, episode) => type === 'tv'
      ? `https://vidsrc.to/embed/tv/${id}/${season}/${episode}`
      : `https://vidsrc.to/embed/movie/${id}`,
  },
  {
    // Vidsrc.cc
    name: 'Server 7',
    url: (id, type, season, episode) => type === 'tv'
      ? `https://vidsrc.cc/v2/embed/tv/${id}/${season}/${episode}`
      : `https://vidsrc.cc/v2/embed/movie/${id}`,
  },
  {
    // 2Embed
    name: 'Server 8',
    url: (id, type, season, episode) => type === 'tv'
      ? `https://www.2embed.cc/embedtv/${id}&s=${season}&e=${episode}`
      : `https://www.2embed.cc/embed/${id}`,
  },
  {
    // Vidsrc.pm
    name: 'Server 9',
    url: (id, type, season, episode) => type === 'tv'
      ? `https://vidsrc.pm/embed/tv/${id}/${season}/${episode}`
      : `https://vidsrc.pm/embed/movie/${id}`,
  },
];
