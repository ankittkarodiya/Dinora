import { useRef, useEffect } from "react";

export default function CategoryTabs({ categories, activeId, onSelect }) {
  const ref = useRef(null);

  useEffect(() => {
    const active = ref.current?.querySelector("[data-active='true']");
    if (active) active.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [activeId]);

  return (
    <div className="sticky top-60px z-40 bg-slate-900/80 backdrop-blur-md border-b border-white/10">
      <div
        ref={ref}
        className="flex gap-2 px-4 py-2.5 overflow-x-auto"
        style={{ scrollbarWidth: "none" }}
      >
        {[{ _id: "all", name: "All", emoji: "📋" }, ...categories].map((cat) => (
          <button
            key={cat._id}
            data-active={activeId === cat._id}
            onClick={() => onSelect(cat._id)}
            className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200
              ${activeId === cat._id
                ? "bg-blue-600 text-white shadow-lg shadow-blue-500/25"
                : "bg-white/10 text-slate-300 hover:bg-white/20 border border-white/10"
              }`}
          >
            {cat.emoji} {cat.name}
          </button>
        ))}
      </div>
    </div>
  );
}