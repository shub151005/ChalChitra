import { useState } from "react";
import { BookmarkPlus, Check, ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";
import { addOrUpdateWatchlist } from "../../api/userApi";

const statusOptions = [
  {
    value: "watch_later",
    label: "Watch Later"
  },
  {
    value: "watching",
    label: "Watching"
  },
  {
    value: "completed",
    label: "Completed"
  },
  {
    value: "dropped",
    label: "Dropped"
  }
];

const WatchlistButton = ({ movie, onSaved }) => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [open, setOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("watch_later");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const saveWatchlist = async (status) => {
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

      await addOrUpdateWatchlist({
        tmdb_id: movie.tmdb_id,
        status
      });

      setSelectedStatus(status);
      setOpen(false);
      setMessage("Saved to watchlist");

      if (onSaved) {
        onSaved(status);
      }

      setTimeout(() => {
        setMessage("");
      }, 2500);
    } catch (err) {
      setMessage(
        err?.response?.data?.detail ||
          "Could not update watchlist."
      );
    } finally {
      setSaving(false);
    }
  };

  const selectedLabel =
    statusOptions.find((option) => option.value === selectedStatus)?.label ||
    "Watch Later";

  if (!movie?.tmdb_id) {
    return null;
  }

  return (
    <div className="relative">
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => saveWatchlist(selectedStatus)}
          disabled={saving}
          className="flex items-center gap-2 rounded-full bg-cinemaGold px-6 py-3 font-bold text-black transition hover:bg-cinemaGoldSoft disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? (
            "Saving..."
          ) : (
            <>
              <BookmarkPlus size={18} />
              Add to Watchlist
            </>
          )}
        </button>

        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className="flex items-center gap-2 rounded-full border border-white/10 bg-black/30 px-5 py-3 font-bold text-white backdrop-blur transition hover:border-cinemaGold/50 hover:text-cinemaGold"
        >
          {selectedLabel}
          <ChevronDown size={18} />
        </button>
      </div>

      {open && (
        <div className="absolute left-0 top-full z-40 mt-3 w-56 overflow-hidden rounded-2xl border border-cinemaBorder bg-cinemaPanel shadow-cardGlow">
          {statusOptions.map((option) => (
            <button
              type="button"
              key={option.value}
              onClick={() => saveWatchlist(option.value)}
              className="flex w-full items-center justify-between px-4 py-3 text-left text-sm text-cinemaMuted transition hover:bg-white/5 hover:text-white"
            >
              {option.label}
              {selectedStatus === option.value && (
                <Check size={16} className="text-cinemaGold" />
              )}
            </button>
          ))}
        </div>
      )}

      {message && (
        <p className="mt-3 rounded-2xl border border-white/10 bg-black/30 px-4 py-2 text-sm text-cinemaMuted backdrop-blur">
          {message}
        </p>
      )}
    </div>
  );
};

export default WatchlistButton;