import { useEffect, useRef } from 'react';

const AD_KEY = 'cf93f781144011f2519285ad234bf783';

const AdsterraBanner = () => {
    const containerRef = useRef(null);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return undefined;

        window.atOptions = {
            key: AD_KEY,
            format: 'iframe',
            height: 90,
            width: 728,
            params: {},
        };

        const script = document.createElement('script');
        script.src = `https://www.highrevenueformat.com/${AD_KEY}/invoke.js`;
        script.async = true;
        container.appendChild(script);

        return () => {
            script.remove();
            delete window.atOptions;
            container.replaceChildren();
        };
    }, []);

    return (
        <div className="flex justify-center w-full my-6" aria-label="Advertisement">
            <div ref={containerRef} style={{ width: 728, minHeight: 90, maxWidth: '100%' }} />
        </div>
    );
};

export default AdsterraBanner;
