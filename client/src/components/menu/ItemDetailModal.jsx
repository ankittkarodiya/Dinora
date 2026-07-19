import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  addToCart, updateQty,
  selectItemCartQty, selectItemCartId,
} from "../../features/cart/cartSlice";
import { getItemReviewsApi } from "../../api/publicApi";

function StarDisplay({ value, size = "text-sm" }) {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map((s) => (
        <span key={s} className={`${size} ${s <= value ? "text-amber-400" : "text-gray-700"}`}>★</span>
      ))}
    </div>
  );
}

export default function ItemDetailModal({ item, restaurantIsPro, onClose, onReview }) {
  const dispatch = useDispatch();
  const cartQty = useSelector(selectItemCartQty(item._id));
  const cartId = useSelector(selectItemCartId(item._id));

  const [reviews, setReviews] = useState([]);
  const [avgRating, setAvgRating] = useState(null);
  const [qty, setQty] = useState(1);
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

  const handleAdd = () => {
    dispatch(addToCart({ ...item, qty }));
    onClose();
  };

  const handleMinus = () => dispatch(updateQty({ cartId, delta: -1 }));
  const handlePlus = () => dispatch(updateQty({ cartId, delta: 1 }));

  return (
    <div onClick={onClose} className="fixed inset-0 bg-black/80 z-100 flex items-end justify-center">
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-120 bg-[#1C1C1E] rounded-t-3xl max-h-[92vh] flex flex-col"
      >
        {/* Handle */}
        <div className="pt-3 pb-1 flex justify-center shrink-0">
          <div className="w-10 h-1 bg-white/20 rounded-full" />
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto flex-1">

          {/* Image */}
          <div className="mx-4 mt-2 rounded-2xl overflow-hidden bg-[#2C2C2E]" style={{ height: 200 }}>
            {item.image ? (
              <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-gray-600">
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
                    <span className="text-[#FF7043] text-[10px] font-bold border border-[#FF7043]/50 rounded px-1.5 py-0.5">
                      BESTSELLER
                    </span>
                  )}
                </div>
                <h2 className="text-white font-bold text-xl leading-tight">{item.name}</h2>
              </div>
              <div className="text-white font-bold text-xl shrink-0">₹{item.price}</div>
            </div>

            {/* Rating summary — only meaningful when reviews are actually enabled here */}
            {restaurantIsPro && avgRating && (
              <div className="flex items-center gap-2 mb-3">
                <StarDisplay value={Math.round(avgRating)} size="text-base" />
                <span className="text-amber-400 font-bold text-sm">{avgRating}</span>
                <span className="text-gray-500 text-xs">· {reviews.length} review{reviews.length !== 1 ? "s" : ""}</span>
              </div>
            )}

            {/* Description */}
            {item.description && (
              <p className="text-gray-400 text-sm leading-relaxed mb-4">{item.description}</p>
            )}

            {!item.isAvailable && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5 text-red-400 text-sm font-semibold mb-4 text-center">
                Currently Unavailable
              </div>
            )}

            {/* Reviews section — entire block only shows for Pro restaurants */}
            {restaurantIsPro ? (
              <div className="mt-2">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-white font-bold text-base">
                    Reviews
                    {reviews.length > 0 && (
                      <span className="text-gray-500 font-normal text-sm ml-1.5">({reviews.length})</span>
                    )}
                  </h3>
                  <button
                    onClick={(e) => { e.stopPropagation(); onReview(); }}
                    className="text-[#FC8019] text-sm font-semibold py-1.5 px-3 rounded-xl bg-[#FC8019]/10 active:bg-[#FC8019]/20"
                  >
                    ✍️ Write a Review
                  </button>
                </div>

                {loadingReviews ? (
                  <div className="text-gray-600 text-sm text-center py-4 animate-pulse">Loading reviews...</div>
                ) : reviews.length === 0 ? (
                  <div className="text-center py-6 bg-[#2C2C2E] rounded-2xl">
                    <div className="text-gray-600 text-sm">No reviews yet</div>
                    <div className="text-gray-700 text-xs mt-1">Be the first to rate this dish!</div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {reviews.map((r) => (
                      <div key={r._id} className="bg-[#2C2C2E] rounded-2xl p-3.5">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-white font-semibold text-sm">{r.customerName}</span>
                          <div className="flex items-center gap-1.5">
                            <StarDisplay value={r.rating} size="text-xs" />
                            <span className="text-gray-600 text-xs">
                              {new Date(r.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
                            </span>
                          </div>
                        </div>
                        {r.text && (
                          <p className="text-gray-400 text-xs leading-relaxed">{r.text}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              // restaurant is on Trial or Basic — reviews aren't offered at all,
              // no button, no fetched data, nothing that hints the feature exists
              <div className="mt-2 text-center text-gray-600 text-xs py-3">
                Reviews aren't available at this restaurant yet
              </div>
            )}
          </div>
        </div>

        {/* Sticky bottom — Add to cart */}
        {item.isAvailable && (
          <div className="px-4 pb-8 pt-3 border-t border-white/5 shrink-0 bg-[#1C1C1E]">
            {cartQty > 0 ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center bg-[#2C2C2E] rounded-2xl overflow-hidden">
                  <button onClick={handleMinus} className="w-12 h-12 text-[#FC8019] text-xl font-black flex items-center justify-center">−</button>
                  <span className="w-10 text-center text-white font-black">{cartQty}</span>
                  <button onClick={handlePlus} className="w-12 h-12 text-[#FC8019] text-xl font-black flex items-center justify-center">+</button>
                </div>
                <button
                  onClick={onClose}
                  className="flex-1 bg-[#FC8019] text-white rounded-2xl py-3.5 font-bold text-base"
                >
                  ₹{item.price * cartQty} in cart · Done
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="flex items-center bg-[#2C2C2E] rounded-2xl overflow-hidden">
                  <button onClick={() => setQty(Math.max(1, qty - 1))} className="w-12 h-12 text-[#FC8019] text-xl font-black flex items-center justify-center">−</button>
                  <span className="w-10 text-center text-white font-black">{qty}</span>
                  <button onClick={() => setQty(qty + 1)} className="w-12 h-12 text-[#FC8019] text-xl font-black flex items-center justify-center">+</button>
                </div>
                <button
                  onClick={handleAdd}
                  className="flex-1 bg-[#FC8019] text-white rounded-2xl py-3.5 font-bold text-base active:scale-[0.98] transition-transform"
                >
                  Add · ₹{item.price * qty}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

























// import { useState, useEffect } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import {
//   addToCart, updateQty,
//   selectItemCartQty, selectItemCartId,
// } from "../../features/cart/cartSlice";
// import { getItemReviewsApi } from "../../api/publicApi";

// function StarDisplay({ value, size = "text-sm" }) {
//   return (
//     <div className="flex gap-0.5">
//       {[1,2,3,4,5].map((s) => (
//         <span key={s} className={`${size} ${s <= value ? "text-amber-400" : "text-gray-700"}`}>★</span>
//       ))}
//     </div>
//   );
// }

// export default function ItemDetailModal({ item, onClose, onReview }) {
//   const dispatch = useDispatch();
//   const cartQty = useSelector(selectItemCartQty(item._id));
//   const cartId = useSelector(selectItemCartId(item._id));

//   const [reviews, setReviews] = useState([]);
//   const [avgRating, setAvgRating] = useState(null);
//   const [qty, setQty] = useState(1);
//   const [loadingReviews, setLoadingReviews] = useState(true);

//   useEffect(() => {
//     const fetchReviews = async () => {
//       try {
//         const data = await getItemReviewsApi(item._id);
//         setReviews(data.reviews || []);
//         setAvgRating(data.avgRating);
//       } catch {}
//       finally { setLoadingReviews(false); }
//     };
//     fetchReviews();
//   }, [item._id]);

//   const handleAdd = () => {
//     dispatch(addToCart({ ...item, qty }));
//     onClose();
//   };

//   const handleMinus = () => dispatch(updateQty({ cartId, delta: -1 }));
//   const handlePlus = () => dispatch(updateQty({ cartId, delta: 1 }));

//   return (
//     <div onClick={onClose} className="fixed inset-0 bg-black/80 z-100 flex items-end justify-center">
//       <div
//         onClick={(e) => e.stopPropagation()}
//         className="w-full max-w-120 bg-[#1C1C1E] rounded-t-3xl max-h-[92vh] flex flex-col"
//       >
//         {/* Handle */}
//         <div className="pt-3 pb-1 flex justify-center shrink-0">
//           <div className="w-10 h-1 bg-white/20 rounded-full" />
//         </div>

//         {/* Scrollable content */}
//         <div className="overflow-y-auto flex-1">

//           {/* Image */}
//           <div className="mx-4 mt-2 rounded-2xl overflow-hidden bg-[#2C2C2E]" style={{ height: 200 }}>
//             {item.image ? (
//               <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
//             ) : (
//               <div className="w-full h-full flex flex-col items-center justify-center text-gray-600">
//                 <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
//                   <rect x="3" y="3" width="18" height="18" rx="2" />
//                   <circle cx="8.5" cy="8.5" r="1.5" />
//                   <polyline points="21,15 16,10 5,21" />
//                 </svg>
//                 <span className="text-xs mt-2">No photo yet</span>
//               </div>
//             )}
//           </div>

//           <div className="px-4 pt-4 pb-6">
//             {/* Header */}
//             <div className="flex items-start justify-between gap-3 mb-3">
//               <div className="flex-1">
//                 <div className="flex items-center gap-2 mb-1.5">
//                   <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 ${item.isVeg ? "border-green-500" : "border-red-500"}`}>
//                     <div className={`w-2 h-2 rounded-full ${item.isVeg ? "bg-green-500" : "bg-red-500"}`} />
//                   </div>
//                   {item.isBestseller && (
//                     <span className="text-[#FF7043] text-[10px] font-bold border border-[#FF7043]/50 rounded px-1.5 py-0.5">
//                       BESTSELLER
//                     </span>
//                   )}
//                 </div>
//                 <h2 className="text-white font-bold text-xl leading-tight">{item.name}</h2>
//               </div>
//               <div className="text-white font-bold text-xl shrink-0">₹{item.price}</div>
//             </div>

//             {/* Rating summary */}
//             {avgRating && (
//               <div className="flex items-center gap-2 mb-3">
//                 <StarDisplay value={Math.round(avgRating)} size="text-base" />
//                 <span className="text-amber-400 font-bold text-sm">{avgRating}</span>
//                 <span className="text-gray-500 text-xs">· {reviews.length} review{reviews.length !== 1 ? "s" : ""}</span>
//               </div>
//             )}

//             {/* Description */}
//             {item.description && (
//               <p className="text-gray-400 text-sm leading-relaxed mb-4">{item.description}</p>
//             )}

//             {!item.isAvailable && (
//               <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5 text-red-400 text-sm font-semibold mb-4 text-center">
//                 Currently Unavailable
//               </div>
//             )}

//             {/* Reviews section */}
//             <div className="mt-2">
//               <div className="flex items-center justify-between mb-3">
//                 <h3 className="text-white font-bold text-base">
//                   Reviews
//                   {reviews.length > 0 && (
//                     <span className="text-gray-500 font-normal text-sm ml-1.5">({reviews.length})</span>
//                   )}
//                 </h3>
//                 <button
//                   onClick={(e) => { e.stopPropagation(); onReview(); }}
//                   className="text-[#FC8019] text-sm font-semibold py-1.5 px-3 rounded-xl bg-[#FC8019]/10 active:bg-[#FC8019]/20"
//                 >
//                   ✍️ Write a Review
//                 </button>
//               </div>

//               {loadingReviews ? (
//                 <div className="text-gray-600 text-sm text-center py-4 animate-pulse">Loading reviews...</div>
//               ) : reviews.length === 0 ? (
//                 <div className="text-center py-6 bg-[#2C2C2E] rounded-2xl">
//                   <div className="text-gray-600 text-sm">No reviews yet</div>
//                   <div className="text-gray-700 text-xs mt-1">Be the first to rate this dish!</div>
//                 </div>
//               ) : (
//                 <div className="space-y-2">
//                   {reviews.map((r) => (
//                     <div key={r._id} className="bg-[#2C2C2E] rounded-2xl p-3.5">
//                       <div className="flex items-center justify-between mb-1.5">
//                         <span className="text-white font-semibold text-sm">{r.customerName}</span>
//                         <div className="flex items-center gap-1.5">
//                           <StarDisplay value={r.rating} size="text-xs" />
//                           <span className="text-gray-600 text-xs">
//                             {new Date(r.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
//                           </span>
//                         </div>
//                       </div>
//                       {r.text && (
//                         <p className="text-gray-400 text-xs leading-relaxed">{r.text}</p>
//                       )}
//                     </div>
//                   ))}
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>

//         {/* Sticky bottom — Add to cart */}
//         {item.isAvailable && (
//           <div className="px-4 pb-8 pt-3 border-t border-white/5 shrink-0 bg-[#1C1C1E]">
//             {cartQty > 0 ? (
//               <div className="flex items-center gap-3">
//                 <div className="flex items-center bg-[#2C2C2E] rounded-2xl overflow-hidden">
//                   <button onClick={handleMinus} className="w-12 h-12 text-[#FC8019] text-xl font-black flex items-center justify-center">−</button>
//                   <span className="w-10 text-center text-white font-black">{cartQty}</span>
//                   <button onClick={handlePlus} className="w-12 h-12 text-[#FC8019] text-xl font-black flex items-center justify-center">+</button>
//                 </div>
//                 <button
//                   onClick={onClose}
//                   className="flex-1 bg-[#FC8019] text-white rounded-2xl py-3.5 font-bold text-base"
//                 >
//                   ₹{item.price * cartQty} in cart · Done
//                 </button>
//               </div>
//             ) : (
//               <div className="flex items-center gap-3">
//                 <div className="flex items-center bg-[#2C2C2E] rounded-2xl overflow-hidden">
//                   <button onClick={() => setQty(Math.max(1, qty - 1))} className="w-12 h-12 text-[#FC8019] text-xl font-black flex items-center justify-center">−</button>
//                   <span className="w-10 text-center text-white font-black">{qty}</span>
//                   <button onClick={() => setQty(qty + 1)} className="w-12 h-12 text-[#FC8019] text-xl font-black flex items-center justify-center">+</button>
//                 </div>
//                 <button
//                   onClick={handleAdd}
//                   className="flex-1 bg-[#FC8019] text-white rounded-2xl py-3.5 font-bold text-base active:scale-[0.98] transition-transform"
//                 >
//                   Add · ₹{item.price * qty}
//                 </button>
//               </div>
//             )}
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }























// // import { useState } from "react";
// // import { useDispatch, useSelector } from "react-redux";
// // import { addToCart } from "../../features/cart/cartSlice";
// // import { selectReviewsByItem, selectAvgRating } from "../../features/reviews/reviewSlice";
// // import VegIcon from "../common/VegIcon";
// // import StarRating from "../common/StarRating";

// // export default function ItemDetailModal({ item, onClose, onReview }) {
// //   const dispatch = useDispatch();
// //   const [qty, setQty] = useState(1);
// //   const reviews = useSelector(selectReviewsByItem(item.id));
// //   const avg = useSelector(selectAvgRating(item.id));

// //   const handleAdd = () => {
// //     dispatch(addToCart({ ...item, qty }));
// //     onClose();
// //   };

// //   return (
// //     <div
// //       onClick={onClose}
// //       className="fixed inset-0 bg-black/80 z-100 flex items-end justify-center"
// //     >
// //       <div
// //         onClick={(e) => e.stopPropagation()}
// //         className="w-full max-w-120 bg-linear-to-b from-slate-800 to-slate-900 border-t border-white/10 rounded-t-3xl p-6 max-h-[85vh] overflow-y-auto"
// //       >
// //         {/* Handle */}
// //         <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-5" />

// //         {/* Header */}
// //         <div className="flex items-center gap-2 mb-2">
// //           <VegIcon isVeg={item.isVeg} />
// //           <h2 className="text-white font-bold text-xl">{item.name}</h2>
// //         </div>

// //         {avg && (
// //           <div className="flex items-center gap-2 mb-3">
// //             <StarRating value={Math.round(avg)} size="text-sm" count={reviews.length} />
// //             <span className="text-amber-400 font-bold text-sm">{avg}</span>
// //           </div>
// //         )}

// //         <p className="text-slate-300 text-sm leading-relaxed mb-4">{item.description}</p>

// //         {/* Recent reviews */}
// //         {reviews.length > 0 && (
// //           <div className="rounded-2xl border border-white/10 bg-white/5 p-4 mb-4">
// //             <div className="text-slate-400 text-xs font-bold uppercase tracking-wide mb-3">
// //               Recent Reviews
// //             </div>
// //             {reviews.slice(0, 2).map((r) => (
// //               <div key={r.id} className="mb-3 last:mb-0">
// //                 <div className="flex justify-between items-center mb-1">
// //                   <span className="text-white text-sm font-semibold">{r.userName}</span>
// //                   <StarRating value={r.rating} size="text-[11px]" />
// //                 </div>
// //                 {r.text && <p className="text-slate-400 text-xs">{r.text}</p>}
// //               </div>
// //             ))}
// //           </div>
// //         )}

// //         {/* Rate button */}
// //         <button
// //           onClick={onReview}
// //           className="w-full py-2.5 rounded-xl border border-white/20 bg-white/10 text-white text-sm font-semibold hover:bg-white/20 transition-all mb-4"
// //         >
// //           ★ Rate this dish {reviews.length > 0 ? `· ${reviews.length} reviews` : ""}
// //         </button>

// //         {/* Qty + Add */}
// //         {item.isAvailable ? (
// //           <div className="flex items-center gap-3">
// //             <div className="flex items-center rounded-xl border border-white/20 bg-white/10 overflow-hidden">
// //               <button onClick={() => setQty(Math.max(1, qty - 1))}
// //                 className="w-10 h-11 text-blue-400 text-xl font-bold hover:bg-white/10 transition-colors">
// //                 −
// //               </button>
// //               <span className="w-8 text-center text-white font-bold">{qty}</span>
// //               <button onClick={() => setQty(qty + 1)}
// //                 className="w-10 h-11 text-blue-400 text-xl font-bold hover:bg-white/10 transition-colors">
// //                 +
// //               </button>
// //             </div>
// //             <button onClick={handleAdd}
// //               className="flex-1 h-11 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-all hover:-translate-y-0.5">
// //               Add to Cart — ₹{item.price * qty}
// //             </button>
// //           </div>
// //         ) : (
// //           <div className="text-center py-3 text-red-400 font-bold">Currently Unavailable</div>
// //         )}
// //       </div>
// //     </div>
// //   );
// // }