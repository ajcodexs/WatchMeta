import PropTypes from 'prop-types';
import { ADSTERRA_UNITS } from './adsterraUnits';

const AdsterraSmartlink = ({ children = 'Sponsored link' }) => (
  <a
    href={ADSTERRA_UNITS.smartlink.href}
    target="_blank"
    rel="noopener noreferrer sponsored"
    className="inline-flex items-center justify-center text-[#A1A1AA] hover:text-white underline underline-offset-4 transition-colors"
  >
    {children}
  </a>
);

AdsterraSmartlink.propTypes = {
  children: PropTypes.node,
};

export default AdsterraSmartlink;
