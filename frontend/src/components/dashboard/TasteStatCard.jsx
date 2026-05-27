const TasteStatCard = ({ title, value, description, icon: Icon }) => {
  return (
    <div className="glass-panel rounded-3xl p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-cinemaGold">
            {title}
          </p>

          <h3 className="mt-3 font-display text-3xl font-bold text-white">
            {value}
          </h3>

          {description && (
            <p className="mt-2 text-sm leading-6 text-cinemaMuted">
              {description}
            </p>
          )}
        </div>

        {Icon && (
          <div className="rounded-2xl border border-cinemaGold/20 bg-cinemaGold/10 p-3 text-cinemaGold">
            <Icon size={22} />
          </div>
        )}
      </div>
    </div>
  );
};

export default TasteStatCard;
