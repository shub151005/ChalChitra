import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import MovieCard from "./MovieCard";

const MovieRow = ({ title, subtitle, movies = [], onViewMore }) => {
  if (!movies || movies.length === 0) {
    return null;
  }

  return (
    <section className="py-8">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
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
            <p className="mt-1 text-sm text-cinemaMuted">
              {subtitle}
            </p>
          )}
        </div>

        {onViewMore && (
          <button
            onClick={onViewMore}
            className="flex items-center gap-1 rounded-full border border-cinemaBorder px-4 py-2 text-sm text-cinemaMuted transition hover:border-cinemaGold/50 hover:text-cinemaGold"
          >
            View more
            <ChevronRight size={16} />
          </button>
        )}
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {movies.slice(0, 10).map((movie) => (
          <MovieCard
            key={`${movie.tmdb_id}-${movie.title}`}
            movie={movie}
          />
        ))}
      </div>
    </section>
  );
};

export default MovieRow;