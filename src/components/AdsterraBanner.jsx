import { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { ADSTERRA_UNITS } from './adsterraUnits';

const AdsterraBanner = ({ desktop = 'banner728x90', mobile = 'banner320x50' }) => {
    const containerRef = useRef(null);
    const [unitName, setUnitName] = useState(() => (
        typeof window !== 'undefined' && window.innerWidth < 640 ? mobile : desktop
    ));
    const unit = ADSTERRA_UNITS[unitName];

    useEffect(() => {
        const handleResize = () => setUnitName(window.innerWidth < 640 ? mobile : desktop);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [desktop, mobile]);

    useEffect(() => {
        const container = containerRef.current;
        if (!container || !unit || unit.kind !== 'banner') return undefined;

        window.atOptions = {
            key: unit.key,
            format: 'iframe',
            height: unit.height,
            width: unit.width,
            params: {},
        };

        const script = document.createElement('script');
        script.src = `https://rubbingcane.com/${unit.key}/invoke.js`;
        script.async = true;
        container.appendChild(script);

        return () => {
            script.remove();
            delete window.atOptions;
            container.replaceChildren();
        };
    }, [unit]);

    if (!unit || unit.kind !== 'banner') return null;

    return (
        <div className="flex justify-center w-full my-6 overflow-hidden" aria-label="Advertisement">
            <div ref={containerRef} style={{ width: unit.width, minHeight: unit.height, maxWidth: '100%' }} />
        </div>
    );
};

AdsterraBanner.propTypes = {
    desktop: PropTypes.oneOf(Object.keys(ADSTERRA_UNITS)),
    mobile: PropTypes.oneOf(Object.keys(ADSTERRA_UNITS)),
};

export default AdsterraBanner;
