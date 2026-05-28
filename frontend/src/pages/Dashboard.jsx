import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Sparkles,
  Star,
  Film,
  Users,
  Bookmark,
  MessageSquare,
  RefreshCcw
} from "lucide-react";

import { useAuth } from "../context/AuthContext";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import ErrorMessage from "../components/ui/ErrorMessage";
import MovieRow from "../components/movie/MovieRow";
import TasteStatCard from "../components/dashboard/TasteStatCard";
import TasteListCard from "../components/dashboard/TasteListCard";
import { getMyAnalytics } from "../api/userApi";
import {
  getActorRecommendations,
  getDirectorRecommendations,
  getPersonalizedHiddenGems,
  getPersonalizedRecommendations
} from "../api/recommendationApi";
import {
  formatAverageRating,
  formatNumber,
  getAnalyticsArray,
  getAnalyticsValue,
  getTasteSummary
} from "../utils/analyticsHelpers";

const normalizeMovies = (data) => {
  if (!data) return [];

  let movieList = [];

  if (Array.isArray(data)) {
    movieList = data;
  } else {
    movieList =
      data.results ||
      data.recommendations ||
      data.hidden_gems ||
      data.movies ||
      [];
  }

  return movieList
    .map((item) => {
      if (!item) return null;

      if (item.tmdb_id && item.title) {
        return item;
      }

      if (item.movie) {
        return {
          ...item.movie,
          recommendation_score:
            item.score ||
            item.similarity_score ||
            item.final_score ||
            item.recommendation_score ||
            null,
          score_breakdown: item.score_breakdown || null,
          reason: item.reason || item.explanation || null
        };
      }

      if (item.recommended_movie) {
        return {
          ...item.recommended_movie,
          recommendation_score:
            item.score ||
            item.similarity_score ||
            item.final_score ||
            null,
          score_breakdown: item.score_breakdown || null
        };
      }

      return null;
    })
    .filter(Boolean);
};

const Dashboard = () => {
  const { user } = useAuth();

  const [analytics, setAnalytics] = useState(null);
  const [personalizedMovies, setPersonalizedMovies] = useState([]);
  const [hiddenGems, setHiddenGems] = useState([]);
  const [directorMovies, setDirectorMovies] = useState([]);
  const [actorMovies, setActorMovies] = useState([]);

  const [loading, setLoading] = useState(true);
  const [recommendationLoading, setRecommendationLoading] = useState(false);
  const [error, setError] = useState("");

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setRecommendationLoading(true);
      setError("");

      const [
        analyticsResult,
        personalizedResult,
        hiddenGemResult,
        directorResult,
        actorResult
      ] = await Promise.allSettled([
        getMyAnalytics(),
        getPersonalizedRecommendations(12),
        getPersonalizedHiddenGems(12),
        getDirectorRecommendations(12),
        getActorRecommendations(12)
      ]);

      if (analyticsResult.status === "fulfilled") {
        setAnalytics(analyticsResult.value);
        console.log("ChalChitra analytics response:", analyticsResult.value);
      }

     let normalPersonalized = [];
let normalHiddenGems = [];

if (personalizedResult.status === "fulfilled") {
  normalPersonalized = normalizeMovies(personalizedResult.value);
}

if (hiddenGemResult.status === "fulfilled") {
  normalHiddenGems = normalizeMovies(hiddenGemResult.value);
}

const personalizedIds = new Set(
  normalPersonalized.map((movie) => movie.tmdb_id)
);

const uniquePersonalHiddenGems = normalHiddenGems.filter(
  (movie) => !personalizedIds.has(movie.tmdb_id)
);

setPersonalizedMovies(normalPersonalized);
setHiddenGems(
  uniquePersonalHiddenGems.length > 0
    ? uniquePersonalHiddenGems
    : normalHiddenGems
);

      if (directorResult.status === "fulfilled") {
        setDirectorMovies(normalizeMovies(directorResult.value));
      }

      if (actorResult.status === "fulfilled") {
        setActorMovies(normalizeMovies(actorResult.value));
      }

      const allFailed =
        analyticsResult.status === "rejected" &&
        personalizedResult.status === "rejected" &&
        hiddenGemResult.status === "rejected" &&
        directorResult.status === "rejected" &&
        actorResult.status === "rejected";

      if (allFailed) {
        setError("Could not load dashboard data. Make sure backend is running.");
      }
    } catch (err) {
      setError("Could not load dashboard data.");
    } finally {
      setLoading(false);
      setRecommendationLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const favoriteGenres = getAnalyticsArray(analytics, [
    "favorite_genres",
    "top_genres",
    "genres",
    "genre_preferences",
    "genre_scores"
  ]);

  const favoriteLanguages = getAnalyticsArray(analytics, [
    "favorite_languages",
    "top_languages",
    "languages",
    "language_preferences",
    "language_scores"
  ]);

  const favoriteDirectors = getAnalyticsArray(analytics, [
    "favorite_directors",
    "top_directors",
    "directors",
    "director_preferences",
    "director_scores"
  ]);

  const favoriteActors = getAnalyticsArray(analytics, [
    "favorite_actors",
    "top_actors",
    "actors",
    "actor_preferences",
    "actor_scores"
  ]);

  const averageRatingRaw = getAnalyticsValue(
    analytics,
    [
      "average_rating",
      "avg_rating",
      "user_average_rating",
      "average_user_rating",
      "ratings_average",
      "avg_user_rating"
    ],
    null
  );

  const totalRatingsRaw = getAnalyticsValue(
    analytics,
    [
      "total_ratings",
      "ratings_count",
      "rating_count",
      "ratings",
      "total_user_ratings",
      "user_ratings_count"
    ],
    0
  );

  const totalReviewsRaw = getAnalyticsValue(
    analytics,
    [
      "total_reviews",
      "reviews_count",
      "review_count",
      "reviews",
      "total_user_reviews",
      "user_reviews_count"
    ],
    0
  );

  const totalWatchlistRaw = getAnalyticsValue(
    analytics,
    [
      "total_watchlist",
      "watchlist_count",
      "saved_movies",
      "watchlist",
      "watchlist_total",
      "total_saved_movies",
      "user_watchlist_count"
    ],
    0
  );

  const averageRating = formatAverageRating(averageRatingRaw);
  const totalRatings = formatNumber(totalRatingsRaw, 0);
  const totalReviews = formatNumber(totalReviewsRaw, 0);
  const totalWatchlist = formatNumber(totalWatchlistRaw, 0);
  const tasteSummary = getTasteSummary(analytics);

  return (
    <section className="mx-auto min-h-screen max-w-7xl px-4 py-12 md:px-8">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="mb-10"
      >
        <p className="text-sm font-semibold uppercase tracking-[0.35em] text-cinemaGold">
          Personal Cinema Intelligence
        </p>

        <div className="mt-3 flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <h1 className="font-display text-4xl font-bold text-white md:text-6xl">
              Your Dashboard
            </h1>

            <p className="mt-4 max-w-2xl text-cinemaMuted">
              Welcome back{user?.name ? `, ${user.name}` : ""}. Your recommendations
              improve as you rate, save, review, and follow creators.
            </p>
          </div>

          <button
            type="button"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              loadDashboard();
            }}
            className="flex w-fit items-center gap-2 rounded-full border border-cinemaBorder px-5 py-3 text-sm font-bold text-cinemaMuted transition hover:border-cinemaGold/50 hover:text-cinemaGold"
          >
            <RefreshCcw size={17} />
            Refresh
          </button>
        </div>
      </motion.div>

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
          <div className="mb-8 grid gap-5 md:grid-cols-4">
            <TasteStatCard
              title="Avg Rating"
              value={averageRating}
              description="Your rating behavior"
              icon={Star}
            />

            <TasteStatCard
              title="Ratings"
              value={totalRatings}
              description="Movies rated"
              icon={Film}
            />

            <TasteStatCard
              title="Watchlist"
              value={totalWatchlist}
              description="Saved movies"
              icon={Bookmark}
            />

            <TasteStatCard
              title="Reviews"
              value={totalReviews}
              description="Written opinions"
              icon={MessageSquare}
            />
          </div>

          <div className="glass-panel mb-10 rounded-3xl p-6">
            <div className="flex items-start gap-4">
              <div className="rounded-2xl border border-cinemaGold/20 bg-cinemaGold/10 p-3 text-cinemaGold">
                <Sparkles size={24} />
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-[0.25em] text-cinemaGold">
                  Taste Summary
                </p>

                <h2 className="mt-3 font-display text-3xl font-bold text-white">
                  Your evolving cinema profile
                </h2>

                <p className="mt-3 max-w-3xl leading-7 text-cinemaMuted">
                  {tasteSummary}
                </p>
              </div>
            </div>
          </div>

          <div className="mb-12 grid gap-5 lg:grid-cols-2">
            <TasteListCard
              title="Favorite Genres"
              subtitle="Genres detected from ratings and watchlist activity."
              items={favoriteGenres}
              emptyText="No genre profile yet. Rate or save more films."
            />

            <TasteListCard
              title="Favorite Languages"
              subtitle="Languages appearing in your watched/saved taste profile."
              items={favoriteLanguages}
              emptyText="No language profile yet."
            />

            <TasteListCard
              title="Favorite Directors"
              subtitle="Director preference based on interactions and follows."
              items={favoriteDirectors}
              emptyText="No director profile yet. Follow directors or rate their films."
            />

            <TasteListCard
              title="Favorite Actors"
              subtitle="Actor preference based on interactions and follows."
              items={favoriteActors}
              emptyText="No actor profile yet. Follow actors or rate their films."
            />
          </div>

          {recommendationLoading && (
            <div className="py-10">
              <LoadingSpinner />
            </div>
          )}

          {!recommendationLoading && (
            <>
              <MovieRow
                title="Recommended For You"
                subtitle="Built from your ratings, watchlist, follows, and taste profile."
                movies={personalizedMovies}
                onViewMore={null}
              />

              <MovieRow
                title="Personal Hidden Gems"
                subtitle="Less obvious films that fit your taste profile."
                movies={hiddenGems}
                onViewMore={null}
              />

              <MovieRow
                title="Because of Directors You Follow"
                subtitle="Movies linked to your followed directors."
                movies={directorMovies}
                onViewMore={null}
              />

              <MovieRow
                title="Because of Actors You Follow"
                subtitle="Movies linked to your followed actors."
                movies={actorMovies}
                onViewMore={null}
              />
            </>
          )}

          {personalizedMovies.length === 0 &&
            hiddenGems.length === 0 &&
            directorMovies.length === 0 &&
            actorMovies.length === 0 && (
              <div className="glass-panel mt-8 rounded-3xl p-10 text-center">
                <Users size={34} className="mx-auto text-cinemaGold" />

                <h2 className="mt-4 font-display text-3xl font-bold text-white">
                  Your recommendations need more taste data
                </h2>

                <p className="mx-auto mt-3 max-w-xl text-cinemaMuted">
                  Add movies to your watchlist, rate films, review movies, or follow
                  directors and actors. The dashboard will become stronger as your
                  profile grows.
                </p>
              </div>
            )}
        </>
      )}
    </section>
  );
};

export default Dashboard;