import { FaArrowLeft, FaCode, FaDatabase, FaUser } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import SEO from './SEO';

const CreditsPage = () => {
  const navigate = useNavigate();

  return (
    <main className="min-h-screen bg-[#050508] text-white px-4 sm:px-6 md:px-12 pt-24 pb-20">
      <SEO
        title="Credits"
        description="Credits for WatchMeta, including TMDB attribution, the original developer, and subsequent project modifications."
        url="https://watchmeta.site/credits"
      />

      <div className="max-w-3xl mx-auto">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm font-semibold mb-10"
        >
          <FaArrowLeft />
          Back
        </button>

        <div className="mb-12">
          <p className="text-[#C084FC] text-xs font-bold uppercase tracking-[0.22em] mb-3">WatchMeta</p>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4">Credits</h1>
          <p className="text-[#A1A1AA] leading-relaxed">
            WatchMeta is a movie and TV discovery project built with respect for the people,
            services, and open-source tools that make it possible.
          </p>
        </div>

        <div className="space-y-4">
          <section className="bg-white/[0.04] border border-white/[0.1] rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <FaDatabase className="text-[#22D3EE]" />
              <h2 className="text-xl font-bold">TMDB</h2>
            </div>
            <p className="text-[#A1A1AA] leading-relaxed mb-4">
              This product uses the TMDB API and images to provide movie, TV show, cast, and
              metadata information.
            </p>
            <p className="text-white font-semibold mb-4">This product uses the TMDB API but is not endorsed or certified by TMDB.</p>
            <a
              href="https://www.themoviedb.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#22D3EE] hover:text-white underline underline-offset-4 transition-colors"
            >
              Visit TMDB
            </a>
          </section>

          <section className="bg-white/[0.04] border border-white/[0.1] rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <FaUser className="text-[#C084FC]" />
              <h2 className="text-xl font-bold">Original Development</h2>
            </div>
            <p className="text-[#A1A1AA] leading-relaxed">
              The original WatchMeta project was developed by{' '}
              <span className="text-white font-semibold">Phyo Min Thein</span>.
            </p>
          </section>

          <section className="bg-white/[0.04] border border-white/[0.1] rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <FaCode className="text-[#00B7FF]" />
              <h2 className="text-xl font-bold">WatchMeta Modifications</h2>
            </div>
            <p className="text-[#A1A1AA] leading-relaxed mb-4">
              This version was subsequently modified and maintained as WatchMeta. Modifications
              include the WatchMeta rebrand and domain metadata, a shared movie and TV video
              player, user-initiated playback, defensive playback progress tracking, and responsive
              presentation updates.
            </p>
            <p className="text-[#A1A1AA] leading-relaxed">
              The project retains the original application structure and gives credit to the
              original developer and upstream services.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
};

export default CreditsPage;
