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

const getAnalyticsArray = (analytics, keys) => {
  for (const key of keys) {
    if (Array.isArray(analytics?.[key])) {
      return analytics[key];
    }
  }

  return [];
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
      }

      if (personalizedResult.status === "fulfilled") {
        setPersonalizedMovies(normalizeMovies(personalizedResult.value));
      }

      if (hiddenGemResult.status === "fulfilled") {
        setHiddenGems(normalizeMovies(hiddenGemResult.value));
      }

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
    "genres"
  ]);

  const favoriteLanguages = getAnalyticsArray(analytics, [
    "favorite_languages",
    "top_languages",
    "languages"
  ]);

  const favoriteDirectors = getAnalyticsArray(analytics, [
    "favorite_directors",
    "top_directors",
    "directors"
  ]);

  const favoriteActors = getAnalyticsArray(analytics, [
    "favorite_actors",
    "top_actors",
    "actors"
  ]);

  const totalRatings =
    analytics?.total_ratings ||
    analytics?.ratings_count ||
    analytics?.rating_count ||
    0;

  const totalReviews =
    analytics?.total_reviews ||
    analytics?.reviews_count ||
    analytics?.review_count ||
    0;

  const totalWatchlist =
    analytics?.total_watchlist ||
    analytics?.watchlist_count ||
    analytics?.saved_movies ||
    0;

  const averageRating =
    typeof analytics?.average_rating === "number"
      ? analytics.average_rating.toFixed(1)
      : analytics?.average_rating || "N/A";

  const tasteSummary =
    analytics?.taste_summary ||
    "Rate movies, save watchlist items, and follow creators to build a richer taste profile.";

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
            onClick={loadDashboard}
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