import { motion } from "framer-motion";
import { Star, Globe2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

const MovieCard = ({ movie }) => {
  const navigate = useNavigate();

  if (!movie) {
    return null;
  }

  const year = movie.release_date
    ? movie.release_date.slice(0, 4)
    : "N/A";

  return (
    <motion.div
      whileHover={{ y: -8, scale: 1.02 }}
      transition={{ duration: 0.25 }}
      onClick={() => navigate(`/movie/${movie.tmdb_id}`)}
      className="group min-w-[160px] max-w-[160px] cursor-pointer overflow-hidden rounded-2xl border border-cinemaBorder bg-cinemaCard shadow-cardGlow transition hover:border-cinemaGold/50"
    >
      <div className="relative aspect-[2/3] overflow-hidden bg-cinemaPanel">
        {movie.poster_url ? (
          <img
            src={movie.poster_url}
            alt={movie.title}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center px-3 text-center text-sm text-cinemaDim">
            No Poster
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent opacity-70" />

        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-xs">
          <span className="flex items-center gap-1 rounded-full bg-black/60 px-2 py-1 text-cinemaGold backdrop-blur">
            <Star size={12} fill="currentColor" />
            {movie.rating ? movie.rating.toFixed(1) : "N/A"}
          </span>

          <span className="flex items-center gap-1 rounded-full bg-black/60 px-2 py-1 text-cinemaMuted backdrop-blur">
            <Globe2 size={12} />
            {movie.language || "na"}
          </span>
        </div>
      </div>

      <div className="space-y-1 p-3">
        <h3 className="line-clamp-2 text-sm font-bold text-white">
          {movie.title}
        </h3>
        <p className="text-xs text-cinemaDim">{year}</p>
      </div>
    </motion.div>
  );
};

export default MovieCard;