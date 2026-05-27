import CreatorFollowPanel from "../components/movie/CreatorFollowPanel";
import RatingBox from "../components/movie/RatingBox";
import ReviewBox from "../components/movie/ReviewBox";
import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Clock,
  Globe2,
  Star,
  Sparkles,
  Users,
  PenLine,
  Clapperboard,
  WandSparkles,
  RefreshCcw
} from "lucide-react";
import { motion } from "framer-motion";

import LoadingSpinner from "../components/ui/LoadingSpinner";
import ErrorMessage from "../components/ui/ErrorMessage";
import MovieRow from "../components/movie/MovieRow";
import WatchlistButton from "../components/movie/WatchlistButton";
import { expandMovieCatalog, getMovieDetails } from "../api/movieApi";
import {
  getMovieHiddenGems,
  getMovieRecommendations
} from "../api/recommendationApi";

const getName = (person) => {
  if (!person) return "";
  if (typeof person === "string") return person;
  return person.name || person.original_name || "";
};

const getCharacter = (person) => {
  if (!person || typeof person === "string") return "";
  return person.character || person.job || "";
};

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

const MovieDetails = () => {
  const { tmdbId } = useParams();
  const navigate = useNavigate();

  const [movie, setMovie] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [hiddenGems, setHiddenGems] = useState([]);

  const [loading, setLoading] = useState(true);
  const [recommendationLoading, setRecommendationLoading] = useState(false);
  const [expanding, setExpanding] = useState(false);

  const [error, setError] = useState("");
  const [expandMessage, setExpandMessage] = useState("");

  const directors = useMemo(() => movie?.directors || [], [movie]);
  const writers = useMemo(() => movie?.writers || [], [movie]);
  const cast = useMemo(() => movie?.cast || movie?.cast_members || [], [movie]);
  const genres = useMemo(() => movie?.genres || [], [movie]);

  const releaseYear = movie?.release_date
    ? movie.release_date.slice(0, 4)
    : "N/A";

  const rating =
    typeof movie?.rating === "number"
      ? movie.rating.toFixed(1)
      : "N/A";

  const runtime = movie?.runtime ? `${movie.runtime} min` : "N/A";

  const loadRecommendations = async () => {
    try {
      setRecommendationLoading(true);

      const [recommendationData, hiddenGemData] = await Promise.allSettled([
        getMovieRecommendations(tmdbId, 10),
        getMovieHiddenGems(tmdbId, 10)
      ]);

      if (recommendationData.status === "fulfilled") {
        setRecommendations(normalizeMovies(recommendationData.value));
      }

      if (hiddenGemData.status === "fulfilled") {
        setHiddenGems(normalizeMovies(hiddenGemData.value));
      }
    } finally {
      setRecommendationLoading(false);
    }
  };

  const loadMovie = async () => {
    try {
      setLoading(true);
      setError("");
      setExpandMessage("");

      const data = await getMovieDetails(tmdbId);
      setMovie(data);

      await loadRecommendations();
    } catch (err) {
      setError("Could not load movie details. Make sure backend is running.");
    } finally {
      setLoading(false);
    }
  };

  const handleExpandCatalog = async (event) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    try {
      setExpanding(true);
      setExpandMessage("");

      const data = await expandMovieCatalog(tmdbId, 10);

      setExpandMessage(
        `Catalog expanded: ${data.candidates_found || 0} candidates found, ${
          data.detailed_cached || 0
        } detailed movies cached.`
      );

      await loadRecommendations();
    } catch (err) {
      setExpandMessage("Catalog expansion failed. Try again after checking backend.");
    } finally {
      setExpanding(false);
    }
  };

  useEffect(() => {
    loadMovie();
  }, [tmdbId]);

  if (loading) {
    return (
      <section className="flex min-h-screen items-center justify-center bg-cinemaBlack">
        <LoadingSpinner />
      </section>
    );
  }

  if (error) {
    return (
      <section className="mx-auto min-h-screen max-w-5xl bg-cinemaBlack px-4 py-20 md:px-8">
        <ErrorMessage message={error} />
      </section>
    );
  }

  if (!movie) {
    return null;
  }

  return (
    <main className="min-h-screen bg-cinemaBlack">
      <section className="relative min-h-screen overflow-hidden">
        {movie.backdrop_url ? (
          <img
            src={movie.backdrop_url}
            alt={movie.title}
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-cinemaGradient" />
        )}

        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-black/30" />
        <div className="absolute inset-0 bg-gradient-to-t from-cinemaBlack via-transparent to-black/50" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_35%,rgba(20,184,166,0.20),transparent_30%)]" />

        <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col justify-center px-4 py-24 md:px-8">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="mb-8 flex w-fit items-center gap-2 rounded-full border border-white/10 bg-black/30 px-4 py-2 text-sm text-cinemaMuted backdrop-blur transition hover:border-cinemaGold/50 hover:text-cinemaGold"
          >
            <ArrowLeft size={17} />
            Back
          </button>

          <div className="grid items-center gap-10 lg:grid-cols-[1fr_360px]">
            <motion.div
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65 }}
              className="max-w-4xl"
            >
              <div className="mb-5 flex flex-wrap items-center gap-3">
                <span className="rounded-full border border-teal-400/30 bg-teal-500/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.25em] text-teal-200">
                  Cinematic Profile
                </span>

                <span className="rounded-full border border-cinemaGold/30 bg-cinemaGold/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.25em] text-cinemaGold">
                  ChalChitra Match Ready
                </span>
              </div>

              <h1 className="font-display text-5xl font-extrabold leading-[0.95] text-white md:text-7xl">
                {movie.title}
              </h1>

              {movie.original_title && movie.original_title !== movie.title && (
                <p className="mt-3 text-lg text-cinemaMuted">
                  Original title: {movie.original_title}
                </p>
              )}

              <div className="mt-6 flex flex-wrap gap-3">
                <InfoPill icon={Star} label={rating} />
                <InfoPill icon={Clock} label={runtime} />
                <InfoPill icon={Globe2} label={movie.language || "N/A"} />
                <InfoPill icon={Clapperboard} label={releaseYear} />
              </div>

              <p className="mt-8 max-w-3xl text-lg leading-8 text-cinemaMuted">
                {movie.description || "No overview available for this movie."}
              </p>

              <div className="mt-7 flex flex-wrap gap-2">
                {genres.length > 0 ? (
                  genres.map((genre) => (
                    <span
                      key={genre}
                      className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white backdrop-blur"
                    >
                      {genre}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-cinemaDim">
                    No genres available
                  </span>
                )}
              </div>

              <div className="mt-8 flex flex-wrap gap-4">
                <WatchlistButton movie={movie} />

                <button
                  type="button"
                  onClick={handleExpandCatalog}
                  disabled={expanding}
                  className="flex items-center gap-2 rounded-full border border-cinemaGold/40 bg-black/30 px-6 py-3 font-bold text-cinemaGold backdrop-blur transition hover:bg-cinemaGold hover:text-black disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {expanding ? <RefreshCcw size={18} /> : <WandSparkles size={18} />}
                  {expanding ? "Expanding Catalog..." : "Expand Recommendations"}
                </button>

                <button
                  type="button"
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    loadRecommendations();
                  }}
                  className="flex items-center gap-2 rounded-full border border-white/10 bg-black/30 px-6 py-3 font-bold text-white backdrop-blur transition hover:border-cinemaGold/50 hover:text-cinemaGold"
                >
                  <Sparkles size={18} />
                  Refresh Matches
                </button>
              </div>

              {expandMessage && (
                <p className="mt-4 max-w-xl rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-cinemaMuted backdrop-blur">
                  {expandMessage}
                </p>
              )}
            </motion.div>

            <motion.aside
              initial={{ opacity: 0, x: 36 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.65, delay: 0.1 }}
              className="glass-panel rounded-[2rem] p-4 shadow-cinemaGlow"
            >
              <div className="overflow-hidden rounded-[1.5rem] bg-cinemaPanel">
                {movie.poster_url ? (
                  <img
                    src={movie.poster_url}
                    alt={movie.title}
                    className="aspect-[2/3] w-full object-cover"
                  />
                ) : (
                  <div className="flex aspect-[2/3] items-center justify-center text-cinemaDim">
                    No Poster
                  </div>
                )}
              </div>

              <div className="mt-5 space-y-4">
                <DetailBlock
                  icon={Clapperboard}
                  title="Directed by"
                  items={directors.map(getName)}
                  empty="Director unavailable"
                />

                <DetailBlock
                  icon={PenLine}
                  title="Written by"
                  items={writers.map(getName)}
                  empty="Writer unavailable"
                />

                <DetailBlock
                  icon={Users}
                  title="Main Cast"
                  items={cast.slice(0, 5).map((person) => {
                    const name = getName(person);
                    const character = getCharacter(person);

                    if (!character) return name;
                    return `${name} as ${character}`;
                  })}
                  empty="Cast unavailable"
                />
              </div>
            </motion.aside>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 md:px-8">
        <div className="mb-10 grid gap-5 lg:grid-cols-[420px_1fr]">
  <RatingBox movie={movie} />

  <div className="glass-panel rounded-3xl p-5">
    <p className="text-xs font-bold uppercase tracking-[0.25em] text-cinemaGold">
      Taste Impact
    </p>

    <h3 className="mt-3 font-display text-2xl font-bold text-white">
      Why ratings matter
    </h3>

    <p className="mt-2 leading-7 text-cinemaMuted">
      Your rating becomes one of the strongest signals for personalized recommendations.
      ChalChitra uses it with genres, story similarity, directors, actors, watchlist
      behavior, and hidden-gem discovery.
    </p>
  </div>
</div>
        <div className="mb-10 grid gap-5 md:grid-cols-3">
          <StatCard
            title="Similarity Logic"
            value="Story + Genre"
            description="Recommendations compare narrative, genre, director, cast, rating, and popularity."
          />

          <StatCard
            title="Global Discovery"
            value={movie.language || "World"}
            description="Language helps discovery, but it is intentionally the lowest weighted signal."
          />

          <StatCard
            title="Hidden Gem Mode"
            value="Quality + Lower Popularity"
            description="Hidden gems reduce mainstream popularity bias and surface less obvious matches."
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
              title="Similar Taste Matches"
              subtitle="Movies connected by story, genres, director, cast, quality, and popularity."
              movies={recommendations}
              onViewMore={null}
            />

            <MovieRow
              title="Hidden Gems Near This Movie"
              subtitle="Less obvious films with strong taste similarity and lower mainstream popularity."
              movies={hiddenGems}
              onViewMore={null}
            />
          </>
        )}

        <CreatorFollowPanel directors={directors} cast={cast} />

        <ReviewBox movie={movie} />
        
        {cast.length > 0 && (
          <section className="py-10">
            <div className="mb-5">
              <h2 className="font-display text-3xl font-bold text-white">
                Cast
              </h2>
              <p className="mt-1 text-sm text-cinemaMuted">
                Main performers connected to this movie.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6">
              {cast.slice(0, 12).map((person, index) => (
                <div
                  key={`${getName(person)}-${index}`}
                  className="rounded-2xl border border-cinemaBorder bg-cinemaCard p-4"
                >
                  <p className="font-semibold text-white">
                    {getName(person)}
                  </p>

                  {getCharacter(person) && (
                    <p className="mt-1 text-sm text-cinemaDim">
                      {getCharacter(person)}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}
      </section>
    </main>
  );
};

const InfoPill = ({ icon: Icon, label }) => {
  return (
    <span className="flex items-center gap-2 rounded-full border border-white/10 bg-black/35 px-4 py-2 text-sm font-semibold text-white backdrop-blur">
      <Icon size={16} className="text-cinemaGold" />
      {label}
    </span>
  );
};

const DetailBlock = ({ icon: Icon, title, items, empty }) => {
  const cleanItems = items.filter(Boolean);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
      <div className="mb-3 flex items-center gap-2 text-cinemaGold">
        <Icon size={17} />
        <h3 className="text-sm font-bold uppercase tracking-[0.2em]">
          {title}
        </h3>
      </div>

      {cleanItems.length > 0 ? (
        <div className="space-y-2">
          {cleanItems.map((item, index) => (
            <p key={`${item}-${index}`} className="text-sm leading-6 text-cinemaMuted">
              {item}
            </p>
          ))}
        </div>
      ) : (
        <p className="text-sm text-cinemaDim">{empty}</p>
      )}
    </div>
  );
};

const StatCard = ({ title, value, description }) => {
  return (
    <div className="glass-panel rounded-3xl p-5">
      <p className="text-xs font-bold uppercase tracking-[0.25em] text-cinemaGold">
        {title}
      </p>

      <h3 className="mt-3 font-display text-2xl font-bold text-white">
        {value}
      </h3>

      <p className="mt-2 text-sm leading-6 text-cinemaMuted">
        {description}
      </p>
    </div>
  );
};

export default MovieDetails;