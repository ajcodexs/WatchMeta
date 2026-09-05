export const installDevToolsDeterrent = () => {
  if (!import.meta.env.PROD || typeof window === 'undefined') return () => {};

  const handleContextMenu = (event) => {
    event.preventDefault();
  };

  const handleKeyDown = (event) => {
    const key = event.key.toLowerCase();
    const devToolsShortcut = event.key === 'F12'
      || (event.ctrlKey && event.shiftKey && ['i', 'j', 'c'].includes(key))
      || (event.ctrlKey && key === 'u');

    if (devToolsShortcut) {
      event.preventDefault();
      event.stopPropagation();
    }
  };

  document.addEventListener('contextmenu', handleContextMenu);
  document.addEventListener('keydown', handleKeyDown, true);

  return () => {
    document.removeEventListener('contextmenu', handleContextMenu);
    document.removeEventListener('keydown', handleKeyDown, true);
  };
};
