import { Clapperboard, Users } from "lucide-react";

import FollowButton from "./FollowButton";

const getPersonId = (person) => {
  return person?.person_id || person?.id || person?.tmdb_id || null;
};

const getPersonName = (person) => {
  if (!person) return "";
  if (typeof person === "string") return person;
  return person.name || person.original_name || person.person_name || "";
};

const CreatorFollowPanel = ({ directors = [], cast = [] }) => {
  const usableDirectors = directors
    .filter((person) => getPersonName(person))
    .slice(0, 3);

  const usableActors = cast
    .filter((person) => getPersonName(person))
    .slice(0, 6);

  if (usableDirectors.length === 0 && usableActors.length === 0) {
    return null;
  }

  return (
    <section className="py-10">
      <div className="mb-6">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-cinemaGold">
          Creator Taste Signals
        </p>

        <h2 className="mt-2 font-display text-3xl font-bold text-white">
          Follow creators from this movie
        </h2>

        <p className="mt-1 text-sm text-cinemaMuted">
          Directors and actors become strong taste signals for personalized recommendations.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="relative overflow-hidden rounded-[2rem] border border-cinemaGold/20 bg-gradient-to-br from-[#0B0906] via-[#17100A] to-[#2A1D09] p-5 shadow-cardGlow">
          <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-cinemaGold/20 blur-3xl" />
          <div className="absolute bottom-0 left-0 h-32 w-full bg-gradient-to-t from-cinemaGold/10 to-transparent" />

          <div className="relative">
            <div className="mb-5 flex items-center gap-3">
              <div className="rounded-2xl border border-cinemaGold/30 bg-cinemaGold/10 p-3 text-cinemaGold shadow-cinemaGlow">
                <Clapperboard size={22} />
              </div>

              <div>
                <h3 className="font-display text-2xl font-bold text-white">
                  Directors
                </h3>
                <p className="text-sm text-cinemaMuted">
                  Auteur-driven signals for story, tone, and cinematic style.
                </p>
              </div>
            </div>

            {usableDirectors.length > 0 ? (
              <div className="space-y-3">
                {usableDirectors.map((director, index) => (
                  <div
                    key={`${getPersonName(director)}-${index}`}
                    className="group flex flex-col gap-3 rounded-2xl border border-cinemaGold/15 bg-black/25 p-4 backdrop-blur transition duration-300 hover:-translate-y-1 hover:border-cinemaGold/50 hover:bg-cinemaGold/10 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-semibold text-white">
                        {getPersonName(director)}
                      </p>
                      <p className="text-xs text-cinemaDim">
                        Person ID: {getPersonId(director) || "Unavailable"}
                      </p>
                    </div>

                    <FollowButton person={director} type="director" small />
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-cinemaBorder bg-black/20 p-5 text-center text-sm text-cinemaMuted">
                No director data available.
              </div>
            )}
          </div>
        </div>

        <div className="relative overflow-hidden rounded-[2rem] border border-fuchsia-400/20 bg-gradient-to-br from-[#080812] via-[#171022] to-[#30172D] p-5 shadow-cardGlow">
          <div className="absolute -right-16 top-0 h-60 w-60 rounded-full bg-fuchsia-500/15 blur-3xl" />
          <div className="absolute -left-16 bottom-0 h-48 w-48 rounded-full bg-cinemaGold/10 blur-3xl" />

          <div className="relative">
            <div className="mb-5 flex items-center gap-3">
              <div className="rounded-2xl border border-fuchsia-300/25 bg-fuchsia-400/10 p-3 text-fuchsia-200">
                <Users size={22} />
              </div>

              <div>
                <h3 className="font-display text-2xl font-bold text-white">
                  Main Actors
                </h3>
                <p className="text-sm text-cinemaMuted">
                  Performance-driven discovery through people you connect with.
                </p>
              </div>
            </div>

            {usableActors.length > 0 ? (
              <div className="space-y-3">
                {usableActors.map((actor, index) => (
                  <div
                    key={`${getPersonName(actor)}-${index}`}
                    className="group flex flex-col gap-3 rounded-2xl border border-fuchsia-300/10 bg-black/25 p-4 backdrop-blur transition duration-300 hover:-translate-y-1 hover:border-fuchsia-300/40 hover:bg-fuchsia-400/10 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-semibold text-white">
                        {getPersonName(actor)}
                      </p>

                      {actor?.character && (
                        <p className="text-xs text-cinemaDim">
                          as {actor.character}
                        </p>
                      )}

                      <p className="text-xs text-cinemaDim">
                        Person ID: {getPersonId(actor) || "Unavailable"}
                      </p>
                    </div>

                    <FollowButton person={actor} type="actor" small />
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-cinemaBorder bg-black/20 p-5 text-center text-sm text-cinemaMuted">
                No actor data available.
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default CreatorFollowPanel;