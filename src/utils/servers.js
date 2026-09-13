// VidLink is confirmed to emit Vidking-style postMessage events.
// VidNest, VidSrc RU, and Super have unconfirmed event formats and are unsupported for progress events.
export const SOURCES = [
  {
    name: 'Server 1 (VidSrc RU)',
    url: (id, type, season, episode) => type === 'tv'
      ? `https://vidsrc-embed.ru/embed/tv/${id}/${season}/${episode}`
      : `https://vidsrc-embed.ru/embed/movie/${id}?autoPlay=true`,
  },
  {
    name: 'Server 2 (VidLink)',
    url: (id, type, season, episode) => type === 'tv'
      ? `https://vidlink.pro/tv/${id}/${season}/${episode}?primaryColor=c45454&secondaryColor=a2a2a2&iconColor=eefdec&poster=true&title=true&nextbutton=false&player=jw&autoplay=false`
      : `https://vidlink.pro/movie/${id}?primaryColor=c45454&secondaryColor=a2a2a2&iconColor=eefdec&poster=true&title=true&nextbutton=false&player=jw&autoplay=false`,
  },
  {
    name: 'Server 3 (VidNest)',
    url: (id, type, season, episode) => type === 'tv'
      ? `https://vidnest.fun/tv/${id}/${season}/${episode}`
      : `https://vidnest.fun/movie/${id}`,
  },
  {
    name: 'Server 4 (Super)',
    url: (id, type, season, episode) => type === 'tv'
      ? `https://multiembed.mov/?video_id=${id}&tmdb=1&s=${season}&e=${episode}`
      : `https://multiembed.mov/?video_id=${id}&tmdb=1&autoPlay=true`,
  },
    {
    name: 'Server 5 (ZxcStream)',
    url: (id, type, season, episode) => type === 'tv'
      ? `https://embed.zxcstream.xyz/player/tv/${id}/${season}/${episode}`
      : `https://embed.zxcstream.xyz/player/movie/${id}`,
  },
  {
    name: 'Server 6 (Vidsrc.to)',
    url: (id, type, season, episode) => type === 'tv'
      ? `https://vidsrc.to/embed/tv/${id}/${season}/${episode}`
      : `https://vidsrc.to/embed/movie/${id}`,
  },
  {
    name: 'Server 7 (Vidsrc.cc)',
    url: (id, type, season, episode) => type === 'tv'
      ? `https://vidsrc.cc/v2/embed/tv/${id}/${season}/${episode}`
      : `https://vidsrc.cc/v2/embed/movie/${id}`,
  },
  {
    name: 'Server 8 (2Embed)',
    url: (id, type, season, episode) => type === 'tv'
      ? `https://www.2embed.cc/embedtv/${id}&s=${season}&e=${episode}`
      : `https://www.2embed.cc/embed/${id}`,
  },
  {
    name: 'Server 9 (Vidsrc.pm)',
    url: (id, type, season, episode) => type === 'tv'
      ? `https://vidsrc.pm/embed/tv/${id}/${season}/${episode}`
      : `https://vidsrc.pm/embed/movie/${id}`,
  },
];
