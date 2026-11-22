import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getReviewsApi } from "../../api/reviewApi";
import { Loader2, RefreshCw, Star, ChevronDown, Quote } from "lucide-react";
import toast from "react-hot-toast";

import { useSubscription } from "../../hooks/useSubscription";
import UpgradeToProCard from "../../components/restaurant/UpgradeToProCard";
import StarRating from "../../components/common/StarRating";

function Stars({ value, size = 14 }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => {
        const fill = Math.min(1, Math.max(0, value - (s - 1)));
        const id = `star-grad-${s}-${Math.round(fill * 100)}`;
        return (
          <svg key={s} width={size} height={size} viewBox="0 0 24 24">
            <defs>
              <linearGradient id={id}>
                <stop offset={`${fill * 100}%`} stopColor="#f59e0b" />
                <stop offset={`${fill * 100}%`} stopColor="#d1d5db" />
              </linearGradient>
            </defs>
            <path
              d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.56 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2z"
              fill={`url(#${id})`}
            />
          </svg>
        );
      })}
    </div>
  );
}

function RatingBar({ label, count, total }) {
  const percent = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="flex items-center gap-2">
      <span className="text-gray-600 text-xs w-4">{label}</span>
      <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div className="h-full bg-amber-400 rounded-full" style={{ width: `${percent}%` }} />
      </div>
      <span className="text-gray-400 text-xs w-4">{count}</span>
    </div>
  );
}

export default function Reviews() {
  const { isPro, loading: subLoading } = useSubscription();

  const {
    data: queryData,
    isLoading: loading,
    refetch,
  } = useQuery({
    queryKey: ["reviews", isPro],
    queryFn: async () => {
      const res = await getReviewsApi();
      return {
        reviews: res.reviews || [],
        groupedByItem: res.groupedByItem || [],
        totalReviews: res.totalReviews || 0,
        overallAvg: res.overallAvg || null,
      };
    },
    enabled: isPro && !subLoading,
  });

  const reviews = queryData?.reviews || [];
  const groupedByItem = queryData?.groupedByItem || [];
  const totalReviews = queryData?.totalReviews || 0;
  const overallAvg = queryData?.overallAvg || null;

  const [filter, setFilter] = useState("all");
  const [expandedItem, setExpandedItem] = useState(null);

  if (subLoading || (isPro && loading)) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
          </div>
          <div className="text-gray-600 text-sm">Loading reviews...</div>
        </div>
      </div>
    );
  }

  if (!isPro) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-gray-900 font-bold text-2xl">Reviews</h2>
          <p className="text-gray-600 text-sm mt-1">Customer ratings and feedback</p>
        </div>
        <UpgradeToProCard featureName="Customer reviews" />
      </div>
    );
  }

  const ratingDist = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
  }));

  const filteredItems = filter === "all"
    ? groupedByItem
    : groupedByItem.filter((item) => Math.round(parseFloat(item.avgRating)) === Number(filter));

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-gray-900 font-bold text-2xl">Reviews</h2>
          <p className="text-gray-600 text-sm mt-1">
            {totalReviews} total review{totalReviews !== 1 ? "s" : ""}
            {overallAvg && ` · ${overallAvg} avg`}
          </p>
        </div>

        <button
          onClick={() => refetch()}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl
                     border border-gray-200 bg-gray-50
                     hover:bg-gray-100
                     active:bg-gray-200 active:scale-95
                     text-gray-600 text-sm font-semibold
                     transition-all duration-150 ease-out cursor-pointer"
        >
          <RefreshCw size={15} strokeWidth={2.5} />
          Refresh
        </button>
      </div>

      {totalReviews === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center text-gray-600">
          <Star className="w-12 h-12 mx-auto mb-4 text-amber-400" fill="currentColor" />
          <div className="font-bold text-lg text-gray-900 mb-2">No reviews yet</div>
          <div className="text-sm">
            Customers can review dishes after their order is served.
          </div>
          <div className="text-xs mt-2 text-gray-400">
            Reviews only appear here after you mark an order as "Served" or "Completed"
          </div>
        </div>
      ) : (
        <>
          {/* Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

            {/* Overall stats */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5">
              <div className="text-gray-900 font-bold text-base mb-4">Overall Rating</div>
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <div className="text-5xl font-bold text-amber-400">{overallAvg}</div>
                  <Stars value={parseFloat(overallAvg)} size={20} />
                  <div className="text-gray-600 text-xs mt-1">{totalReviews} reviews</div>
                </div>
                <div className="flex-1 space-y-1.5">
                  {ratingDist.map(({ star, count }) => (
                    <RatingBar key={star} label={star} count={count} total={totalReviews} />
                  ))}
                </div>
              </div>
            </div>

            {/* Top rated items */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5">
              <div className="text-gray-900 font-bold text-base mb-4">Top Rated Dishes</div>
              <div className="space-y-3">
                {[...groupedByItem]
                  .sort((a, b) => parseFloat(b.avgRating) - parseFloat(a.avgRating))
                  .slice(0, 3)
                  .map((item, i) => (
                    <div key={item.itemId} className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0
                        ${i === 0 ? "bg-amber-500 text-black" : i === 1 ? "bg-gray-400 text-black" : "bg-amber-800 text-white"}`}>
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-gray-900 font-semibold text-sm truncate">{item.itemName}</div>
                        <div className="flex items-center gap-1">
                          <Stars value={parseFloat(item.avgRating)} size={12} />
                          <span className="text-gray-600 text-xs">{item.avgRating} · {item.reviewCount} reviews</span>
                        </div>
                      </div>
                    </div>
                  ))
                }
              </div>
            </div>
          </div>

          {/* Filter by rating */}
          <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
            {["all", "5", "4", "3", "2", "1"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold transition-all
                  ${filter === f
                    ? "bg-amber-500 text-black"
                    : "bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100"
                  }`}
              >
                {f === "all" ? "All Items" : `${f} ★`}
              </button>
            ))}
          </div>

          {/* Reviews grouped by item */}
          <div className="space-y-3">
            {filteredItems.length === 0 ? (
              <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center text-gray-600">
                No items with this rating
              </div>
            ) : (
              filteredItems.map((group) => (
                <div
                  key={group.itemId}
                  className="rounded-2xl border border-gray-200 bg-white overflow-hidden"
                >
                  {/* Item header — clickable to expand */}
                  <div
                    onClick={() => setExpandedItem(expandedItem === group.itemId ? null : group.itemId)}
                    className="flex items-center gap-4 p-4 cursor-pointer hover:bg-gray-50 transition-all"
                  >
                    {/* Item image */}
                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                      {group.itemImage ? (
                        <img src={group.itemImage} alt={group.itemName} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xl">🍽️</div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="text-gray-900 font-bold text-sm">{group.itemName}</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Stars value={parseFloat(group.avgRating)} size={12} />
                        <span className="text-amber-400 font-bold text-xs">{group.avgRating}</span>
                        <span className="text-gray-600 text-xs">· {group.reviewCount} review{group.reviewCount !== 1 ? "s" : ""}</span>
                      </div>
                    </div>

                    <ChevronDown
                      size={18}
                      className={`text-gray-400 transition-transform duration-200 ${expandedItem === group.itemId ? "rotate-180" : ""}`}
                    />
                  </div>

                  {/* Expanded reviews — scrollable */}
                  {expandedItem === group.itemId && (
                    <div className="border-t border-gray-200 p-4 bg-gray-50 max-h-80 overflow-y-auto space-y-3" style={{ scrollbarWidth: "thin" }}>
                      {group.reviews.map((r) => (
                        <div key={r._id} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-xs font-bold text-blue-600">
                                {(r.customerName || "G").charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <span className="text-gray-900 font-semibold text-sm block">
                                  {r.customerName ? r.customerName.charAt(0).toUpperCase() + r.customerName.slice(1).toLowerCase() : "Guest"}
                                </span>
                                <span className="text-gray-400 text-[11px]">
                                  {new Date(r.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                                </span>
                              </div>
                            </div>
                            <Stars value={r.rating} size={14} />
                          </div>
                          {r.text && (
                            <div className="mt-3 ml-10.5 flex gap-2">
                              <Quote size={14} className="text-gray-300 shrink-0 mt-0.5" />
                              <p className="text-gray-600 text-sm leading-relaxed italic">{r.text}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
