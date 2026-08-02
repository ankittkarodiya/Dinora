import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getReviewsApi } from "../../api/reviewApi";
import toast from "react-hot-toast";

import { useSubscription } from "../../hooks/useSubscription";
import UpgradeToProCard from "../../components/restaurant/UpgradeToProCard";
import StarRating from "../../components/common/StarRating";

function Stars({ value, size = "text-sm" }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <span key={s} className={`${size} ${s <= value ? "text-amber-400" : "text-white/20"}`}>★</span>
      ))}
    </div>
  );
}

function RatingBar({ label, count, total }) {
  const percent = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="flex items-center gap-2">
      <span className="text-slate-400 text-xs w-4">{label}</span>
      <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
        <div className="h-full bg-amber-400 rounded-full" style={{ width: `${percent}%` }} />
      </div>
      <span className="text-slate-500 text-xs w-4">{count}</span>
    </div>
  );
}

export default function Reviews() {
  const { isPro, loading: subLoading } = useSubscription();

  // ── THE CHANGE: replaces the four separate useState calls (reviews,
  // groupedByItem, totalReviews, overallAvg), lastFetchKeyRef, its
  // useEffect, and fetchReviews with one useQuery. Cached under
  // ["reviews", isPro] — revisiting this page within 30s shows data
  // instantly, no spinner. `enabled: isPro && !subLoading` means the
  // endpoint is never called at all for a non-Pro restaurant, exactly
  // matching the original's explicit guard.
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

  const [filter, setFilter] = useState("all"); // "all" | "5" | "4" | "3" | "2" | "1"
  const [expandedItem, setExpandedItem] = useState(null);

  // ── hard gate: render this BEFORE any data-dependent JSX ──────────
  if (subLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-400 text-sm animate-pulse">Loading...</div>
      </div>
    );
  }

  if (!isPro) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-white font-bold text-2xl">Reviews</h2>
          <p className="text-slate-400 text-sm mt-1">Customer ratings and feedback</p>
        </div>
        <UpgradeToProCard featureName="Customer reviews" />
      </div>
    );
  }

  // rating distribution
  const ratingDist = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
  }));

  const filteredItems = filter === "all"
    ? groupedByItem
    : groupedByItem.filter((item) => Math.round(parseFloat(item.avgRating)) === Number(filter));

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <div className="text-4xl mb-4 animate-pulse">⭐</div>
        <div className="text-slate-400 text-sm">Loading reviews...</div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-white font-bold text-2xl">Reviews</h2>
          <p className="text-slate-400 text-sm mt-1">
            {totalReviews} total review{totalReviews !== 1 ? "s" : ""}
            {overallAvg && ` · ${overallAvg} avg`}
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="px-4 py-2 rounded-xl border border-white/20 bg-white/10 hover:bg-white/20 text-slate-300 text-sm font-semibold transition-all"
        >
          🔄 Refresh
        </button>
      </div>

      {totalReviews === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-12 text-center text-slate-400">
          <div className="text-5xl mb-4">⭐</div>
          <div className="font-bold text-lg text-white mb-2">No reviews yet</div>
          <div className="text-sm">
            Customers can review dishes after their order is served.
          </div>
          <div className="text-xs mt-2 text-slate-500">
            Reviews only appear here after you mark an order as "Served" or "Completed"
          </div>
        </div>
      ) : (
        <>
          {/* Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

            {/* Overall stats */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="text-white font-bold text-base mb-4">Overall Rating</div>
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <div className="text-5xl font-bold text-amber-400">{overallAvg}</div>
                  <Stars value={Math.round(overallAvg)} size="text-lg" />
                  <div className="text-slate-400 text-xs mt-1">{totalReviews} reviews</div>
                </div>
                <div className="flex-1 space-y-1.5">
                  {ratingDist.map(({ star, count }) => (
                    <RatingBar key={star} label={star} count={count} total={totalReviews} />
                  ))}
                </div>
              </div>
            </div>

            {/* Top rated items */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="text-white font-bold text-base mb-4">Top Rated Dishes</div>
              <div className="space-y-3">
                {[...groupedByItem]
                  .sort((a, b) => parseFloat(b.avgRating) - parseFloat(a.avgRating))
                  .slice(0, 3)
                  .map((item, i) => (
                    <div key={item.itemId} className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0
                        ${i === 0 ? "bg-amber-500 text-black" : i === 1 ? "bg-slate-400 text-black" : "bg-amber-800 text-white"}`}>
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-white font-semibold text-sm truncate">{item.itemName}</div>
                        <div className="flex items-center gap-1">
                          <Stars value={Math.round(item.avgRating)} size="text-xs" />
                          <span className="text-slate-400 text-xs">{item.avgRating} · {item.reviewCount} reviews</span>
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
                    : "bg-white/10 text-slate-300 border border-white/10 hover:bg-white/20"
                  }`}
              >
                {f === "all" ? "All Items" : `${f} ★`}
              </button>
            ))}
          </div>

          {/* Reviews grouped by item */}
          <div className="space-y-3">
            {filteredItems.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-slate-400">
                No items with this rating
              </div>
            ) : (
              filteredItems.map((group) => (
                <div
                  key={group.itemId}
                  className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden"
                >
                  {/* Item header — clickable to expand */}
                  <div
                    onClick={() => setExpandedItem(expandedItem === group.itemId ? null : group.itemId)}
                    className="flex items-center gap-4 p-4 cursor-pointer hover:bg-white/5 transition-all"
                  >
                    {/* Item image */}
                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-white/10 shrink-0">
                      {group.itemImage ? (
                        <img src={group.itemImage} alt={group.itemName} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xl">🍽️</div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="text-white font-bold text-sm">{group.itemName}</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Stars value={Math.round(group.avgRating)} size="text-xs" />
                        <span className="text-amber-400 font-bold text-xs">{group.avgRating}</span>
                        <span className="text-slate-400 text-xs">· {group.reviewCount} review{group.reviewCount !== 1 ? "s" : ""}</span>
                      </div>
                    </div>

                    <span className="text-slate-500 text-sm transition-transform duration-200"
                      style={{ transform: expandedItem === group.itemId ? "rotate(180deg)" : "none" }}>
                      ▼
                    </span>
                  </div>

                  {/* Expanded reviews */}
                  {expandedItem === group.itemId && (
                    <div className="border-t border-white/10 divide-y divide-white/5">
                      {group.reviews.map((r) => (
                        <div key={r._id} className="px-4 py-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-white font-semibold text-sm">{r.customerName}</span>
                            <div className="flex items-center gap-2">
                              <Stars value={r.rating} size="text-xs" />
                              <span className="text-slate-500 text-xs">
                                {new Date(r.createdAt).toLocaleDateString("en-IN")}
                              </span>
                            </div>
                          </div>
                          {r.text && (
                            <p className="text-slate-300 text-sm mt-1 leading-relaxed">{r.text}</p>
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

























// import { useState, useEffect, useRef } from "react";
// import { getReviewsApi } from "../../api/reviewApi";
// import toast from "react-hot-toast";

// import { useSubscription } from "../../hooks/useSubscription";
// import UpgradeToProCard from "../../components/restaurant/UpgradeToProCard";
// import StarRating from "../../components/common/StarRating";

// function Stars({ value, size = "text-sm" }) {
//   return (
//     <div className="flex gap-0.5">
//       {[1, 2, 3, 4, 5].map((s) => (
//         <span key={s} className={`${size} ${s <= value ? "text-amber-400" : "text-white/20"}`}>★</span>
//       ))}
//     </div>
//   );
// }

// function RatingBar({ label, count, total }) {
//   const percent = total > 0 ? (count / total) * 100 : 0;
//   return (
//     <div className="flex items-center gap-2">
//       <span className="text-slate-400 text-xs w-4">{label}</span>
//       <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
//         <div className="h-full bg-amber-400 rounded-full" style={{ width: `${percent}%` }} />
//       </div>
//       <span className="text-slate-500 text-xs w-4">{count}</span>
//     </div>
//   );
// }

// export default function Reviews() {
//   const [data, setData] = useState({
//     reviews: [],
//     groupedByItem: [],
//     totalReviews: 0,
//     overallAvg: null,
//   });

//   const { isPro, loading: subLoading } = useSubscription();
//   const [reviews, setReviews] = useState([]);
//   const [groupedByItem, setGroupedByItem] = useState([]);
//   const [totalReviews, setTotalReviews] = useState(0);
//   const [overallAvg, setOverallAvg] = useState(null);

//   const [loading, setLoading] = useState(true);
//   const [filter, setFilter] = useState("all"); // "all" | "5" | "4" | "3" | "2" | "1"
//   const [expandedItem, setExpandedItem] = useState(null);

//   // useEffect(() => {
//   //   // subscription status hasn't resolved yet — do nothing, wait
//   //   if (subLoading) return;

//   //   // subscription resolved and it's NOT pro — never call the endpoint, ever
//   //   if (!isPro) {
//   //     setLoading(false);
//   //     return;
//   //   }

//   //   fetchReviews();
//   //   // eslint-disable-next-line react-hooks/exhaustive-deps
//   // }, [subLoading, isPro]);

// // inside the component:
// const lastFetchKeyRef = useRef(null);

// useEffect(() => {
//   if (subLoading) return;

//   if (!isPro) {
//     setLoading(false);
//     return;
//   }

//   // StrictMode fires this effect twice with the exact same [subLoading, isPro]
//   // values on mount — skip the second, identical invocation, but still allow
//   // a real refetch if isPro or subLoading genuinely changes later
//   const currentKey = `${subLoading}-${isPro}`;
//   if (lastFetchKeyRef.current === currentKey) return;
//   lastFetchKeyRef.current = currentKey;

//   fetchReviews();
//   // eslint-disable-next-line react-hooks/exhaustive-deps
// }, [subLoading, isPro]);

//   // useEffect(() => {
//   //   fetchReviews();
//   // }, []);

//   // const fetchReviews = async () => {
//   //   setLoading(true);
//   //   try {
//   //     const res = await getReviewsApi();
//   //     setData({
//   //       reviews: res.reviews || [],
//   //       groupedByItem: res.groupedByItem || [],
//   //       totalReviews: res.totalReviews || 0,
//   //       overallAvg: res.overallAvg || null,
//   //     });
//   //   } catch (error) {
//   //     toast.error("Failed to load reviews");
//   //   } finally {
//   //     setLoading(false);
//   //   }
//   // };

//   const fetchReviews = async () => {
//     setLoading(true);
//     try {
//       const res = await getReviewsApi();
//       setReviews(res.reviews || []);
//       setGroupedByItem(res.groupedByItem || []);
//       setTotalReviews(res.totalReviews || 0);
//       setOverallAvg(res.overallAvg || null);
//     } catch {
//       // silent — the upgrade card below explains everything already
//     } finally {
//       setLoading(false);
//     }
//   };

//   // ── hard gate: render this BEFORE any data-dependent JSX ──────────
//   if (subLoading) {
//     return (
//       <div className="flex items-center justify-center h-64">
//         <div className="text-slate-400 text-sm animate-pulse">Loading...</div>
//       </div>
//     );
//   }

//   if (!isPro) {
//     return (
//       <div className="space-y-6">
//         <div>
//           <h2 className="text-white font-bold text-2xl">Reviews</h2>
//           <p className="text-slate-400 text-sm mt-1">Customer ratings and feedback</p>
//         </div>
//         <UpgradeToProCard featureName="Customer reviews" />
//       </div>
//     );
//   }

//   // const { reviews, groupedByItem, totalReviews, overallAvg } = data;

//   // rating distribution
//   const ratingDist = [5, 4, 3, 2, 1].map((star) => ({
//     star,
//     count: reviews.filter((r) => r.rating === star).length,
//   }));

//   const filteredItems = filter === "all"
//     ? groupedByItem
//     : groupedByItem.filter((item) => Math.round(parseFloat(item.avgRating)) === Number(filter));

//   if (loading) return (
//     <div className="flex items-center justify-center h-64">
//       <div className="text-center">
//         <div className="text-4xl mb-4 animate-pulse">⭐</div>
//         <div className="text-slate-400 text-sm">Loading reviews...</div>
//       </div>
//     </div>
//   );

//   return (
//     <div className="space-y-6">

//       {/* Header */}
//       <div className="flex items-center justify-between">
//         <div>
//           <h2 className="text-white font-bold text-2xl">Reviews</h2>
//           <p className="text-slate-400 text-sm mt-1">
//             {totalReviews} total review{totalReviews !== 1 ? "s" : ""}
//             {overallAvg && ` · ${overallAvg} avg`}
//           </p>
//         </div>
//         <button
//           onClick={fetchReviews}
//           className="px-4 py-2 rounded-xl border border-white/20 bg-white/10 hover:bg-white/20 text-slate-300 text-sm font-semibold transition-all"
//         >
//           🔄 Refresh
//         </button>
//       </div>

//       {totalReviews === 0 ? (
//         <div className="rounded-2xl border border-white/10 bg-white/5 p-12 text-center text-slate-400">
//           <div className="text-5xl mb-4">⭐</div>
//           <div className="font-bold text-lg text-white mb-2">No reviews yet</div>
//           <div className="text-sm">
//             Customers can review dishes after their order is served.
//           </div>
//           <div className="text-xs mt-2 text-slate-500">
//             Reviews only appear here after you mark an order as "Served" or "Completed"
//           </div>
//         </div>
//       ) : (
//         <>
//           {/* Overview */}
//           <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

//             {/* Overall stats */}
//             <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
//               <div className="text-white font-bold text-base mb-4">Overall Rating</div>
//               <div className="flex items-center gap-4">
//                 <div className="text-center">
//                   <div className="text-5xl font-bold text-amber-400">{overallAvg}</div>
//                   <Stars value={Math.round(overallAvg)} size="text-lg" />
//                   <div className="text-slate-400 text-xs mt-1">{totalReviews} reviews</div>
//                 </div>
//                 <div className="flex-1 space-y-1.5">
//                   {ratingDist.map(({ star, count }) => (
//                     <RatingBar key={star} label={star} count={count} total={totalReviews} />
//                   ))}
//                 </div>
//               </div>
//             </div>

//             {/* Top rated items */}
//             <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
//               <div className="text-white font-bold text-base mb-4">Top Rated Dishes</div>
//               <div className="space-y-3">
//                 {[...groupedByItem]
//                   .sort((a, b) => parseFloat(b.avgRating) - parseFloat(a.avgRating))
//                   .slice(0, 3)
//                   .map((item, i) => (
//                     <div key={item.itemId} className="flex items-center gap-3">
//                       <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0
//                         ${i === 0 ? "bg-amber-500 text-black" : i === 1 ? "bg-slate-400 text-black" : "bg-amber-800 text-white"}`}>
//                         {i + 1}
//                       </div>
//                       <div className="flex-1 min-w-0">
//                         <div className="text-white font-semibold text-sm truncate">{item.itemName}</div>
//                         <div className="flex items-center gap-1">
//                           <Stars value={Math.round(item.avgRating)} size="text-xs" />
//                           <span className="text-slate-400 text-xs">{item.avgRating} · {item.reviewCount} reviews</span>
//                         </div>
//                       </div>
//                     </div>
//                   ))
//                 }
//               </div>
//             </div>
//           </div>

//           {/* Filter by rating */}
//           <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
//             {["all", "5", "4", "3", "2", "1"].map((f) => (
//               <button
//                 key={f}
//                 onClick={() => setFilter(f)}
//                 className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold transition-all
//                   ${filter === f
//                     ? "bg-amber-500 text-black"
//                     : "bg-white/10 text-slate-300 border border-white/10 hover:bg-white/20"
//                   }`}
//               >
//                 {f === "all" ? "All Items" : `${f} ★`}
//               </button>
//             ))}
//           </div>

//           {/* Reviews grouped by item */}
//           <div className="space-y-3">
//             {filteredItems.length === 0 ? (
//               <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-slate-400">
//                 No items with this rating
//               </div>
//             ) : (
//               filteredItems.map((group) => (
//                 <div
//                   key={group.itemId}
//                   className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden"
//                 >
//                   {/* Item header — clickable to expand */}
//                   <div
//                     onClick={() => setExpandedItem(expandedItem === group.itemId ? null : group.itemId)}
//                     className="flex items-center gap-4 p-4 cursor-pointer hover:bg-white/5 transition-all"
//                   >
//                     {/* Item image */}
//                     <div className="w-12 h-12 rounded-xl overflow-hidden bg-white/10 shrink-0">
//                       {group.itemImage ? (
//                         <img src={group.itemImage} alt={group.itemName} className="w-full h-full object-cover" />
//                       ) : (
//                         <div className="w-full h-full flex items-center justify-center text-xl">🍽️</div>
//                       )}
//                     </div>

//                     <div className="flex-1 min-w-0">
//                       <div className="text-white font-bold text-sm">{group.itemName}</div>
//                       <div className="flex items-center gap-2 mt-0.5">
//                         <Stars value={Math.round(group.avgRating)} size="text-xs" />
//                         <span className="text-amber-400 font-bold text-xs">{group.avgRating}</span>
//                         <span className="text-slate-400 text-xs">· {group.reviewCount} review{group.reviewCount !== 1 ? "s" : ""}</span>
//                       </div>
//                     </div>

//                     <span className="text-slate-500 text-sm transition-transform duration-200"
//                       style={{ transform: expandedItem === group.itemId ? "rotate(180deg)" : "none" }}>
//                       ▼
//                     </span>
//                   </div>

//                   {/* Expanded reviews */}
//                   {expandedItem === group.itemId && (
//                     <div className="border-t border-white/10 divide-y divide-white/5">
//                       {group.reviews.map((r) => (
//                         <div key={r._id} className="px-4 py-3">
//                           <div className="flex items-center justify-between mb-1">
//                             <span className="text-white font-semibold text-sm">{r.customerName}</span>
//                             <div className="flex items-center gap-2">
//                               <Stars value={r.rating} size="text-xs" />
//                               <span className="text-slate-500 text-xs">
//                                 {new Date(r.createdAt).toLocaleDateString("en-IN")}
//                               </span>
//                             </div>
//                           </div>
//                           {r.text && (
//                             <p className="text-slate-300 text-sm mt-1 leading-relaxed">{r.text}</p>
//                           )}
//                         </div>
//                       ))}
//                     </div>
//                   )}
//                 </div>
//               ))
//             )}
//           </div>
//         </>
//       )}
//     </div>
//   );
// }