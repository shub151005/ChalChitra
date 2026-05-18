import { Link, NavLink, useNavigate } from "react-router-dom";
import { Film, Search, User, LogOut } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const navLinkClass = ({ isActive }) =>
  `text-sm font-medium transition ${
    isActive
      ? "text-cinemaGold"
      : "text-cinemaMuted hover:text-white"
  }`;

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <header className="fixed left-0 top-0 z-50 w-full border-b border-cinemaBorder bg-cinemaBlack/75 backdrop-blur-xl">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-8">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full border border-cinemaGold/40 bg-cinemaGold/10">
            <Film size={18} className="text-cinemaGold" />
          </div>
          <span className="font-display text-2xl font-bold tracking-wide gold-text">
            ChalChitra
          </span>
        </Link>

        <div className="hidden items-center gap-7 md:flex">
          <NavLink to="/" className={navLinkClass}>
            Home
          </NavLink>
          <NavLink to="/search" className={navLinkClass}>
            Search
          </NavLink>
          <NavLink to="/dashboard" className={navLinkClass}>
            Dashboard
          </NavLink>
          <NavLink to="/watchlist" className={navLinkClass}>
            Watchlist
          </NavLink>
          <NavLink to="/profile" className={navLinkClass}>
            Profile
          </NavLink>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/search")}
            className="rounded-full border border-cinemaBorder bg-white/5 p-2 text-cinemaMuted transition hover:border-cinemaGold/40 hover:text-cinemaGold"
            aria-label="Search"
          >
            <Search size={18} />
          </button>

          {isAuthenticated ? (
            <>
              <button
                onClick={() => navigate("/profile")}
                className="hidden items-center gap-2 rounded-full border border-cinemaBorder px-3 py-2 text-sm text-cinemaMuted transition hover:border-cinemaGold/40 hover:text-white md:flex"
              >
                <User size={16} />
                {user?.name || "Profile"}
              </button>

              <button
                onClick={handleLogout}
                className="rounded-full border border-red-500/20 bg-red-500/10 p-2 text-red-200 transition hover:bg-red-500/20"
                aria-label="Logout"
              >
                <LogOut size={17} />
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="rounded-full px-4 py-2 text-sm font-semibold text-cinemaMuted transition hover:text-white"
              >
                Login
              </Link>
              <Link
                to="/signup"
                className="rounded-full bg-cinemaGold px-4 py-2 text-sm font-bold text-black transition hover:bg-cinemaGoldSoft"
              >
                Sign up
              </Link>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
};

export default Navbar;