const LoadingSpinner = ({ small = false }) => {
  return (
    <div className="flex items-center justify-center">
      <div
        className={`animate-spin rounded-full border-2 border-cinemaGold border-t-transparent ${
          small ? "h-5 w-5" : "h-10 w-10"
        }`}
      />
    </div>
  );
};

export default LoadingSpinner;