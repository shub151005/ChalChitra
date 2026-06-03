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

export const suggestMovies = async (query, limit = 5) => {
  const response = await axiosClient.get("/movies/suggest", {
    params: {
      query,
      limit
    }
  });

  return response.data;
};

export const getMovieDetails = async (tmdbId) => {
  const response = await axiosClient.get(`/movies/${tmdbId}`);
  return response.data;
};

export const getTrendingMovies = async (page = 1) => {
  const response = await axiosClient.get("/movies/trending", {
    params: {
      page
    }
  });

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
export const getAwardWinningMovies = async (page = 1, limit = 10) => {
  const response = await axiosClient.get("/movies/discover/award-winning", {
    params: {
      page,
      limit
    }
  });

  return response.data;
};

export const getFestivalFavoriteMovies = async (page = 1, limit = 10) => {
  const response = await axiosClient.get("/movies/discover/festival-favorites", {
    params: {
      page,
      limit
    }
  });

  return response.data;
};

export const getGlobalHiddenGemMovies = async (page = 1, limit = 10) => {
  const response = await axiosClient.get("/movies/discover/global-hidden-gems", {
    params: {
      page,
      limit
    }
  });

  return response.data;
};

export const getGenreMovies = async (genreName, page = 1, limit = 10) => {
  const response = await axiosClient.get(`/movies/genre/${genreName}`, {
    params: {
      page,
      limit
    }
  });

  return response.data;
};