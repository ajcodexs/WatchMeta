import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import ParentComponent from './pages/Home/ParentComponent';
import HomePage from './pages/Home/HomePage';
import Movie from './pages/Home/Movie/Movie';
import Series from './pages/Home/TV/Series';
import SearchPage from './pages/Home/SearchPage';
import MovieDetails from './pages/Home/Movie/MovieDetails';
import TvDetails from './pages/Home/TV/TvDetails';
import LibraryPage from './pages/Home/LibraryPage';
import PersonPage from './pages/Home/Person/PersonPage';
import CreditsPage from './pages/Home/CreditsPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route element={<ParentComponent />}>
          <Route index element={<HomePage />} />
          <Route path="/movies" element={<Movie />} />
          <Route path="/movies/:genreSlug" element={<Movie />} />
          <Route path="/movies/:genreSlug/:sortSlug" element={<Movie />} />
          <Route path="/series" element={<Series />} />
          <Route path="/series/:genreSlug" element={<Series />} />
          <Route path="/series/:genreSlug/:sortSlug" element={<Series />} />
          <Route path="/movies/watch/:slug" element={<MovieDetails />} />
          <Route path="/series/watch/:slug" element={<TvDetails />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/person/:id/:slug" element={<PersonPage />} />
          <Route path="/library" element={<LibraryPage />} />
          <Route path="/watchlist" element={<Navigate to="/library" replace />} />
          <Route path="/continue-watching" element={<Navigate to="/library" replace />} />
          <Route path="/credits" element={<CreditsPage />} />
          {/* Legacy detail URLs (auto-canonicalized in page components) */}
          <Route path="/movie/:slug" element={<MovieDetails />} />
          <Route path="/tv/:slug" element={<TvDetails />} />
        </Route>
      </Routes>
      <Analytics />
      <SpeedInsights />
    </Router>
  );
}

export default App;
