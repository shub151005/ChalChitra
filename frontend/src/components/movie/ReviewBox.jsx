import { useEffect, useState } from "react";
import { MessageSquare, Send, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";
import {
  createOrUpdateReview,
  deleteReview,
  getMyReviews,
  getMovieReviews
} from "../../api/userApi";

const getReviewText = (review) => {
  return (
    review?.review_text ||
    review?.content ||
    review?.text ||
    review?.review ||
    ""
  );
};

const getReviewRating = (review) => {
  return (
    review?.rating ||
    review?.score ||
    review?.user_rating ||
    null
  );
};

const getReviewMovieId = (review) => {
  return review?.tmdb_id || review?.movie?.tmdb_id || review?.movie_id || null;
};

const ReviewBox = ({ movie }) => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  const [reviewText, setReviewText] = useState("");
  const [reviewRating, setReviewRating] = useState("");
  const [reviews, setReviews] = useState([]);
  const [myExistingReview, setMyExistingReview] = useState(null);

  const [loadingReviews, setLoadingReviews] = useState(false);
  const [savingReview, setSavingReview] = useState(false);
  const [deletingReview, setDeletingReview] = useState(false);
  const [message, setMessage] = useState("");

  const normalizeReviews = (data) => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    return data.results || data.reviews || [];
  };

  const loadMovieReviews = async () => {
    if (!movie?.tmdb_id) {
      return;
    }

    try {
      setLoadingReviews(true);

      const data = await getMovieReviews(movie.tmdb_id);
      setReviews(normalizeReviews(data));
    } catch (err) {
      setReviews([]);
    } finally {
      setLoadingReviews(false);
    }
  };

  const loadMyReview = async () => {
    if (!isAuthenticated || !movie?.tmdb_id) {
      setMyExistingReview(null);
      return;
    }

    try {
      const data = await getMyReviews();
      const myReviews = normalizeReviews(data);

      const existing = myReviews.find(
        (review) => Number(getReviewMovieId(review)) === Number(movie.tmdb_id)
      );

      if (existing) {
        setMyExistingReview(existing);
        setReviewText(getReviewText(existing));

        const existingRating = getReviewRating(existing);

        if (existingRating) {
          setReviewRating(String(existingRating));
        }
      } else {
        setMyExistingReview(null);
        setReviewText("");
        setReviewRating("");
      }
    } catch (err) {
      setMyExistingReview(null);
    }
  };

  const handleSubmitReview = async (event) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

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

    if (!reviewText.trim()) {
      setMessage("Please write a review before submitting.");
      return;
    }

    try {
      setSavingReview(true);
      setMessage("");

      const payload = {
        tmdb_id: movie.tmdb_id,
        review_text: reviewText.trim()
      };

      if (reviewRating) {
        payload.rating = Number(reviewRating);
      }

      await createOrUpdateReview(payload);

      setMessage("Review saved successfully.");

      await loadMovieReviews();
      await loadMyReview();

      setTimeout(() => {
        setMessage("");
      }, 2500);
    } catch (err) {
      setMessage(
        err?.response?.data?.detail ||
          "Could not save review."
      );
    } finally {
      setSavingReview(false);
    }
  };

  const handleDeleteReview = async (event) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    if (!isAuthenticated || !movie?.tmdb_id) {
      return;
    }

    try {
      setDeletingReview(true);
      setMessage("");

      await deleteReview(movie.tmdb_id);

      setReviewText("");
      setReviewRating("");
      setMyExistingReview(null);
      setMessage("Review deleted.");

      await loadMovieReviews();

      setTimeout(() => {
        setMessage("");
      }, 2500);
    } catch (err) {
      setMessage("Could not delete review.");
    } finally {
      setDeletingReview(false);
    }
  };

  useEffect(() => {
    loadMovieReviews();
    loadMyReview();
  }, [movie?.tmdb_id, isAuthenticated]);

  if (!movie?.tmdb_id) {
    return null;
  }

  return (
    <section className="py-10">
      <div className="mb-5">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-cinemaGold">
          Community Response
        </p>

        <h2 className="mt-2 font-display text-3xl font-bold text-white">
          Ratings & Reviews
        </h2>

        <p className="mt-1 text-sm text-cinemaMuted">
          Write your opinion and see what others think.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
        <div className="glass-panel rounded-3xl p-5">
          <div className="mb-4 flex items-start gap-3">
            <div className="rounded-2xl border border-cinemaGold/20 bg-cinemaGold/10 p-3 text-cinemaGold">
              <MessageSquare size={22} />
            </div>

            <div>
              <h3 className="font-display text-2xl font-bold text-white">
                {myExistingReview ? "Update your review" : "Write a review"}
              </h3>

              <p className="mt-1 text-sm text-cinemaMuted">
                Your review will also help your taste profile.
              </p>
            </div>
          </div>

          <label className="mb-2 block text-sm text-cinemaMuted">
            Optional rating with review
          </label>

          <select
            value={reviewRating}
            onChange={(event) => setReviewRating(event.target.value)}
            className="mb-4 w-full rounded-2xl border border-cinemaBorder bg-black/40 px-4 py-3 text-white outline-none"
          >
            <option value="">No rating</option>
            {Array.from({ length: 10 }, (_, index) => index + 1).map((rating) => (
              <option key={rating} value={rating}>
                {rating}/10
              </option>
            ))}
          </select>

          <label className="mb-2 block text-sm text-cinemaMuted">
            Review
          </label>

          <textarea
            value={reviewText}
            onChange={(event) => setReviewText(event.target.value)}
            rows={7}
            placeholder="Write what you felt about this film..."
            className="w-full resize-none rounded-2xl border border-cinemaBorder bg-black/40 px-4 py-3 text-white outline-none placeholder:text-cinemaDim focus:border-cinemaGold/50"
          />

          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleSubmitReview}
              disabled={savingReview}
              className="flex items-center gap-2 rounded-full bg-cinemaGold px-6 py-3 font-bold text-black transition hover:bg-cinemaGoldSoft disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Send size={17} />
              {savingReview ? "Saving..." : "Save Review"}
            </button>

            {myExistingReview && (
              <button
                type="button"
                onClick={handleDeleteReview}
                disabled={deletingReview}
                className="flex items-center gap-2 rounded-full border border-red-500/30 bg-red-500/10 px-5 py-3 font-bold text-red-300 transition hover:bg-red-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Trash2 size={17} />
                {deletingReview ? "Deleting..." : "Delete"}
              </button>
            )}
          </div>

          {message && (
            <p className="mt-4 rounded-2xl border border-white/10 bg-black/30 px-4 py-2 text-sm text-cinemaMuted">
              {message}
            </p>
          )}
        </div>

        <div className="glass-panel rounded-3xl p-5">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h3 className="font-display text-2xl font-bold text-white">
                Movie Reviews
              </h3>

              <p className="mt-1 text-sm text-cinemaMuted">
                {reviews.length} review{reviews.length === 1 ? "" : "s"} found
              </p>
            </div>
          </div>

          {loadingReviews ? (
            <div className="py-10 text-center text-cinemaMuted">
              Loading reviews...
            </div>
          ) : reviews.length > 0 ? (
            <div className="space-y-4">
              {reviews.map((review, index) => {
                const text = getReviewText(review);
                const rating = getReviewRating(review);

                const reviewerName =
                  review?.user?.name ||
                  review?.user_name ||
                  review?.name ||
                  (user?.id && review?.user_id === user.id
                    ? user.name
                    : "ChalChitra User");

                return (
                  <div
                    key={`${reviewerName}-${index}`}
                    className="rounded-2xl border border-cinemaBorder bg-black/20 p-4"
                  >
                    <div className="mb-3 flex items-center justify-between gap-4">
                      <p className="font-semibold text-white">
                        {reviewerName}
                      </p>

                      {rating && (
                        <span className="rounded-full bg-cinemaGold/10 px-3 py-1 text-xs font-bold text-cinemaGold">
                          {rating}/10
                        </span>
                      )}
                    </div>

                    <p className="leading-7 text-cinemaMuted">
                      {text || "No review text."}
                    </p>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-2xl border border-cinemaBorder bg-black/20 p-8 text-center text-cinemaMuted">
              No reviews yet. Be the first to write one.
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default ReviewBox;