import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Compass, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

import MovieCard from "../components/movie/MovieCard";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import ErrorMessage from "../components/ui/ErrorMessage";
import {
  getAwardWinningMovies,
  getFestivalFavoriteMovies,
  getGenreMovies,
  getGlobalHiddenGemMovies,
  getTopRatedMovies,
  getTrendingMovies
} from "../api/movieApi";

const PAGE_SIZE = 50;

const removeDuplicateMovies = (movies) => {
  const seenIds = new Set();

  return movies.filter((movie) => {
    if (!movie || !movie.tmdb_id) {
      return false;
    }

    if (seenIds.has(movie.tmdb_id)) {
      return false;
    }

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

const DiscoveryList = ({ type = "trending" }) => {
  const navigate = useNavigate();

  const [movies, setMovies] = useState([]);
  const [page, setPage] = useState(1);

  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [hasMore, setHasMore] = useState(true);

  const pageConfig = useMemo(() => {
    const configs = {
      trending: {
        title: "Trending Worldwide",
        subtitle: "Popular films people are watching right now across the world.",
        label: "Live Discovery"
      },
      "top-rated": {
        title: "Top Rated Classics",
        subtitle: "High-rated films from ChalChitra’s global cinema catalog.",
        label: "Classic Discovery"
      },
      "award-winning": {
        title: "Award-Winning & Acclaimed",
        subtitle:
          "Highly rated and critically acclaimed cinema selected from ChalChitra’s cached global catalog.",
        label: "Acclaimed Cinema"
      },
      "festival-favorites": {
        title: "Festival & Art-House Favorites",
        subtitle:
          "Lower-mainstream films with strong ratings and global discovery value.",
        label: "Art-House Discovery"
      },
      romance: {
        title: "Romance & Emotional Dramas",
        subtitle: "Stories centered on love, longing, memory, and human connection.",
        label: "Genre Discovery"
      },
      thriller: {
        title: "Thrillers & Psychological Cinema",
        subtitle: "Tense, mysterious, and psychologically charged cinema.",
        label: "Genre Discovery"
      },
      "global-hidden-gems": {
        title: "Global Hidden Gems",
        subtitle:
          "Less obvious films with strong ratings and lower mainstream popularity.",
        label: "Hidden Gem Discovery"
      }
    };

    return configs[type] || configs.trending;
  }, [type]);

  const fetchDiscoveryPage = async (pageNumber) => {
    if (type === "trending") {
      return getTrendingMovies(pageNumber);
    }

    if (type === "top-rated") {
      return getTopRatedMovies(pageNumber);
    }

    if (type === "award-winning") {
      return getAwardWinningMovies(pageNumber, PAGE_SIZE);
    }

    if (type === "festival-favorites") {
      return getFestivalFavoriteMovies(pageNumber, PAGE_SIZE);
    }

    if (type === "global-hidden-gems") {
      return getGlobalHiddenGemMovies(pageNumber, PAGE_SIZE);
    }

    if (type === "romance" || type === "thriller") {
      return getGenreMovies(type, pageNumber, PAGE_SIZE);
    }

    return getTrendingMovies(pageNumber);
  };

  const fetchLargeSectionPage = async (pageNumber) => {
    if (type !== "trending" && type !== "top-rated") {
      return fetchDiscoveryPage(pageNumber);
    }

    const backendStartPage = (pageNumber - 1) * 3 + 1;

    const results = await Promise.allSettled([
      fetchDiscoveryPage(backendStartPage),
      fetchDiscoveryPage(backendStartPage + 1),
      fetchDiscoveryPage(backendStartPage + 2)
    ]);

    const combinedMovies = results.flatMap((result) => {
      if (result.status !== "fulfilled") {
        return [];
      }

      return normalizeMovies(result.value);
    });

    return {
      results: removeDuplicateMovies(combinedMovies).slice(0, PAGE_SIZE)
    };
  };

  const loadMovies = async (pageNumber = 1, append = false) => {
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      setError("");

      const data = await fetchLargeSectionPage(pageNumber);
      const newMovies = normalizeMovies(data);

      setMovies((prevMovies) => {
        if (!append) {
          return newMovies;
        }

        return removeDuplicateMovies([...prevMovies, ...newMovies]);
      });

      setPage(pageNumber);

      if (newMovies.length < PAGE_SIZE) {
        setHasMore(false);
      } else {
        setHasMore(true);
      }
    } catch (err) {
      console.error("Discovery page loading failed:", err);
      setError("Could not load this discovery section. Make sure backend is running.");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleLoadMore = () => {
    loadMovies(page + 1, true);
  };

  useEffect(() => {
    setMovies([]);
    setPage(1);
    setHasMore(true);
    loadMovies(1, false);
  }, [type]);

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
        <div className="absolute inset-0 bg-cinemaGradient" />
        <div className="absolute left-[15%] top-10 h-72 w-72 rounded-full bg-cinemaGold/10 blur-3xl" />
        <div className="absolute right-[10%] bottom-0 h-80 w-80 rounded-full bg-cinemaRed/10 blur-3xl" />

        <div className="relative mx-auto max-w-7xl">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="mb-8 flex items-center gap-2 rounded-full border border-white/10 bg-black/30 px-4 py-2 text-sm text-cinemaMuted backdrop-blur transition hover:border-cinemaGold/50 hover:text-cinemaGold"
          >
            <ArrowLeft size={17} />
            Back to home
          </button>

          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.3em] text-cinemaGold">
            <Compass size={15} />
            {pageConfig.label}
          </p>

          <h1 className="mt-4 font-display text-4xl font-bold text-white md:text-6xl">
            {pageConfig.title}
          </h1>

          <p className="mt-4 max-w-3xl text-lg leading-8 text-cinemaMuted">
            {pageConfig.subtitle}
          </p>

          <p className="mt-3 text-sm text-cinemaDim">
            Showing {movies.length} movies
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 md:px-8">
        {movies.length > 0 ? (
          <>
            <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
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
                  className="flex items-center gap-2 rounded-full border border-cinemaGold/40 px-7 py-3 font-bold text-cinemaGold transition hover:bg-cinemaGold hover:text-black disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loadingMore && <Loader2 size={18} className="animate-spin" />}
                  {loadingMore ? "Loading..." : "Load More"}
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="glass-panel rounded-3xl p-8 text-center text-cinemaMuted">
            No movies found in this discovery section yet.
          </div>
        )}
      </section>
    </main>
  );
};

export default DiscoveryList;