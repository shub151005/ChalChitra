import { useEffect, useState } from "react";
import { Bookmark, Trash2, RefreshCcw } from "lucide-react";
import { motion } from "framer-motion";

import LoadingSpinner from "../components/ui/LoadingSpinner";
import ErrorMessage from "../components/ui/ErrorMessage";
import MovieCard from "../components/movie/MovieCard";
import { getMyWatchlist, removeFromWatchlist } from "../api/userApi";

const statusLabels = {
  watch_later: "Watch Later",
  watching: "Watching",
  completed: "Completed",
  dropped: "Dropped"
};

const statusDescriptions = {
  watch_later: "Movies you plan to watch.",
  watching: "Movies you are currently watching.",
  completed: "Movies you have completed.",
  dropped: "Movies you stopped watching."
};

const Watchlist = () => {
  const [watchlist, setWatchlist] = useState([]);
  const [activeStatus, setActiveStatus] = useState("all");
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState(null);
  const [error, setError] = useState("");

  const loadWatchlist = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getMyWatchlist();

      if (Array.isArray(data)) {
        setWatchlist(data);
      } else {
        setWatchlist(data.results || data.watchlist || []);
      }
    } catch (err) {
      setError(
        err?.response?.data?.detail ||
          "Could not load your watchlist."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (tmdbId) => {
    try {
      setRemovingId(tmdbId);
      await removeFromWatchlist(tmdbId);

      setWatchlist((prev) =>
        prev.filter((item) => {
          const movieId = item.tmdb_id || item.movie?.tmdb_id;
          return movieId !== tmdbId;
        })
      );
    } catch (err) {
      setError("Could not remove this movie from watchlist.");
    } finally {
      setRemovingId(null);
    }
  };

  useEffect(() => {
    loadWatchlist();
  }, []);

  const normalizedItems = watchlist
    .map((item) => {
      const movie = item.movie || item;

      return {
        raw: item,
        movie,
        status: item.status || "watch_later",
        added_at: item.added_at || item.created_at || null
      };
    })
    .filter((item) => item.movie?.tmdb_id);

  const filteredItems =
    activeStatus === "all"
      ? normalizedItems
      : normalizedItems.filter((item) => item.status === activeStatus);

  const totalCount = normalizedItems.length;

  const statusCounts = normalizedItems.reduce(
    (acc, item) => {
      acc[item.status] = (acc[item.status] || 0) + 1;
      return acc;
    },
    {}
  );

  return (
    <section className="mx-auto min-h-screen max-w-7xl px-4 py-12 md:px-8">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="mb-10"
      >
        <p className="text-sm font-semibold uppercase tracking-[0.35em] text-cinemaGold">
          Personal Library
        </p>

        <div className="mt-3 flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <h1 className="font-display text-4xl font-bold text-white md:text-6xl">
              Watchlist
            </h1>

            <p className="mt-4 max-w-2xl text-cinemaMuted">
              Save movies into watch later, watching, completed, or dropped lists.
            </p>
          </div>

          <button
            type="button"
            onClick={loadWatchlist}
            className="flex w-fit items-center gap-2 rounded-full border border-cinemaBorder px-5 py-3 text-sm font-bold text-cinemaMuted transition hover:border-cinemaGold/50 hover:text-cinemaGold"
          >
            <RefreshCcw size={17} />
            Refresh
          </button>
        </div>
      </motion.div>

      <div className="mb-8 grid gap-4 md:grid-cols-5">
        <StatusCard
          label="All"
          count={totalCount}
          active={activeStatus === "all"}
          onClick={() => setActiveStatus("all")}
        />

        {Object.keys(statusLabels).map((status) => (
          <StatusCard
            key={status}
            label={statusLabels[status]}
            count={statusCounts[status] || 0}
            active={activeStatus === status}
            onClick={() => setActiveStatus(status)}
          />
        ))}
      </div>

      {activeStatus !== "all" && (
        <p className="mb-6 text-sm text-cinemaMuted">
          {statusDescriptions[activeStatus]}
        </p>
      )}

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

      {!loading && !error && filteredItems.length === 0 && (
        <div className="glass-panel rounded-3xl p-10 text-center">
          <Bookmark size={34} className="mx-auto text-cinemaGold" />
          <h2 className="mt-4 font-display text-3xl font-bold text-white">
            No movies here yet
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-cinemaMuted">
            Open a movie detail page and add it to your watchlist.
          </p>
        </div>
      )}

      {!loading && !error && filteredItems.length > 0 && (
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {filteredItems.map((item) => {
            const tmdbId = item.movie.tmdb_id;

            return (
              <div key={`${tmdbId}-${item.status}`} className="relative">
                <MovieCard movie={item.movie} />

                <div className="mt-3 flex items-center justify-between gap-2">
                  <span className="rounded-full border border-cinemaGold/30 bg-cinemaGold/10 px-3 py-1 text-xs font-semibold text-cinemaGold">
                    {statusLabels[item.status] || item.status}
                  </span>

                  <button
                    type="button"
                    onClick={() => handleRemove(tmdbId)}
                    disabled={removingId === tmdbId}
                    className="rounded-full border border-red-500/30 bg-red-500/10 p-2 text-red-300 transition hover:bg-red-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};

const StatusCard = ({ label, count, active, onClick }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-3xl border p-5 text-left transition ${
        active
          ? "border-cinemaGold bg-cinemaGold/10 shadow-cinemaGlow"
          : "border-cinemaBorder bg-cinemaCard hover:border-cinemaGold/40"
      }`}
    >
      <p className="text-sm font-semibold text-cinemaMuted">
        {label}
      </p>

      <h3 className="mt-2 font-display text-3xl font-bold text-white">
        {count}
      </h3>
    </button>
  );
};

export default Watchlist;