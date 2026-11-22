// light theme
import { useState, useEffect } from "react";
import { getItemReviewsApi } from "../../api/publicApi";

function StarDisplay({ value, size = "text-sm" }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => {
        const full = value >= s;
        const half = !full && value >= s - 0.5;
        return (
          <span key={s} className={`${size} relative`}>
            {/* Empty star (background) */}
            <span className="text-stone-300">★</span>
            {/* Filled portion overlaid */}
            {(full || half) && (
              <span
                className="absolute inset-0 text-amber-400 overflow-hidden"
                style={{ width: full ? "100%" : "50%" }}
              >
                ★
              </span>
            )}
          </span>
        );
      })}
    </div>
  );
}

export default function ItemDetailModal({ item, restaurantIsPro, onClose, onReview }) {
  const hasHalfFull = !!item.halfPrice;

  const [reviews, setReviews] = useState([]);
  const [avgRating, setAvgRating] = useState(null);
  const [loadingReviews, setLoadingReviews] = useState(true);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const data = await getItemReviewsApi(item._id);
        setReviews(data.reviews || []);
        setAvgRating(data.avgRating);
      } catch {}
      finally { setLoadingReviews(false); }
    };
    fetchReviews();
  }, [item._id]);

  return (
    <div onClick={onClose} className="fixed inset-0 bg-black/40 z-100 flex items-end justify-center">
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-120 bg-[#FAFAF8] rounded-t-3xl max-h-[92vh] flex flex-col"
      >
        {/* Handle */}
        <div className="pt-3 pb-1 flex justify-center shrink-0">
          <div className="w-10 h-1 bg-stone-300 rounded-full" />
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto flex-1">

          {/* Image */}
          <div className="mx-4 mt-2 rounded-2xl overflow-hidden bg-white border border-stone-200" style={{ height: 200 }}>
            {item.image ? (
              <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-stone-400">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21,15 16,10 5,21" />
                </svg>
                <span className="text-xs mt-2">No photo yet</span>
              </div>
            )}
          </div>

          <div className="px-4 pt-4 pb-6">
            {/* Header */}
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 ${item.isVeg ? "border-green-500" : "border-red-500"}`}>
                    <div className={`w-2 h-2 rounded-full ${item.isVeg ? "bg-green-500" : "bg-red-500"}`} />
                  </div>
                  {item.isBestseller && (
                    <span className="text-accent text-[10px] font-bold border border-accent/30 rounded px-1.5 py-0.5">
                      BESTSELLER
                    </span>
                  )}
                </div>
                <h2 className="text-stone-900 font-bold text-xl leading-tight">{item.name}</h2>
              </div>
              {!hasHalfFull && (
                <div className="text-stone-900 font-bold text-xl shrink-0">₹{item.price}</div>
              )}
            </div>

            {/* Half/Full pricing line */}
            {hasHalfFull && (
              <div className="text-stone-900 font-bold text-sm mb-3">
                ₹{item.halfPrice} <span className="text-stone-400 font-normal text-xs">Half</span>
                <span className="text-stone-300 mx-1.5">·</span>
                ₹{item.price} <span className="text-stone-400 font-normal text-xs">Full</span>
              </div>
            )}

            {/* Rating summary */}
            {restaurantIsPro && avgRating && (
              <div className="flex items-center gap-2 mb-3">
                <StarDisplay value={avgRating} size="text-base" />
                <span className="text-amber-500 font-bold text-sm">{avgRating}</span>
                <span className="text-stone-400 text-xs">· {reviews.length} review{reviews.length !== 1 ? "s" : ""}</span>
              </div>
            )}

            {/* Description */}
            {item.description && (
              <p className="text-stone-600 text-sm leading-relaxed mb-4">{item.description}</p>
            )}

            {!item.isAvailable && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 text-red-600 text-sm font-semibold mb-4 text-center">
                Currently Unavailable
              </div>
            )}

            {/* Reviews section */}
            {restaurantIsPro ? (
              <div className="mt-2">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-stone-900 font-bold text-base">
                    Reviews
                    {reviews.length > 0 && (
                      <span className="text-stone-400 font-normal text-sm ml-1.5">({reviews.length})</span>
                    )}
                  </h3>
                  <button
                    onClick={(e) => { e.stopPropagation(); onReview(); }}
                    className="text-accent text-sm font-semibold py-1.5 px-3 rounded-xl bg-accent/5 active:bg-accent/10"
                  >
                    ✍️ Write a Review
                  </button>
                </div>

                {loadingReviews ? (
                  <div className="text-stone-400 text-sm text-center py-4 animate-pulse">Loading reviews...</div>
                ) : reviews.length === 0 ? (
                  <div className="text-center py-6 bg-white rounded-2xl border border-stone-200">
                    <div className="text-stone-400 text-sm">No reviews yet</div>
                    <div className="text-stone-300 text-xs mt-1">Be the first to rate this dish!</div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {reviews.map((r) => (
                      <div key={r._id} className="bg-white rounded-2xl border border-stone-200 p-3.5">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-stone-900 font-semibold text-sm">{r.customerName ? r.customerName.charAt(0).toUpperCase() + r.customerName.slice(1).toLowerCase() : "Guest"}</span>
                          <div className="flex items-center gap-1.5">
                            <StarDisplay value={r.rating} size="text-xs" />
                            <span className="text-stone-400 text-xs">
                              {new Date(r.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
                            </span>
                          </div>
                        </div>
                        {r.text && (
                          <p className="text-stone-600 text-xs leading-relaxed">{r.text}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="mt-2 text-center text-stone-400 text-xs py-3">
                Reviews aren't available at this restaurant yet
              </div>
            )}
          </div>
        </div>

        {/* Sticky bottom */}
        <div className="px-4 pb-8 pt-3 border-t border-stone-200 shrink-0 bg-[#FAFAF8]">
          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl bg-stone-900 text-white text-sm font-semibold tracking-wide hover:bg-stone-800 active:scale-[0.98] transition-all"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
