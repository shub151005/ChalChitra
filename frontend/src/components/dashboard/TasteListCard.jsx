const getItemName = (item) => {
  if (!item) return "";

  if (typeof item === "string") {
    return item;
  }

  return (
    item.name ||
    item.genre ||
    item.language ||
    item.director ||
    item.actor ||
    item.title ||
    "Unknown"
  );
};

const getItemScore = (item) => {
  if (!item || typeof item === "string") {
    return null;
  }

  return item.score || item.count || item.total || item.value || null;
};

const TasteListCard = ({ title, subtitle, items = [], emptyText = "No data yet." }) => {
  const cleanItems = Array.isArray(items) ? items.slice(0, 6) : [];

  return (
    <div className="glass-panel rounded-3xl p-5">
      <div className="mb-5">
        <h3 className="font-display text-2xl font-bold text-white">
          {title}
        </h3>

        {subtitle && (
          <p className="mt-1 text-sm text-cinemaMuted">
            {subtitle}
          </p>
        )}
      </div>

      {cleanItems.length > 0 ? (
        <div className="space-y-3">
          {cleanItems.map((item, index) => {
            const name = getItemName(item);
            const score = getItemScore(item);

            return (
              <div
                key={`${name}-${index}`}
                className="flex items-center justify-between gap-4 rounded-2xl border border-cinemaBorder bg-black/20 px-4 py-3"
              >
                <div>
                  <p className="font-semibold text-white">
                    {name}
                  </p>

                  <p className="text-xs text-cinemaDim">
                    Rank #{index + 1}
                  </p>
                </div>

                {score !== null && (
                  <span className="rounded-full bg-cinemaGold/10 px-3 py-1 text-xs font-bold text-cinemaGold">
                    {Number(score).toFixed ? Number(score).toFixed(1) : score}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl border border-cinemaBorder bg-black/20 p-5 text-center text-sm text-cinemaMuted">
          {emptyText}
        </div>
      )}
    </div>
  );
};

export default TasteListCard;