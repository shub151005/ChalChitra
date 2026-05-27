import { Navigate, useLocation } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import LoadingSpinner from "../components/ui/LoadingSpinner";

const ProtectedRoute = ({ children }) => {
  const location = useLocation();
  const { isAuthenticated, authLoading } = useAuth();

  if (authLoading) {
    return (
      <section className="flex min-h-screen items-center justify-center bg-cinemaBlack">
        <LoadingSpinner />
      </section>
    );
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from: location
        }}
      />
    );
  }

  return children;
};

export default ProtectedRoute;