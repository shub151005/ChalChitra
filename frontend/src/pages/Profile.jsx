import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  User,
  Mail,
  Sparkles,
  Clapperboard,
  Users,
  Trash2,
  RefreshCcw,
  Star,
  Bookmark,
  MessageSquare,
  Film
} from "lucide-react";

import { useAuth } from "../context/AuthContext";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import ErrorMessage from "../components/ui/ErrorMessage";
import { getMyAnalytics, getMyFollows, unfollowPerson } from "../api/userApi";
import {
  formatAverageRating,
  formatNumber,
  getAnalyticsArray,
  getAnalyticsValue,
  getTasteSummary
} from "../utils/analyticsHelpers";

const getItemName = (item) => {
  if (!item) return "";

  if (typeof item === "string") {
    return item;
  }

  return (
    item.name ||
    item.genre ||
    item.language ||
    item.director ||
    item.actor ||
    item.title ||
    item.person_name ||
    "Unknown"
  );
};

const getItemScore = (item) => {
  if (!item || typeof item === "string") return null;
  return item.score || item.count || item.total || item.value || null;
};

const getFollowPersonId = (follow) => {
  return follow?.person_id || follow?.id || follow?.tmdb_id || null;
};

const getFollowName = (follow) => {
  return (
    follow?.name ||
    follow?.person_name ||
    follow?.director ||
    follow?.actor ||
    "Unknown Creator"
  );
};

const getFollowType = (follow) => {
  return follow?.type || follow?.person_type || follow?.follow_type || "actor";
};

const normalizeFollows = (data) => {
  if (!data) return [];

  if (Array.isArray(data)) {
    return data;
  }

  return data.results || data.follows || data.followed_people || [];
};

const Profile = () => {
  const { user } = useAuth();

  const [analytics, setAnalytics] = useState(null);
  const [follows, setFollows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [removingKey, setRemovingKey] = useState("");
  const [error, setError] = useState("");

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError("");

      const [analyticsResult, followsResult] = await Promise.allSettled([
        getMyAnalytics(),
        getMyFollows()
      ]);

      if (analyticsResult.status === "fulfilled") {
        setAnalytics(analyticsResult.value);
        console.log("ChalChitra profile analytics response:", analyticsResult.value);
      }

      if (followsResult.status === "fulfilled") {
        setFollows(normalizeFollows(followsResult.value));
      }

      if (
        analyticsResult.status === "rejected" &&
        followsResult.status === "rejected"
      ) {
        setError("Could not load profile data.");
      }
    } catch (err) {
      setError("Could not load profile.");
    } finally {
      setLoading(false);
    }
  };

  const handleUnfollow = async (follow) => {
    const personId = getFollowPersonId(follow);
    const type = getFollowType(follow);

    if (!personId) {
      setError("Cannot unfollow this creator because person ID is missing.");
      return;
    }

    try {
      const key = `${personId}-${type}`;
      setRemovingKey(key);
      setError("");

      await unfollowPerson(personId, type);

      setFollows((prev) =>
        prev.filter((item) => {
          const itemId = getFollowPersonId(item);
          const itemType = getFollowType(item);
          return !(Number(itemId) === Number(personId) && itemType === type);
        })
      );
    } catch (err) {
      setError("Could not unfollow this creator.");
    } finally {
      setRemovingKey("");
    }
  };

  useEffect(() => {
    loadProfile();
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

  const followedDirectors = follows.filter(
    (follow) => getFollowType(follow) === "director"
  );

  const followedActors = follows.filter(
    (follow) => getFollowType(follow) === "actor"
  );

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
          User Taste Profile
        </p>

        <div className="mt-3 flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <h1 className="font-display text-4xl font-bold text-white md:text-6xl">
              Profile
            </h1>

            <p className="mt-4 max-w-2xl text-cinemaMuted">
              Your identity, followed creators, and taste signals in ChalChitra.
            </p>
          </div>

          <button
            type="button"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              loadProfile();
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

      {!loading && (
        <>
          <div className="mb-8 grid gap-5 lg:grid-cols-[380px_1fr]">
            <div className="glass-panel rounded-3xl p-6">
              <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl border border-cinemaGold/20 bg-cinemaGold/10 text-cinemaGold">
                <User size={34} />
              </div>

              <h2 className="font-display text-3xl font-bold text-white">
                {user?.name || "ChalChitra User"}
              </h2>

              <div className="mt-4 flex items-center gap-2 text-cinemaMuted">
                <Mail size={17} className="text-cinemaGold" />
                <span>{user?.email || "Email unavailable"}</span>
              </div>

              <div className="mt-6 rounded-2xl border border-cinemaBorder bg-black/20 p-4">
                <p className="text-xs font-bold uppercase tracking-[0.25em] text-cinemaGold">
                  Taste Summary
                </p>

                <p className="mt-3 leading-7 text-cinemaMuted">
                  {tasteSummary}
                </p>
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <ProfileStat
                title="Avg Rating"
                value={averageRating}
                icon={Star}
              />

              <ProfileStat
                title="Ratings"
                value={totalRatings}
                icon={Film}
              />

              <ProfileStat
                title="Watchlist"
                value={totalWatchlist}
                icon={Bookmark}
              />

              <ProfileStat
                title="Reviews"
                value={totalReviews}
                icon={MessageSquare}
              />
            </div>
          </div>

          <div className="mb-8 grid gap-5 lg:grid-cols-2">
            <TasteCard
              title="Favorite Genres"
              icon={Sparkles}
              items={favoriteGenres}
              emptyText="No genre profile yet."
            />

            <TasteCard
              title="Favorite Languages"
              icon={Film}
              items={favoriteLanguages}
              emptyText="No language profile yet."
            />

            <TasteCard
              title="Favorite Directors"
              icon={Clapperboard}
              items={favoriteDirectors}
              emptyText="No director preference yet."
            />

            <TasteCard
              title="Favorite Actors"
              icon={Users}
              items={favoriteActors}
              emptyText="No actor preference yet."
            />
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <FollowList
              title="Followed Directors"
              icon={Clapperboard}
              follows={followedDirectors}
              emptyText="No followed directors yet."
              removingKey={removingKey}
              onUnfollow={handleUnfollow}
            />

            <FollowList
              title="Followed Actors"
              icon={Users}
              follows={followedActors}
              emptyText="No followed actors yet."
              removingKey={removingKey}
              onUnfollow={handleUnfollow}
            />
          </div>
        </>
      )}
    </section>
  );
};

const ProfileStat = ({ title, value, icon: Icon }) => {
  return (
    <div className="glass-panel rounded-3xl p-5">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-cinemaGold/20 bg-cinemaGold/10 text-cinemaGold">
        <Icon size={22} />
      </div>

      <p className="text-xs font-bold uppercase tracking-[0.25em] text-cinemaGold">
        {title}
      </p>

      <h3 className="mt-3 font-display text-3xl font-bold text-white">
        {value}
      </h3>
    </div>
  );
};

const TasteCard = ({ title, icon: Icon, items = [], emptyText }) => {
  const cleanItems = Array.isArray(items) ? items.slice(0, 6) : [];

  return (
    <div className="glass-panel rounded-3xl p-5">
      <div className="mb-5 flex items-center gap-3">
        <div className="rounded-2xl border border-cinemaGold/20 bg-cinemaGold/10 p-3 text-cinemaGold">
          <Icon size={22} />
        </div>

        <h3 className="font-display text-2xl font-bold text-white">
          {title}
        </h3>
      </div>

      {cleanItems.length > 0 ? (
        <div className="space-y-3">
          {cleanItems.map((item, index) => {
            const name = getItemName(item);
            const score = getItemScore(item);

            return (
              <div
                key={`${name}-${index}`}
                className="flex items-center justify-between rounded-2xl border border-cinemaBorder bg-black/20 px-4 py-3"
              >
                <div>
                  <p className="font-semibold text-white">
                    {name}
                  </p>
                  <p className="text-xs text-cinemaDim">
                    Rank #{index + 1}
                  </p>
                </div>

                {score !== null && (
                  <span className="rounded-full bg-cinemaGold/10 px-3 py-1 text-xs font-bold text-cinemaGold">
                    {Number(score).toFixed(1)}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl border border-cinemaBorder bg-black/20 p-5 text-center text-sm text-cinemaMuted">
          {emptyText}
        </div>
      )}
    </div>
  );
};

const FollowList = ({
  title,
  icon: Icon,
  follows = [],
  emptyText,
  removingKey,
  onUnfollow
}) => {
  return (
    <div className="glass-panel rounded-3xl p-5">
      <div className="mb-5 flex items-center gap-3">
        <div className="rounded-2xl border border-cinemaGold/20 bg-cinemaGold/10 p-3 text-cinemaGold">
          <Icon size={22} />
        </div>

        <div>
          <h3 className="font-display text-2xl font-bold text-white">
            {title}
          </h3>

          <p className="text-sm text-cinemaMuted">
            {follows.length} creator{follows.length === 1 ? "" : "s"} followed
          </p>
        </div>
      </div>

      {follows.length > 0 ? (
        <div className="space-y-3">
          {follows.map((follow, index) => {
            const personId = getFollowPersonId(follow);
            const type = getFollowType(follow);
            const key = `${personId}-${type}`;

            return (
              <div
                key={`${key}-${index}`}
                className="flex items-center justify-between gap-4 rounded-2xl border border-cinemaBorder bg-black/20 px-4 py-3"
              >
                <div>
                  <p className="font-semibold text-white">
                    {getFollowName(follow)}
                  </p>

                  <p className="text-xs text-cinemaDim">
                    Person ID: {personId || "Unavailable"}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    onUnfollow(follow);
                  }}
                  disabled={removingKey === key}
                  className="rounded-full border border-red-500/30 bg-red-500/10 p-2 text-red-300 transition hover:bg-red-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl border border-cinemaBorder bg-black/20 p-5 text-center text-sm text-cinemaMuted">
          {emptyText}
        </div>
      )}
    </div>
  );
};

export default Profile;