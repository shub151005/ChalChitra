import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";
import { getMyRatings, rateMovie } from "../../api/userApi";

const normalizeRatings = (data) => {
  if (!data) return [];

  if (Array.isArray(data)) {
    return data;
  }

  return data.results || data.ratings || data.user_ratings || [];
};

const getRatingMovieId = (ratingItem) => {
  return (
    ratingItem?.tmdb_id ||
    ratingItem?.movie?.tmdb_id ||
    ratingItem?.movie_id ||
    null
  );
};

const getRatingValue = (ratingItem) => {
  return (
    ratingItem?.rating ||
    ratingItem?.score ||
    ratingItem?.value ||
    ratingItem?.user_rating ||
    null
  );
};

const RatingBox = ({ movie }) => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [selectedRating, setSelectedRating] = useState(null);
  const [hoverRating, setHoverRating] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const loadExistingRating = async () => {
    if (!isAuthenticated || !movie?.tmdb_id) {
      setSelectedRating(null);
      return;
    }

    try {
      const data = await getMyRatings();
      const ratings = normalizeRatings(data);

      const existingRating = ratings.find(
        (ratingItem) =>
          Number(getRatingMovieId(ratingItem)) === Number(movie.tmdb_id)
      );

      if (existingRating) {
        const ratingValue = getRatingValue(existingRating);

        if (ratingValue) {
          setSelectedRating(Number(ratingValue));
        }
      } else {
        setSelectedRating(null);
      }
    } catch (err) {
      setSelectedRating(null);
    }
  };

  const handleRate = async (event, ratingValue) => {
    event.preventDefault();
    event.stopPropagation();

    if (!isAuthenticated) {
      navigate("/login", {
        state: {
          from: {
            pathname: `/movie/${movie.tmdb_id}`
          }
        }
      });
      return;
    }

    try {
      setSaving(true);
      setMessage("");

      await rateMovie({
        tmdb_id: movie.tmdb_id,
        rating: ratingValue
      });

      setSelectedRating(ratingValue);
      setMessage(`You rated this movie ${ratingValue}/10`);

      setTimeout(() => {
        setMessage("");
      }, 2500);
    } catch (err) {
      setMessage(
        err?.response?.data?.detail ||
          "Could not save rating."
      );
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    loadExistingRating();
  }, [movie?.tmdb_id, isAuthenticated]);

  if (!movie?.tmdb_id) {
    return null;
  }

  const displayRating = hoverRating || selectedRating;

  return (
    <div className="glass-panel rounded-3xl p-5">
      <div className="mb-4">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-cinemaGold">
          Your Rating
        </p>

        <h3 className="mt-2 font-display text-2xl font-bold text-white">
          Rate this film
        </h3>

        <p className="mt-1 text-sm text-cinemaMuted">
          Your rating improves personalized recommendations.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 10 }, (_, index) => index + 1).map((ratingValue) => (
          <button
            key={ratingValue}
            type="button"
            disabled={saving}
            onMouseEnter={() => setHoverRating(ratingValue)}
            onMouseLeave={() => setHoverRating(null)}
            onClick={(event) => handleRate(event, ratingValue)}
            className={`flex h-10 w-10 items-center justify-center rounded-full border text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-60 ${
              displayRating >= ratingValue
                ? "border-cinemaGold bg-cinemaGold text-black"
                : "border-cinemaBorder bg-black/30 text-cinemaMuted hover:border-cinemaGold/60 hover:text-cinemaGold"
            }`}
          >
            {ratingValue}
          </button>
        ))}
      </div>

      <div className="mt-4 flex items-center gap-2 text-sm">
        <Star size={17} className="text-cinemaGold" />

        <span className="text-cinemaMuted">
          {selectedRating
            ? `Your rating: ${selectedRating}/10`
            : "No rating yet"}
        </span>
      </div>

      {message && (
        <p className="mt-3 rounded-2xl border border-white/10 bg-black/30 px-4 py-2 text-sm text-cinemaMuted">
          {message}
        </p>
      )}
    </div>
  );
};

export default RatingBox;