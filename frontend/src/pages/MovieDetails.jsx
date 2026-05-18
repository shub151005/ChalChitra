import { useParams } from "react-router-dom";

const MovieDetails = () => {
  const { tmdbId } = useParams();

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 md:px-8">
      <h1 className="font-display text-4xl font-bold text-white">
        Movie Detail Page
      </h1>
      <p className="mt-2 text-cinemaMuted">
        TMDb ID: {tmdbId}
      </p>
    </section>
  );
};

export default MovieDetails;