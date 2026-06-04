import { BrowserRouter, Routes, Route } from "react-router-dom";
import MovieRecommendationList from "./pages/MovieRecommendationList";

import { AuthProvider } from "./context/AuthContext";
import AppLayout from "./components/layout/AppLayout";
import ProtectedRoute from "./routes/ProtectedRoute";

import Home from "./pages/Home";
import Search from "./pages/Search";
import MovieDetails from "./pages/MovieDetails";
import Dashboard from "./pages/Dashboard";
import Watchlist from "./pages/Watchlist";
import Profile from "./pages/Profile";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import DiscoveryList from "./pages/DiscoveryList";

const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppLayout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/search" element={<Search />} />
            <Route path="/movie/:tmdbId" element={<MovieDetails />} />
            
            <Route
  path="/movie/:tmdbId/recommendations"
  element={<MovieRecommendationList type="recommendations" />}
/>

<Route path="/discover/trending" element={<DiscoveryList type="trending" />} />
<Route path="/discover/top-rated" element={<DiscoveryList type="top-rated" />} />
<Route
  path="/discover/award-winning"
  element={<DiscoveryList type="award-winning" />}
/>
<Route
  path="/discover/festival-favorites"
  element={<DiscoveryList type="festival-favorites" />}
/>
<Route path="/discover/romance" element={<DiscoveryList type="romance" />} />
<Route path="/discover/thriller" element={<DiscoveryList type="thriller" />} />
<Route
  path="/discover/global-hidden-gems"
  element={<DiscoveryList type="global-hidden-gems" />}
/>

<Route
  path="/movie/:tmdbId/hidden-gems"
  element={<MovieRecommendationList type="hidden-gems" />}
/>

            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />

            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/watchlist"
              element={
                <ProtectedRoute>
                  <Watchlist />
                </ProtectedRoute>
              }
            />

            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
          </Routes>
        </AppLayout>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;