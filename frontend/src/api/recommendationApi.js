import axiosClient from "./axiosClient";

export const getMovieRecommendations = async (tmdbId, limit = 10) => {
  const response = await axiosClient.get(`/recommendations/movie/${tmdbId}`, {
    params: {
      limit
    }
  });

  return response.data;
};

export const getMovieHiddenGems = async (tmdbId, limit = 10) => {
  const response = await axiosClient.get(`/recommendations/hidden-gems/${tmdbId}`, {
    params: {
      limit
    }
  });

  return response.data;
};

export const getPersonalizedRecommendations = async (limit = 10) => {
  const response = await axiosClient.get("/recommendations/me", {
    params: {
      limit
    }
  });

  return response.data;
};

export const getPersonalizedHiddenGems = async (limit = 10) => {
  const response = await axiosClient.get("/recommendations/me/hidden-gems", {
    params: {
      limit
    }
  });

  return response.data;
};

export const getDirectorRecommendations = async (limit = 10) => {
  const response = await axiosClient.get("/recommendations/me/directors", {
    params: {
      limit
    }
  });

  return response.data;
};

export const getActorRecommendations = async (limit = 10) => {
  const response = await axiosClient.get("/recommendations/me/actors", {
    params: {
      limit
    }
  });

  return response.data;
};

export const getHybridMovieRecommendations = async (tmdbId, limit = 10) => {
  const response = await axiosClient.get(`/recommendations/hybrid/movie/${tmdbId}`, {
    params: {
      limit
    }
  });

  return response.data;
};