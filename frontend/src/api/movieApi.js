import axiosClient from "./axiosClient";

export const searchMovies = async (query, page = 1) => {
  const response = await axiosClient.get("/movies/search", {
    params: {
      query,
      page
    }
  });

  return response.data;
};

export const getMovieDetails = async (tmdbId) => {
  const response = await axiosClient.get(`/movies/${tmdbId}`);
  return response.data;
};

export const getTrendingMovies = async () => {
  const response = await axiosClient.get("/movies/trending");
  return response.data;
};

export const getTopRatedMovies = async (page = 1) => {
  const response = await axiosClient.get("/movies/top-rated", {
    params: {
      page
    }
  });

  return response.data;
};

export const expandMovieCatalog = async (tmdbId, detailLimit = 10) => {
  const response = await axiosClient.post(`/movies/${tmdbId}/expand`, null, {
    params: {
      detail_limit: detailLimit
    }
  });

  return response.data;
};