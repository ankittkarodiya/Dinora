


// after kiosk
// Fractional star rating: 2.5 → two full stars + one HALF-filled star.
//
// How it works (no per-star maths): draw a row of 5 grey stars, then lay a
// row of 5 yellow stars on top and clip it to `value/5` of the width.
// Because both rows are identical, 2.5/5 = 50% clips exactly through the
// middle of the third star. 4.3 clips 30% into the fifth star. Any decimal
// just works.
export default function StarRating({ value = 0, size = 12, className = "" }) {
  const v = Math.max(0, Math.min(5, Number(value) || 0));
  const row = "★★★★★";

  return (
    <span
      className={`relative inline-block leading-none select-none ${className}`}
      style={{ fontSize: size, letterSpacing: "1px" }}
      role="img"
      aria-label={`${v} out of 5 stars`}
    >
      <span className="text-line">{row}</span>
      <span
        className="absolute left-0 top-0 overflow-hidden whitespace-nowrap text-amber-400"
        style={{ width: `${(v / 5) * 100}%` }}
      >
        {row}
      </span>
    </span>
  );
}












// before kiosk
// export default function StarRating({ value = 0, onChange, size = "text-base", count = 0 }) {
//   return (
//     <div className="flex items-center gap-1">
//       <div className="flex gap-0.5">
//         {[1, 2, 3, 4, 5].map((s) => (
//           <span
//             key={s}
//             onClick={() => onChange?.(s)}
//             className={`${size} transition-colors ${s <= value ? "text-amber-400" : "text-white/20"} ${onChange ? "cursor-pointer" : ""}`}
//           >
//             ★
//           </span>
//         ))}
//       </div>
//       {count > 0 && (
//         <span className="text-xs text-slate-400">({count})</span>
//       )}
//     </div>
//   );
// }