import { motion } from "framer-motion";
import { Film, Globe2, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";

const getYear = (movie) => {
  if (!movie?.release_date) {
    return "N/A";
  }

  return movie.release_date.slice(0, 4);
};

const getRating = (movie) => {
  const ratingValue =
    movie?.rating ??
    movie?.vote_average ??
    movie?.average_rating ??
    null;

  if (typeof ratingValue === "number") {
    if (ratingValue <= 0) {
      return "N/A";
    }

    return ratingValue.toFixed(1);
  }

  const parsedRating = Number(ratingValue);

  if (!Number.isNaN(parsedRating) && parsedRating > 0) {
    return parsedRating.toFixed(1);
  }

  return "N/A";
};

const getLanguage = (movie) => {
  return movie?.language || movie?.original_language || "na";
};

const getTitle = (movie) => {
  return movie?.title || movie?.original_title || "Untitled Movie";
};

const MovieCard = ({ movie, compact = false }) => {
  const navigate = useNavigate();

  if (!movie) {
    return null;
  }

  const title = getTitle(movie);
  const year = getYear(movie);
  const rating = getRating(movie);
  const language = getLanguage(movie);

  const handleOpenMovie = () => {
    if (!movie.tmdb_id) {
      return;
    }

    navigate(`/movie/${movie.tmdb_id}`);
  };

  return (
    <motion.article
      whileHover={{ y: -6 }}
      transition={{ duration: 0.22 }}
      onClick={handleOpenMovie}
      className={`group cursor-pointer overflow-hidden rounded-2xl border border-cinemaBorder bg-cinemaCard shadow-cardGlow transition duration-300 hover:border-cinemaGold/50 hover:shadow-cinemaGlow ${
        compact ? "min-w-[160px] max-w-[160px] sm:min-w-[170px] sm:max-w-[170px]" : "w-full"
      }`}
    >
      <div className="relative aspect-[2/3] overflow-hidden bg-cinemaPanel">
        {movie.poster_url ? (
          <img
            src={movie.poster_url}
            alt={title}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-gradient-to-br from-cinemaPanel to-black px-4 text-center">
            <div className="rounded-2xl border border-cinemaGold/20 bg-cinemaGold/10 p-3 text-cinemaGold">
              <Film size={24} />
            </div>

            <p className="text-xs font-semibold text-cinemaDim">
              Poster unavailable
            </p>
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent opacity-80" />

        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between gap-2 text-xs">
          <span className="flex items-center gap-1 rounded-full bg-black/65 px-2 py-1 font-semibold text-cinemaGold backdrop-blur">
            <Star size={12} fill={rating !== "N/A" ? "currentColor" : "none"} />
            {rating}
          </span>

          <span className="flex items-center gap-1 rounded-full bg-black/65 px-2 py-1 text-cinemaMuted backdrop-blur">
            <Globe2 size={12} />
            {language}
          </span>
        </div>
      </div>

      <div className="space-y-1 p-3">
        <h3 className="line-clamp-2 min-h-[40px] text-sm font-bold leading-5 text-white transition group-hover:text-cinemaGold">
          {title}
        </h3>

        <p className="text-xs text-cinemaDim">{year}</p>
      </div>
    </motion.article>
  );
};

export default MovieCard;