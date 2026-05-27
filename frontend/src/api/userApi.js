import axiosClient from "./axiosClient";

export const rateMovie = async (ratingData) => {
  const response = await axiosClient.post("/users/ratings", ratingData);
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

export const followPerson = async (followData) => {
  const response = await axiosClient.post("/users/follows", followData);
  return response.data;
};

export const getMyAnalytics = async () => {
  const response = await axiosClient.get("/users/analytics/me");
  return response.data;
};