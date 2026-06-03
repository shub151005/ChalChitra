import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Sparkles } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

import MovieCard from "../components/movie/MovieCard";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import ErrorMessage from "../components/ui/ErrorMessage";
import { getMovieDetails } from "../api/movieApi";
import {
  getHybridMovieRecommendations,
  getMovieHiddenGems
} from "../api/recommendationApi";

const normalizeMovies = (data) => {
  if (!data) return [];

  let movieList = [];

  if (Array.isArray(data)) {
    movieList = data;
  } else {
    movieList =
      data.results ||
      data.recommendations ||
      data.hidden_gems ||
      data.movies ||
      [];
  }

  return movieList.filter((movie) => movie && movie.tmdb_id);
};

const MovieRecommendationList = ({ type = "recommendations" }) => {
  const { tmdbId } = useParams();
  const navigate = useNavigate();

  const [sourceMovie, setSourceMovie] = useState(null);
  const [movies, setMovies] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const pageConfig = useMemo(() => {
    if (type === "hidden-gems") {
      return {
        title: "Hidden Gems Near This Movie",
        subtitle:
          "Less obvious films with strong taste similarity and lower mainstream popularity.",
        label: "Hidden Gem Discovery"
      };
    }

    return {
      title: "Similar Taste Matches",
      subtitle:
        "Hybrid recommendations powered by TF-IDF ML similarity and cinematic taste signals.",
      label: "Hybrid Recommendation"
    };
  }, [type]);

  const loadPageData = async () => {
    try {
      setLoading(true);
      setError("");

      const [movieData, recommendationData] = await Promise.all([
        getMovieDetails(tmdbId),
        type === "hidden-gems"
          ? getMovieHiddenGems(tmdbId, 30)
          : getHybridMovieRecommendations(tmdbId, 30)
      ]);

      setSourceMovie(movieData);
      setMovies(normalizeMovies(recommendationData));
    } catch (err) {
      console.error("Recommendation page loading failed:", err);
      setError("Could not load recommendations. Make sure backend is running.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPageData();
  }, [tmdbId, type]);

  if (loading) {
    return (
      <section className="flex min-h-screen items-center justify-center bg-cinemaBlack">
        <LoadingSpinner />
      </section>
    );
  }

  if (error) {
    return (
      <section className="mx-auto min-h-screen max-w-5xl bg-cinemaBlack px-4 py-20 md:px-8">
        <ErrorMessage message={error} />
      </section>
    );
  }

  return (
    <main className="min-h-screen bg-cinemaBlack">
      <section className="relative overflow-hidden border-b border-cinemaBorder px-4 py-16 md:px-8">
        {sourceMovie?.backdrop_url && (
          <img
            src={sourceMovie.backdrop_url}
            alt={sourceMovie.title}
            className="absolute inset-0 h-full w-full object-cover opacity-25"
          />
        )}

        <div className="absolute inset-0 bg-gradient-to-r from-black via-cinemaBlack/95 to-cinemaBlack/70" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(212,175,55,0.18),transparent_35%)]" />

        <div className="relative mx-auto max-w-7xl">
          <button
            type="button"
            onClick={() => navigate(`/movie/${tmdbId}`)}
            className="mb-8 flex items-center gap-2 rounded-full border border-white/10 bg-black/30 px-4 py-2 text-sm text-cinemaMuted backdrop-blur transition hover:border-cinemaGold/50 hover:text-cinemaGold"
          >
            <ArrowLeft size={17} />
            Back to movie
          </button>

          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.3em] text-cinemaGold">
            <Sparkles size={15} />
            {pageConfig.label}
          </p>

          <h1 className="mt-4 font-display text-4xl font-bold text-white md:text-6xl">
            {pageConfig.title}
          </h1>

          <p className="mt-4 max-w-3xl text-lg leading-8 text-cinemaMuted">
            Based on{" "}
            <span className="font-semibold text-white">
              {sourceMovie?.title || "this movie"}
            </span>
            . {pageConfig.subtitle}
          </p>

          <p className="mt-3 text-sm text-cinemaDim">
            Showing {movies.length} movies
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 md:px-8">
        {movies.length > 0 ? (
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {movies.map((movie) => (
              <MovieCard
                key={`${movie.tmdb_id}-${movie.title}`}
                movie={movie}
              />
            ))}
          </div>
        ) : (
          <div className="glass-panel rounded-3xl p-8 text-center text-cinemaMuted">
            No recommendations found yet. Try expanding the catalog from the movie page.
          </div>
        )}
      </section>
    </main>
  );
};

export default MovieRecommendationList;