import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Film, Loader2, Sparkles } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

import MovieCard from "../components/movie/MovieCard";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import ErrorMessage from "../components/ui/ErrorMessage";
import { getMovieDetails } from "../api/movieApi";
import {
  getHybridMovieRecommendations,
  getMovieHiddenGems
} from "../api/recommendationApi";

const INITIAL_LIMIT = 30;
const LOAD_MORE_STEP = 30;

const removeDuplicateMovies = (movies) => {
  const seenIds = new Set();

  return movies.filter((movie) => {
    if (!movie || !movie.tmdb_id) return false;
    if (seenIds.has(movie.tmdb_id)) return false;

    seenIds.add(movie.tmdb_id);
    return true;
  });
};

const normalizeMovies = (data) => {
  if (!data) return [];

  if (Array.isArray(data)) {
    return removeDuplicateMovies(data);
  }

  return removeDuplicateMovies(
    data.results ||
      data.recommendations ||
      data.hidden_gems ||
      data.movies ||
      []
  );
};

const MovieRecommendationList = ({ type = "recommendations" }) => {
  const { tmdbId } = useParams();
  const navigate = useNavigate();

  const [sourceMovie, setSourceMovie] = useState(null);
  const [movies, setMovies] = useState([]);

  const [currentLimit, setCurrentLimit] = useState(INITIAL_LIMIT);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [hasMore, setHasMore] = useState(true);

  const pageConfig = useMemo(() => {
    if (type === "hidden-gems") {
      return {
        title: "Hidden Gems Near This Movie",
        subtitle:
          "Lower-mainstream films ranked through hybrid similarity, rating strength, and popularity control.",
        label: "Hidden Gem Discovery",
        mood:
          "This page looks for films that feel connected to the source movie without simply showing the most obvious popular choices."
      };
    }

    return {
      title: "Similar Taste Matches",
      subtitle:
        "Hybrid recommendations powered by TF-IDF ML similarity and cinematic taste signals.",
      label: "Hybrid Recommendation",
      mood:
        "This page blends story, genre, director, cast, rating, and ML similarity to find movies close to your selected film."
    };
  }, [type]);

  const fetchRecommendationData = async (limitValue) => {
    if (type === "hidden-gems") {
      return getMovieHiddenGems(tmdbId, limitValue);
    }

    return getHybridMovieRecommendations(tmdbId, limitValue);
  };

  const loadPageData = async () => {
    try {
      setLoading(true);
      setError("");

      const [movieData, recommendationData] = await Promise.all([
        getMovieDetails(tmdbId),
        fetchRecommendationData(INITIAL_LIMIT)
      ]);

      const normalizedMovies = normalizeMovies(recommendationData);

      setSourceMovie(movieData);
      setMovies(normalizedMovies);
      setCurrentLimit(INITIAL_LIMIT);
      setHasMore(normalizedMovies.length >= INITIAL_LIMIT);
    } catch (err) {
      console.error("Recommendation page loading failed:", err);
      setError("Could not load recommendations. Make sure backend is running.");
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = async () => {
    try {
      setLoadingMore(true);
      setError("");

      const nextLimit = currentLimit + LOAD_MORE_STEP;
      const recommendationData = await fetchRecommendationData(nextLimit);
      const normalizedMovies = normalizeMovies(recommendationData);

      setMovies(normalizedMovies);
      setCurrentLimit(nextLimit);
      setHasMore(normalizedMovies.length >= nextLimit);
    } catch (err) {
      console.error("Loading more recommendations failed:", err);
      setError("Could not load more recommendations.");
    } finally {
      setLoadingMore(false);
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

  if (error && movies.length === 0) {
    return (
      <section className="min-h-screen bg-cinemaBlack px-4 py-20 md:px-8">
        <div className="mx-auto max-w-5xl">
          <button
            type="button"
            onClick={() => navigate(`/movie/${tmdbId}`)}
            className="mb-8 flex items-center gap-2 rounded-full border border-white/10 bg-black/30 px-4 py-2 text-sm text-cinemaMuted transition hover:border-cinemaGold/50 hover:text-cinemaGold"
          >
            <ArrowLeft size={17} />
            Back to movie
          </button>

          <ErrorMessage message={error} />
        </div>
      </section>
    );
  }

  return (
    <main className="min-h-screen bg-cinemaBlack">
      <section className="relative overflow-hidden border-b border-cinemaBorder px-4 py-14 md:px-8 md:py-20">
        {sourceMovie?.backdrop_url && (
          <img
            src={sourceMovie.backdrop_url}
            alt={sourceMovie.title}
            className="absolute inset-0 h-full w-full object-cover opacity-25"
          />
        )}

        <div className="absolute inset-0 bg-gradient-to-r from-black via-cinemaBlack/95 to-cinemaBlack/70" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(212,175,55,0.18),transparent_35%)]" />
        <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-cinemaBlack to-transparent" />

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

          <div className="mt-5 grid gap-8 lg:grid-cols-[1.4fr_0.6fr] lg:items-end">
            <div>
              <h1 className="font-display text-4xl font-bold leading-tight text-white md:text-6xl">
                {pageConfig.title}
              </h1>

              <p className="mt-4 max-w-3xl text-base leading-7 text-cinemaMuted md:text-lg md:leading-8">
                Based on{" "}
                <span className="font-semibold text-white">
                  {sourceMovie?.title || "this movie"}
                </span>
                . {pageConfig.subtitle}
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-black/30 p-5 backdrop-blur">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-cinemaGold">
                Recommendation Mood
              </p>

              <p className="mt-3 text-sm leading-6 text-cinemaMuted">
                {pageConfig.mood}
              </p>

              <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4">
                <span className="text-xs uppercase tracking-[0.2em] text-cinemaDim">
                  Loaded
                </span>

                <span className="font-display text-2xl font-bold text-white">
                  {movies.length}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 md:px-8 md:py-14">
        {error && (
          <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        {movies.length > 0 ? (
          <>
            <div className="mb-6">
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-cinemaGold">
                Browse Matches
              </p>

              <p className="mt-2 text-sm text-cinemaDim">
                Showing {movies.length} movies for{" "}
                {sourceMovie?.title || "this selected movie"}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {movies.map((movie) => (
                <MovieCard
                  key={`${movie.tmdb_id}-${movie.title}`}
                  movie={movie}
                />
              ))}
            </div>

            {hasMore && (
              <div className="mt-12 flex justify-center">
                <button
                  type="button"
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="flex items-center gap-2 rounded-full border border-cinemaGold/40 bg-cinemaGold/5 px-8 py-3 font-bold text-cinemaGold transition hover:bg-cinemaGold hover:text-black disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loadingMore && <Loader2 size={18} className="animate-spin" />}
                  {loadingMore ? "Loading more..." : "Load More"}
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="rounded-3xl border border-white/10 bg-cinemaPanel p-10 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-cinemaGold/20 bg-cinemaGold/10 text-cinemaGold">
              <Film size={26} />
            </div>

            <h2 className="font-display text-2xl font-bold text-white">
              No matches found yet
            </h2>

            <p className="mt-3 text-cinemaMuted">
              Try expanding the catalog from the movie page, then refresh this section.
            </p>
          </div>
        )}
      </section>
    </main>
  );
};

export default MovieRecommendationList;