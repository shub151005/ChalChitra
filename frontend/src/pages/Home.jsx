import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Search, Sparkles, Globe2, Film, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";

import MovieRow from "../components/movie/MovieRow";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import ErrorMessage from "../components/ui/ErrorMessage";
import {
  getTopRatedMovies,
  getTrendingMovies,
  getAwardWinningMovies,
  getFestivalFavoriteMovies,
  getGlobalHiddenGemMovies,
  getGenreMovies
} from "../api/movieApi";

const Home = () => {
  const navigate = useNavigate();

  const [trendingMovies, setTrendingMovies] = useState([]);
  const [topRatedMovies, setTopRatedMovies] = useState([]);
  const [awardMovies, setAwardMovies] = useState([]);
  const [festivalMovies, setFestivalMovies] = useState([]);
  const [romanceMovies, setRomanceMovies] = useState([]);
  const [thrillerMovies, setThrillerMovies] = useState([]);
  const [hiddenGemMovies, setHiddenGemMovies] = useState([]);

  const [homeLoading, setHomeLoading] = useState(true);
  const [homeError, setHomeError] = useState("");

  const loadHomeMovies = async () => {
    try {
      setHomeLoading(true);
      setHomeError("");

      const results = await Promise.allSettled([
        getTrendingMovies(1),
        getTopRatedMovies(1),
        getAwardWinningMovies(1, 10),
        getFestivalFavoriteMovies(1, 10),
        getGenreMovies("romance", 1, 10),
        getGenreMovies("thriller", 1, 10),
        getGlobalHiddenGemMovies(1, 10)
      ]);

      const getResults = (index) => {
        if (results[index].status !== "fulfilled") {
          return [];
        }

        return results[index].value?.results || [];
      };

      setTrendingMovies(getResults(0));
      setTopRatedMovies(getResults(1));
      setAwardMovies(getResults(2));
      setFestivalMovies(getResults(3));
      setRomanceMovies(getResults(4));
      setThrillerMovies(getResults(5));
      setHiddenGemMovies(getResults(6));
    } catch (err) {
      console.error("Homepage loading failed:", err);
      setHomeError("Could not load homepage movies.");
    } finally {
      setHomeLoading(false);
    }
  };

  useEffect(() => {
    loadHomeMovies();
  }, []);

  return (
    <>
      <section className="relative min-h-screen overflow-hidden px-4 py-16 md:px-8 md:py-20">
        <div className="absolute inset-0 bg-cinemaGradient" />
        <div className="absolute left-[12%] top-24 h-72 w-72 rounded-full bg-cinemaGold/10 blur-3xl" />
        <div className="absolute right-[8%] top-44 h-80 w-80 rounded-full bg-cinemaRed/10 blur-3xl" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-cinemaBlack to-transparent" />

        <div className="relative mx-auto grid min-h-[78vh] max-w-7xl items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="max-w-3xl"
          >
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.35em] text-cinemaGold md:text-sm">
              Global Cinema Discovery
            </p>

            <h1 className="font-display text-5xl font-extrabold leading-[0.95] text-white md:text-6xl xl:text-7xl">
              Cinema that understands your{" "}
              <span className="gold-text">taste.</span>
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-7 text-cinemaMuted md:text-lg md:leading-8">
              Discover films through story, genre, directors, actors, hidden gems,
              and global cinema connections — powered by a hybrid recommendation engine.
            </p>

            <button
              type="button"
              onClick={() => navigate("/search")}
              className="mt-8 flex w-full max-w-xl items-center gap-3 rounded-full border border-cinemaBorder bg-white/5 px-5 py-4 text-left text-cinemaMuted shadow-cardGlow backdrop-blur transition hover:border-cinemaGold/50 hover:bg-white/10"
            >
              <Search size={20} className="shrink-0 text-cinemaGold" />
              <span className="line-clamp-1">
                Search The Shining, Parasite, Aamis, La La Land...
              </span>
            </button>

            <div className="mt-8 flex flex-wrap gap-4">
              <button
                type="button"
                onClick={() => navigate("/search")}
                className="rounded-full bg-cinemaGold px-6 py-3 font-bold text-black transition hover:bg-cinemaGoldSoft"
              >
                Start Exploring
              </button>

              <button
                type="button"
                onClick={() => navigate("/dashboard")}
                className="rounded-full border border-cinemaBorder px-6 py-3 font-bold text-white transition hover:border-cinemaGold/60 hover:text-cinemaGold"
              >
                My Recommendations
              </button>
            </div>

            <div className="mt-10 grid max-w-2xl grid-cols-2 gap-3 md:grid-cols-4">
              {[
                ["Hybrid AI", Sparkles],
                ["World Cinema", Globe2],
                ["Hidden Gems", Star],
                ["Director-first", Film]
              ].map(([label, Icon]) => (
                <div
                  key={label}
                  className="glass-panel rounded-2xl px-4 py-3 text-sm text-cinemaMuted"
                >
                  <Icon size={17} className="mb-2 text-cinemaGold" />
                  {label}
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.15 }}
            className="relative hidden lg:block"
          >
            <div className="absolute -left-8 top-10 h-72 w-48 rotate-[-8deg] rounded-3xl border border-cinemaBorder bg-gradient-to-br from-cinemaGold/20 to-white/5 shadow-cardGlow" />
            <div className="absolute right-0 top-0 h-72 w-48 rotate-[8deg] rounded-3xl border border-cinemaBorder bg-gradient-to-br from-cinemaRed/20 to-white/5 shadow-cardGlow" />

            <div className="glass-panel relative mx-auto max-w-md rounded-[2rem] p-5 shadow-cinemaGlow">
              <div className="relative h-[480px] overflow-hidden rounded-[1.5rem] bg-cinemaPanel">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(212,175,55,0.28),transparent_35%),linear-gradient(180deg,rgba(255,255,255,0.08),rgba(0,0,0,0.95))]" />

                <div className="absolute inset-x-6 top-6 rounded-2xl border border-white/10 bg-black/35 p-4 backdrop-blur">
                  <p className="text-xs uppercase tracking-[0.25em] text-cinemaGold">
                    Taste Match
                  </p>

                  <h3 className="mt-2 font-display text-3xl font-bold text-white">
                    Hidden Gems
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-cinemaMuted">
                    Less obvious films ranked by your taste, quality, and lower mainstream popularity.
                  </p>
                </div>

                <div className="absolute bottom-6 left-6 right-6 space-y-3">
                  <HeroMiniCard
                    title="The Prestige"
                    tag="92%"
                    description="Similar director, genre, and story tension."
                    highlighted
                  />

                  <HeroMiniCard
                    title="Arrival"
                    tag="Sci-fi Drama"
                    description="Global cinema recommendations beyond language."
                  />

                  <HeroMiniCard
                    title="Taste Profile"
                    tag="Live"
                    description="Genres, directors, actors, and watch behavior."
                  />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-20 md:px-8">
        {homeLoading && (
          <div className="py-12">
            <LoadingSpinner />
          </div>
        )}

        {homeError && (
          <div className="py-8">
            <ErrorMessage message={homeError} />
          </div>
        )}

        {!homeLoading && !homeError && (
          <div className="space-y-2">
            <MovieRow
              title="Trending Worldwide"
              subtitle="Popular films people are watching right now."
              movies={trendingMovies}
              limit={8}
              showCount
              onViewMore={() => navigate("/discover/trending")}
            />

            <MovieRow
              title="Top Rated Classics"
              subtitle="High-rated films to start your discovery journey."
              movies={topRatedMovies}
              limit={8}
              showCount
              onViewMore={() => navigate("/discover/top-rated")}
            />

            <MovieRow
              title="Award-Winning & Acclaimed"
              subtitle="Highly rated cinema selected from ChalChitra’s cached global catalog."
              movies={awardMovies}
              limit={10}
              showCount
              onViewMore={() => navigate("/discover/award-winning")}
            />

            <MovieRow
              title="Festival & Art-House Favorites"
              subtitle="Lower-mainstream films with strong ratings and global discovery value."
              movies={festivalMovies}
              limit={10}
              showCount
              onViewMore={() => navigate("/discover/festival-favorites")}
            />

            <MovieRow
              title="Romance & Emotional Dramas"
              subtitle="Stories centered on love, longing, memory, and human connection."
              movies={romanceMovies}
              limit={10}
              showCount
              onViewMore={() => navigate("/discover/romance")}
            />

            <MovieRow
              title="Thrillers & Psychological Cinema"
              subtitle="Tense, mysterious, and psychologically charged cinema."
              movies={thrillerMovies}
              limit={10}
              showCount
              onViewMore={() => navigate("/discover/thriller")}
            />

            <MovieRow
              title="Global Hidden Gems"
              subtitle="Less obvious films with strong ratings and lower mainstream popularity."
              movies={hiddenGemMovies}
              limit={10}
              showCount
              onViewMore={() => navigate("/discover/global-hidden-gems")}
            />
          </div>
        )}
      </section>
    </>
  );
};

const HeroMiniCard = ({ title, tag, description, highlighted = false }) => {
  return (
    <div
      className={
        highlighted
          ? "rounded-2xl border border-cinemaGold/20 bg-cinemaGold/10 p-4 backdrop-blur"
          : "rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur"
      }
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-semibold text-white">{title}</span>

        <span
          className={
            highlighted
              ? "rounded-full bg-cinemaGold px-2 py-1 text-xs font-bold text-black"
              : "text-xs text-cinemaGold"
          }
        >
          {tag}
        </span>
      </div>

      <p className="mt-1 text-xs text-cinemaMuted">{description}</p>
    </div>
  );
};

export default Home;