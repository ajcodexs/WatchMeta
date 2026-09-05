import { useEffect, useRef } from 'react';
import { ADSTERRA_UNITS } from './adsterraUnits';

const AdsterraNative = () => {
  const containerRef = useRef(null);
  const unit = ADSTERRA_UNITS.native;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    const script = document.createElement('script');
    script.async = true;
    script.dataset.cfasync = 'false';
    script.src = unit.script;
    container.appendChild(script);

    const placeholder = document.createElement('div');
    placeholder.id = unit.containerId;
    container.appendChild(placeholder);

    return () => {
      container.replaceChildren();
    };
  }, [unit]);

  return (
    <div className="w-full my-6 overflow-hidden" aria-label="Advertisement">
      <div ref={containerRef} className="w-full min-h-[90px]" />
    </div>
  );
};

export default AdsterraNative;
