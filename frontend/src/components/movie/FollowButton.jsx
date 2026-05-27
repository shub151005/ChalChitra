import { useState } from "react";
import { Check, UserPlus } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";
import { followPerson } from "../../api/userApi";

const getPersonId = (person) => {
  return person?.person_id || person?.id || person?.tmdb_id || null;
};

const getPersonName = (person) => {
  if (!person) return "";
  if (typeof person === "string") return person;
  return person.name || person.original_name || person.person_name || "";
};

const FollowButton = ({ person, type = "actor", small = false }) => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [following, setFollowing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const personId = getPersonId(person);
  const personName = getPersonName(person);

  const handleFollow = async (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (!personId || !personName) {
      setMessage("Creator data unavailable.");
      setTimeout(() => setMessage(""), 2500);
      return;
    }

    if (!isAuthenticated) {
      navigate("/login", {
        replace: false,
        state: {
          from: {
            pathname: window.location.pathname
          }
        }
      });
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      await followPerson({
        person_id: personId,
        name: personName,
        type
      });

      setFollowing(true);
      setMessage(`Following ${personName}`);

      setTimeout(() => {
        setMessage("");
      }, 2500);
    } catch (err) {
      setMessage(
        err?.response?.data?.detail ||
          "Could not follow this creator."
      );
    } finally {
      setLoading(false);
    }
  };

  if (!personName) {
    return null;
  }

  return (
    <div onClick={(event) => event.stopPropagation()}>
      <button
        type="button"
        onClick={handleFollow}
        disabled={loading}
        className={`flex items-center justify-center gap-2 rounded-full border font-bold transition disabled:cursor-not-allowed disabled:opacity-60 ${
          following
            ? "border-cinemaGold/40 bg-cinemaGold/10 text-cinemaGold"
            : "border-white/10 bg-black/30 text-white hover:border-cinemaGold/50 hover:text-cinemaGold"
        } ${small ? "px-4 py-2 text-xs" : "px-5 py-3 text-sm"}`}
      >
        {following ? <Check size={16} /> : <UserPlus size={16} />}

        {loading
          ? "Saving..."
          : following
            ? "Following"
            : `Follow ${type === "director" ? "Director" : "Actor"}`}
      </button>

      {message && (
        <p className="mt-2 text-xs text-cinemaMuted">
          {message}
        </p>
      )}
    </div>
  );
};

export default FollowButton;