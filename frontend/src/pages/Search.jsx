import { useEffect, useState } from "react";
import { Search as SearchIcon, X } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";

import MovieCard from "../components/movie/MovieCard";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import ErrorMessage from "../components/ui/ErrorMessage";
import {
  getTopRatedMovies,
  getTrendingMovies,
  searchMovies,
  suggestMovies
} from "../api/movieApi";

const searchCache = new Map();

const getCacheKey = (query, page) => {
  return `${query.trim().toLowerCase()}::${page}`;
};

const getSuggestCacheKey = (query) => {
  return `suggest::${query.trim().toLowerCase()}`;
};

const Search = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const initialQuery = searchParams.get("q") || "";
  const section = searchParams.get("section");

  const [query, setQuery] = useState(initialQuery);
  const [movies, setMovies] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchTitle, setSearchTitle] = useState("Search ChalChitra");

  const [page, setPage] = useState(1);
  const [currentMode, setCurrentMode] = useState(section || "search");

  const [loading, setLoading] = useState(false);
  const [suggestionLoading, setSuggestionLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");

  const loadSectionMovies = async (
    sectionName,
    pageNumber = 1,
    append = false
  ) => {
    try {
      setShowSuggestions(false);
      setSuggestions([]);

      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      setError("");

      let data;

      if (sectionName === "trending") {
        data = await getTrendingMovies(pageNumber);
        setSearchTitle("Trending Worldwide");
      } else if (sectionName === "top-rated") {
        data = await getTopRatedMovies(pageNumber);
        setSearchTitle("Top Rated Classics");
      } else {
        return;
      }

      const newMovies = data.results || [];

      setMovies((prev) => {
        if (!append) {
          return newMovies;
        }

        const existingIds = new Set(prev.map((movie) => movie.tmdb_id));
        const uniqueNewMovies = newMovies.filter(
          (movie) => !existingIds.has(movie.tmdb_id)
        );

        return [...prev, ...uniqueNewMovies];
      });

      setPage(pageNumber);
      setCurrentMode(sectionName);
    } catch (err) {
      setError("Could not load this movie section.");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const runSearch = async (
    searchQuery = query,
    pageNumber = 1,
    append = false
  ) => {
    const cleanedQuery = searchQuery.trim();

    setShowSuggestions(false);
    setSuggestions([]);

    if (!cleanedQuery) {
      setMovies([]);
      setSearchTitle("Search ChalChitra");
      setSearchParams({});
      return;
    }

    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      setError("");

      const cacheKey = getCacheKey(cleanedQuery, pageNumber);

      let data;

      if (searchCache.has(cacheKey)) {
        data = searchCache.get(cacheKey);
      } else {
        data = await searchMovies(cleanedQuery, pageNumber);
        searchCache.set(cacheKey, data);
      }

      const newMovies = data.results || [];

      setMovies((prev) => {
        if (!append) {
          return newMovies;
        }

        const existingIds = new Set(prev.map((movie) => movie.tmdb_id));
        const uniqueNewMovies = newMovies.filter(
          (movie) => !existingIds.has(movie.tmdb_id)
        );

        return [...prev, ...uniqueNewMovies];
      });

      setQuery(cleanedQuery);
      setSearchTitle(`Search results for "${cleanedQuery}"`);
      setSearchParams({ q: cleanedQuery });
      setPage(pageNumber);
      setCurrentMode("search");
    } catch (err) {
      setError("Search failed. Make sure backend is running.");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const fetchSuggestions = async (value) => {
    const cleanedValue = value.trim();

    if (!showSuggestions) {
      return;
    }

    if (cleanedValue.length < 4) {
      setSuggestions([]);
      return;
    }

    try {
      setSuggestionLoading(true);

      const cacheKey = getSuggestCacheKey(cleanedValue);

      let data;

      if (searchCache.has(cacheKey)) {
        data = searchCache.get(cacheKey);
      } else {
        data = await suggestMovies(cleanedValue, 5);
        searchCache.set(cacheKey, data);
      }

      setSuggestions((data.results || data.suggestions || []).slice(0, 5));
    } catch (err) {
      setSuggestions([]);
    } finally {
      setSuggestionLoading(false);
    }
  };

  const handleInputChange = (event) => {
    const value = event.target.value;

    setQuery(value);

    if (value.trim().length >= 4) {
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
      setSuggestions([]);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    runSearch(query, 1, false);
  };

  const handleSuggestionClick = (movie) => {
    const selectedTitle = movie.title || movie.original_title || "";

    if (!selectedTitle) {
      return;
    }

    setShowSuggestions(false);
    setSuggestions([]);
    setQuery(selectedTitle);
    runSearch(selectedTitle, 1, false);
  };

  const handleLoadMore = () => {
    const nextPage = page + 1;

    setShowSuggestions(false);
    setSuggestions([]);

    if (currentMode === "trending" || currentMode === "top-rated") {
      loadSectionMovies(currentMode, nextPage, true);
      return;
    }

    runSearch(query, nextPage, true);
  };

  const clearSearch = () => {
    setQuery("");
    setMovies([]);
    setSuggestions([]);
    setShowSuggestions(false);
    setSearchTitle("Search ChalChitra");
    setSearchParams({});
    setPage(1);
    setCurrentMode("search");
  };

  useEffect(() => {
    if (!showSuggestions) {
      return;
    }

    if (query.trim().length < 4) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(() => {
      fetchSuggestions(query);
    }, 1000);

    return () => clearTimeout(timer);
  }, [query, showSuggestions]);

  useEffect(() => {
    if (initialQuery) {
      runSearch(initialQuery, 1, false);
      return;
    }

    if (section) {
      loadSectionMovies(section, 1, false);
    }
  }, []);

  return (
    <section className="mx-auto min-h-screen max-w-7xl px-4 py-12 md:px-8">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="mb-10"
      >
        <p className="text-sm font-semibold uppercase tracking-[0.35em] text-cinemaGold">
          Discover
        </p>

        <h1 className="mt-3 font-display text-4xl font-bold text-white md:text-6xl">
          Search films across the world.
        </h1>

        <p className="mt-4 max-w-2xl text-cinemaMuted">
          Start typing and ChalChitra will suggest movies instantly. Open a movie
          to expand the catalog and improve recommendations.
        </p>
      </motion.div>

      <div className="relative mb-10">
        <form
          onSubmit={handleSubmit}
          className="glass-panel flex flex-col gap-3 rounded-3xl p-3 md:flex-row"
        >
          <div className="flex flex-1 items-center gap-3 rounded-2xl bg-black/30 px-4 py-3">
            <SearchIcon size={20} className="text-cinemaGold" />

            <input
              value={query}
              onChange={handleInputChange}
              onFocus={() => {
                if (query.trim().length >= 4 && movies.length === 0) {
                  setShowSuggestions(true);
                }
              }}
              placeholder="Try The Shining, Parasite, Aamis, La La Land..."
              className="w-full bg-transparent text-white outline-none placeholder:text-cinemaDim"
            />

            {query && (
              <button
                type="button"
                onClick={clearSearch}
                className="text-cinemaDim transition hover:text-white"
              >
                <X size={18} />
              </button>
            )}
          </div>

          <button
            type="submit"
            className="rounded-2xl bg-cinemaGold px-6 py-3 font-bold text-black transition hover:bg-cinemaGoldSoft"
          >
            Search
          </button>
        </form>

        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute left-0 right-0 top-full z-30 mt-3 overflow-hidden rounded-3xl border border-cinemaBorder bg-cinemaPanel/95 shadow-cardGlow backdrop-blur-xl">
            {suggestions.map((movie) => (
              <button
                key={`${movie.tmdb_id}-${movie.title}-suggestion`}
                type="button"
                onMouseDown={(event) => {
                  event.preventDefault();
                  handleSuggestionClick(movie);
                }}
                className="flex w-full items-center gap-4 border-b border-cinemaBorder px-4 py-3 text-left transition last:border-b-0 hover:bg-white/5"
              >
                <div className="h-16 w-11 overflow-hidden rounded-lg bg-black">
                  {movie.poster_url ? (
                    <img
                      src={movie.poster_url}
                      alt={movie.title || "Movie poster"}
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-cover"
                    />
                  ) : null}
                </div>

                <div>
                  <p className="font-semibold text-white">
                    {movie.title || movie.original_title}
                  </p>

                  <p className="text-sm text-cinemaMuted">
                    {movie.release_date?.slice(0, 4) || "N/A"} •{" "}
                    {movie.language || "na"} •{" "}
                    {typeof movie.rating === "number"
                      ? movie.rating.toFixed(1)
                      : "N/A"}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}

        {showSuggestions && suggestionLoading && (
          <p className="mt-2 text-sm text-cinemaDim">
            Finding suggestions...
          </p>
        )}
      </div>

      {loading && (
        <div className="py-16">
          <LoadingSpinner />
        </div>
      )}

      {error && (
        <div className="mb-8">
          <ErrorMessage message={error} />
        </div>
      )}

      {!loading && !error && (
        <>
          <div className="mb-5 flex items-end justify-between">
            <div>
              <h2 className="font-display text-3xl font-bold text-white">
                {searchTitle}
              </h2>

              <p className="mt-1 text-sm text-cinemaMuted">
                {movies.length} movie{movies.length === 1 ? "" : "s"} loaded
              </p>
            </div>
          </div>

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

              <div className="mt-10 flex justify-center">
                <button
                  type="button"
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="rounded-full border border-cinemaGold/40 px-6 py-3 font-bold text-cinemaGold transition hover:bg-cinemaGold hover:text-black disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loadingMore ? "Loading..." : "Load More"}
                </button>
              </div>
            </>
          ) : (
            <div className="glass-panel rounded-3xl p-8 text-center text-cinemaMuted">
              Search for a movie to begin discovery.
            </div>
          )}
        </>
      )}
    </section>
  );
};

export default Search;