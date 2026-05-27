import axiosClient from "./axiosClient";

export const rateMovie = async (ratingData) => {
  const response = await axiosClient.post("/users/ratings", ratingData);
  return response.data;
};

export const getMyRatings = async () => {
  const response = await axiosClient.get("/users/ratings/me");
  return response.data;
};

export const getMovieRating = async (tmdbId) => {
  const response = await axiosClient.get(`/users/ratings/movie/${tmdbId}`);
  return response.data;
};

export const addOrUpdateWatchlist = async (watchlistData) => {
  const response = await axiosClient.post("/users/watchlist", watchlistData);
  return response.data;
};

export const getMyWatchlist = async () => {
  const response = await axiosClient.get("/users/watchlist/me");
  return response.data;
};

export const removeFromWatchlist = async (tmdbId) => {
  const response = await axiosClient.delete(`/users/watchlist/${tmdbId}`);
  return response.data;
};

export const createOrUpdateReview = async (reviewData) => {
  const response = await axiosClient.post("/users/reviews", reviewData);
  return response.data;
};

export const getMyReviews = async () => {
  const response = await axiosClient.get("/users/reviews/me");
  return response.data;
};

export const getMovieReviews = async (tmdbId) => {
  const response = await axiosClient.get(`/users/reviews/movie/${tmdbId}`);
  return response.data;
};

export const deleteReview = async (tmdbId) => {
  const response = await axiosClient.delete(`/users/reviews/${tmdbId}`);
  return response.data;
};

export const followPerson = async (followData) => {
  const response = await axiosClient.post("/users/follows", followData);
  return response.data;
};

export const getMyFollows = async () => {
  const response = await axiosClient.get("/users/follows/me");
  return response.data;
};

export const unfollowPerson = async (personId, type) => {
  const response = await axiosClient.delete(`/users/follows/${personId}`, {
    params: {
      type
    }
  });

  return response.data;
};

export const getMyAnalytics = async () => {
  const response = await axiosClient.get("/users/analytics/me");
  return response.data;
};