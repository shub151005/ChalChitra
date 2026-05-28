export const getAnalyticsArray = (analytics, keys) => {
  if (!analytics) return [];

  for (const key of keys) {
    if (Array.isArray(analytics[key])) {
      return analytics[key];
    }
  }

  if (analytics.stats) {
    for (const key of keys) {
      if (Array.isArray(analytics.stats[key])) {
        return analytics.stats[key];
      }
    }
  }

  if (analytics.data) {
    for (const key of keys) {
      if (Array.isArray(analytics.data[key])) {
        return analytics.data[key];
      }
    }
  }

  return [];
};

export const getAnalyticsValue = (analytics, keys, fallback = 0) => {
  if (!analytics) return fallback;

  for (const key of keys) {
    const value = analytics[key];

    if (value !== undefined && value !== null) {
      return value;
    }
  }

  if (analytics.stats) {
    for (const key of keys) {
      const value = analytics.stats[key];

      if (value !== undefined && value !== null) {
        return value;
      }
    }
  }

  if (analytics.data) {
    for (const key of keys) {
      const value = analytics.data[key];

      if (value !== undefined && value !== null) {
        return value;
      }
    }
  }

  if (analytics.summary) {
    for (const key of keys) {
      const value = analytics.summary[key];

      if (value !== undefined && value !== null) {
        return value;
      }
    }
  }

  return fallback;
};

export const formatNumber = (value, fallback = 0) => {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  const numberValue = Number(value);

  if (Number.isNaN(numberValue)) {
    return fallback;
  }

  return numberValue;
};

export const formatAverageRating = (value) => {
  if (value === undefined || value === null || value === "") {
    return "N/A";
  }

  const numberValue = Number(value);

  if (Number.isNaN(numberValue)) {
    return "N/A";
  }

  return numberValue.toFixed(1);
};

export const getTasteSummary = (analytics) => {
  return (
    analytics?.taste_summary ||
    analytics?.summary_text ||
    analytics?.profile_summary ||
    analytics?.data?.taste_summary ||
    analytics?.stats?.taste_summary ||
    analytics?.summary?.taste_summary ||
    "Rate movies, save watchlist items, write reviews, and follow creators to build a richer taste profile."
  );
};