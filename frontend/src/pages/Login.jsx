import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, Lock, LogIn } from "lucide-react";

import { useAuth } from "../context/AuthContext";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import ErrorMessage from "../components/ui/ErrorMessage";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const from = location.state?.from?.pathname || "/dashboard";

  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (event) => {
    setFormData((prev) => ({
      ...prev,
      [event.target.name]: event.target.value
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!formData.email.trim() || !formData.password.trim()) {
      setError("Please enter both email and password.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      await login(formData.email.trim(), formData.password);

      navigate(from, {
        replace: true
      });
    } catch (err) {
      setError(
        err?.response?.data?.detail ||
          "Login failed. Please check your email and password."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="relative min-h-screen overflow-hidden px-4 py-20 md:px-8">
      <div className="absolute inset-0 bg-cinemaGradient" />
      <div className="absolute left-[15%] top-28 h-72 w-72 rounded-full bg-cinemaGold/10 blur-3xl" />
      <div className="absolute right-[10%] bottom-24 h-80 w-80 rounded-full bg-cinemaRed/10 blur-3xl" />

      <div className="relative mx-auto flex min-h-[75vh] max-w-7xl items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55 }}
          className="glass-panel w-full max-w-md rounded-[2rem] p-6 shadow-cinemaGlow md:p-8"
        >
          <div className="mb-8 text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.35em] text-cinemaGold">
              Welcome Back
            </p>

            <h1 className="mt-3 font-display text-4xl font-bold text-white">
              Login to ChalChitra
            </h1>

            <p className="mt-3 text-sm leading-6 text-cinemaMuted">
              Continue your global cinema discovery journey.
            </p>
          </div>

          {error && (
            <div className="mb-5">
              <ErrorMessage message={error} />
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="rounded-2xl border border-cinemaBorder bg-black/30 px-4 py-3">
              <label className="mb-2 flex items-center gap-2 text-sm text-cinemaMuted">
                <Mail size={16} className="text-cinemaGold" />
                Email
              </label>

              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="subham@example.com"
                className="w-full bg-transparent text-white outline-none placeholder:text-cinemaDim"
              />
            </div>

            <div className="rounded-2xl border border-cinemaBorder bg-black/30 px-4 py-3">
              <label className="mb-2 flex items-center gap-2 text-sm text-cinemaMuted">
                <Lock size={16} className="text-cinemaGold" />
                Password
              </label>

              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                className="w-full bg-transparent text-white outline-none placeholder:text-cinemaDim"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-cinemaGold px-6 py-3 font-bold text-black transition hover:bg-cinemaGoldSoft disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <LoadingSpinner small />
              ) : (
                <>
                  <LogIn size={18} />
                  Login
                </>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-cinemaMuted">
            New to ChalChitra?{" "}
            <Link
              to="/signup"
              className="font-semibold text-cinemaGold transition hover:text-cinemaGoldSoft"
            >
              Create an account
            </Link>
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default Login;