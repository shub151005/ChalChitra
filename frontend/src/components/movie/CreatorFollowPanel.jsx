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
      <div className="mb-5">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-cinemaGold">
          Creator Taste Signals
        </p>

        <h2 className="mt-2 font-display text-3xl font-bold text-white">
          Follow creators from this movie
        </h2>

        <p className="mt-1 text-sm text-cinemaMuted">
          Following directors and actors improves your personalized recommendations.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="glass-panel rounded-3xl p-5">
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-2xl border border-cinemaGold/20 bg-cinemaGold/10 p-3 text-cinemaGold">
              <Clapperboard size={22} />
            </div>

            <div>
              <h3 className="font-display text-2xl font-bold text-white">
                Directors
              </h3>
              <p className="text-sm text-cinemaMuted">
                Director-first recommendations become stronger here.
              </p>
            </div>
          </div>

          {usableDirectors.length > 0 ? (
            <div className="space-y-3">
              {usableDirectors.map((director, index) => (
                <div
                  key={`${getPersonName(director)}-${index}`}
                  className="flex flex-col gap-3 rounded-2xl border border-cinemaBorder bg-black/20 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-semibold text-white">
                      {getPersonName(director)}
                    </p>
                    <p className="text-xs text-cinemaDim">
                      Person ID: {getPersonId(director) || "Unavailable"}
                    </p>
                  </div>

                  <FollowButton
                    person={director}
                    type="director"
                    small
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-cinemaBorder bg-black/20 p-5 text-center text-sm text-cinemaMuted">
              No director data available.
            </div>
          )}
        </div>

        <div className="glass-panel rounded-3xl p-5">
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-2xl border border-cinemaGold/20 bg-cinemaGold/10 p-3 text-cinemaGold">
              <Users size={22} />
            </div>

            <div>
              <h3 className="font-display text-2xl font-bold text-white">
                Main Actors
              </h3>
              <p className="text-sm text-cinemaMuted">
                Actor follows help build people-based discovery.
              </p>
            </div>
          </div>

          {usableActors.length > 0 ? (
            <div className="space-y-3">
              {usableActors.map((actor, index) => (
                <div
                  key={`${getPersonName(actor)}-${index}`}
                  className="flex flex-col gap-3 rounded-2xl border border-cinemaBorder bg-black/20 p-4 sm:flex-row sm:items-center sm:justify-between"
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

                  <FollowButton
                    person={actor}
                    type="actor"
                    small
                  />
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
    </section>
  );
};

export default CreatorFollowPanel;