const LoadingSpinner = () => {
  return (
    <div className="flex items-center justify-center">
      <div className="h-10 w-10 rounded-full border-2 border-cinemaGold border-t-transparent animate-spin" />
    </div>
  );
};

export default LoadingSpinner;