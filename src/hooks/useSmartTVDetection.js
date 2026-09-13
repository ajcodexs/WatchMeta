import { useState, useEffect } from 'react';

export const useSmartTVDetection = () => {
  const [isSmartTV, setIsSmartTV] = useState(false);

  useEffect(() => {
    // Detect Smart TV user agents
    const smartTVPatterns = [
      /LG-NetCast|NetCast/i,
      /SmartTV|Samsung.*TV/i,
      /Roku/i,
      /AppleTV/i,
      /Android.*TV/i,
      /Tizen/i,
      /WebOS/i,
      /QtWebEngine/i,
      /BRAVIA/i,
    ];

    const userAgent = navigator.userAgent;
    const detected = smartTVPatterns.some(pattern => pattern.test(userAgent));
    setIsSmartTV(detected);
  }, []);

  return isSmartTV;
};