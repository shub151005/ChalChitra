import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";

import MovieCard from "./MovieCard";

const MovieRow = ({
  title,
  subtitle,
  movies = [],
  onViewMore,
  limit = null,
  showCount = false
}) => {
  if (!movies || movies.length === 0) {
    return null;
  }

  const visibleMovies = limit ? movies.slice(0, limit) : movies;

  return (
    <section className="py-10">
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-3xl">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.35 }}
            className="mb-2 text-xs font-bold uppercase tracking-[0.25em] text-cinemaGold"
          >
            ChalChitra Discovery
          </motion.p>

          <motion.h2
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45 }}
            className="font-display text-2xl font-bold text-white md:text-3xl"
          >
            {title}
          </motion.h2>

          {subtitle && (
            <p className="mt-2 max-w-2xl text-sm leading-6 text-cinemaMuted">
              {subtitle}
            </p>
          )}

          {showCount && (
            <p className="mt-2 text-xs text-cinemaDim">
              Showing {visibleMovies.length} movie
              {visibleMovies.length === 1 ? "" : "s"}
            </p>
          )}
        </div>

        {onViewMore && (
          <button
            type="button"
            onClick={onViewMore}
            className="flex w-fit items-center gap-1 rounded-full border border-cinemaGold/30 bg-cinemaGold/5 px-4 py-2 text-sm font-semibold text-cinemaGold transition hover:bg-cinemaGold hover:text-black"
          >
            View More
            <ChevronRight size={16} />
          </button>
        )}
      </div>

      <div className="-mx-1 flex gap-4 overflow-x-auto px-1 pb-5 scrollbar-thin">
        {visibleMovies.map((movie) => (
          <MovieCard
            key={`${movie.tmdb_id}-${movie.title}`}
            movie={movie}
            compact
          />
        ))}
      </div>
    </section>
  );
};

export default MovieRow;