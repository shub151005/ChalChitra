import axiosClient from "./axiosClient";

export const rateMovie = async (tmdbId, rating) => {
  const response = await axiosClient.post("/users/ratings", {
    tmdb_id: tmdbId,
    rating
  });

  return response.data;
};

export const addOrUpdateWatchlist = async (tmdbId, status = "watch_later") => {
  const response = await axiosClient.post("/users/watchlist", {
    tmdb_id: tmdbId,
    status
  });

  return response.data;
};

export const getMyWatchlist = async (status = null) => {
  const params = {};

  if (status) {
    params.status = status;
  }

  const response = await axiosClient.get("/users/watchlist/me", {
    params
  });

  return response.data;
};

export const removeFromWatchlist = async (tmdbId) => {
  const response = await axiosClient.delete(`/users/watchlist/${tmdbId}`);
  return response.data;
};

export const createOrUpdateReview = async (tmdbId, reviewText, rating = null) => {
  const response = await axiosClient.post("/users/reviews", {
    tmdb_id: tmdbId,
    review_text: reviewText,
    rating
  });

  return response.data;
};

export const followPerson = async ({ personId, type, name, profileUrl }) => {
  const response = await axiosClient.post("/users/follows", {
    person_id: personId,
    type,
    name,
    profile_url: profileUrl
  });

  return response.data;
};

export const getMyAnalytics = async () => {
  const response = await axiosClient.get("/users/analytics/me");
  return response.data;
};