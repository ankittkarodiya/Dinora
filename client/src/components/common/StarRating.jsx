export default function StarRating({ value = 0, onChange, size = "text-base", count = 0 }) {
  return (
    <div className="flex items-center gap-1">
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((s) => (
          <span
            key={s}
            onClick={() => onChange?.(s)}
            className={`${size} transition-colors ${s <= value ? "text-amber-400" : "text-white/20"} ${onChange ? "cursor-pointer" : ""}`}
          >
            ★
          </span>
        ))}
      </div>
      {count > 0 && (
        <span className="text-xs text-slate-400">({count})</span>
      )}
    </div>
  );
}