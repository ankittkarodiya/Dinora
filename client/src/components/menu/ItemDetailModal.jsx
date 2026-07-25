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
  const hasHalfFull = !!item.halfPrice;

  // ordinary items only
  const cartQty = useSelector(selectItemCartQty(item._id));
  const cartId = useSelector(selectItemCartId(item._id));

  // half/full items — each portion tracked and controlled independently,
  // same pattern as ItemRow's sheet, so both can be added at once
  const halfQty = useSelector(selectItemCartQty(item._id, "half"));
  const fullQty = useSelector(selectItemCartQty(item._id, "full"));
  const halfCartId = useSelector(selectItemCartId(item._id, "half"));
  const fullCartId = useSelector(selectItemCartId(item._id, "full"));

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

  const addPortion = (portion) => {
    const price = portion === "half" ? item.halfPrice : item.price;
    dispatch(addToCart({ ...item, price, portion, qty: 1 }));
  };
  const adjustPortion = (portion, delta) => {
    const targetCartId = portion === "half" ? halfCartId : fullCartId;
    dispatch(updateQty({ cartId: targetCartId, delta }));
  };

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
              {!hasHalfFull && (
                <div className="text-white font-bold text-xl shrink-0">₹{item.price}</div>
              )}
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

            {/* ← new: Half / Full rows, each independently addable — replaces
                the old toggle-then-single-price approach entirely */}
            {hasHalfFull && item.isAvailable && (
              <div className="mb-5">
                <div className="text-gray-500 text-xs font-bold uppercase tracking-wide mb-2">
                  Choose Portion
                </div>
                <div className="flex items-center justify-between px-4 py-3.5 rounded-2xl border border-white/10 bg-white/5 mb-2.5">
                  <div>
                    <div className="text-white font-medium text-sm">Half</div>
                    <div className="text-gray-500 text-xs mt-0.5">₹{item.halfPrice}</div>
                  </div>
                  {halfQty > 0 ? (
                    <div className="flex items-center bg-[#FC8019] rounded-xl overflow-hidden">
                      <button onClick={() => adjustPortion("half", -1)} className="w-9 h-9 text-white font-black text-lg flex items-center justify-center active:bg-[#e07018]">−</button>
                      <span className="w-7 text-center text-white font-black text-sm">{halfQty}</span>
                      <button onClick={() => adjustPortion("half", 1)} className="w-9 h-9 text-white font-black text-lg flex items-center justify-center active:bg-[#e07018]">+</button>
                    </div>
                  ) : (
                    <button onClick={() => addPortion("half")} className="bg-[#1C1C1E] border-2 border-[#FC8019] text-[#FC8019] font-black text-xs px-5 py-2 rounded-xl active:bg-[#FC8019] active:text-white transition-colors">
                      ADD
                    </button>
                  )}
                </div>
                <div className="flex items-center justify-between px-4 py-3.5 rounded-2xl border border-white/10 bg-white/5">
                  <div>
                    <div className="text-white font-medium text-sm">Full</div>
                    <div className="text-gray-500 text-xs mt-0.5">₹{item.price}</div>
                  </div>
                  {fullQty > 0 ? (
                    <div className="flex items-center bg-[#FC8019] rounded-xl overflow-hidden">
                      <button onClick={() => adjustPortion("full", -1)} className="w-9 h-9 text-white font-black text-lg flex items-center justify-center active:bg-[#e07018]">−</button>
                      <span className="w-7 text-center text-white font-black text-sm">{fullQty}</span>
                      <button onClick={() => adjustPortion("full", 1)} className="w-9 h-9 text-white font-black text-lg flex items-center justify-center active:bg-[#e07018]">+</button>
                    </div>
                  ) : (
                    <button onClick={() => addPortion("full")} className="bg-[#1C1C1E] border-2 border-[#FC8019] text-[#FC8019] font-black text-xs px-5 py-2 rounded-xl active:bg-[#FC8019] active:text-white transition-colors">
                      ADD
                    </button>
                  )}
                </div>
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

        {/* Sticky bottom — Add to cart. Only shown for ordinary (non half/full)
            items, since half/full items add directly via the rows above */}
        {item.isAvailable && !hasHalfFull && (
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

        {/* For half/full items, just give a simple Done/Close button instead,
            since adding already happened inline in the rows above */}
        {item.isAvailable && hasHalfFull && (
          <div className="px-4 pb-8 pt-3 border-t border-white/5 shrink-0 bg-[#1C1C1E]">
            <button
              onClick={onClose}
              className="w-full bg-white/10 text-gray-300 rounded-2xl py-3.5 font-bold text-base"
            >
              Done
            </button>
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

// export default function ItemDetailModal({ item, restaurantIsPro, onClose, onReview }) {
//   const dispatch = useDispatch();

//   // ← NEW: which portion is currently selected — only relevant when the
//   // item has halfPrice set. Defaults to "full" so the header price shown
//   // on open matches item.price, same as it always has for every other item.
//   const [portion, setPortion] = useState("full");
//   const hasHalfFull = !!item.halfPrice;
//   const activePrice = hasHalfFull && portion === "half" ? item.halfPrice : item.price;

//   const cartQty = useSelector(selectItemCartQty(item._id, hasHalfFull ? portion : null));
//   const cartId = useSelector(selectItemCartId(item._id, hasHalfFull ? portion : null));

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
//     dispatch(addToCart({
//       ...item,
//       price: activePrice, // ← the correct chosen-portion price, not the raw item.price
//       portion: hasHalfFull ? portion : null,
//       qty,
//     }));
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
//               <div className="text-white font-bold text-xl shrink-0">₹{activePrice}</div>
//             </div>

//             {/* ← NEW: Half / Full portion selector — only rendered when the item has halfPrice */}
//             {hasHalfFull && (
//               <div className="flex items-center gap-2 mb-4">
//                 <button
//                   onClick={() => setPortion("half")}
//                   className={`flex-1 py-2.5 rounded-xl text-sm font-bold border transition-colors ${
//                     portion === "half"
//                       ? "bg-[#FC8019] border-[#FC8019] text-white"
//                       : "bg-[#2C2C2E] border-white/10 text-gray-400"
//                   }`}
//                 >
//                   Half · ₹{item.halfPrice}
//                 </button>
//                 <button
//                   onClick={() => setPortion("full")}
//                   className={`flex-1 py-2.5 rounded-xl text-sm font-bold border transition-colors ${
//                     portion === "full"
//                       ? "bg-[#FC8019] border-[#FC8019] text-white"
//                       : "bg-[#2C2C2E] border-white/10 text-gray-400"
//                   }`}
//                 >
//                   Full · ₹{item.price}
//                 </button>
//               </div>
//             )}

//             {/* Rating summary — only meaningful when reviews are actually enabled here */}
//             {restaurantIsPro && avgRating && (
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

//             {/* Reviews section — entire block only shows for Pro restaurants */}
//             {restaurantIsPro ? (
//               <div className="mt-2">
//                 <div className="flex items-center justify-between mb-3">
//                   <h3 className="text-white font-bold text-base">
//                     Reviews
//                     {reviews.length > 0 && (
//                       <span className="text-gray-500 font-normal text-sm ml-1.5">({reviews.length})</span>
//                     )}
//                   </h3>
//                   <button
//                     onClick={(e) => { e.stopPropagation(); onReview(); }}
//                     className="text-[#FC8019] text-sm font-semibold py-1.5 px-3 rounded-xl bg-[#FC8019]/10 active:bg-[#FC8019]/20"
//                   >
//                     ✍️ Write a Review
//                   </button>
//                 </div>

//                 {loadingReviews ? (
//                   <div className="text-gray-600 text-sm text-center py-4 animate-pulse">Loading reviews...</div>
//                 ) : reviews.length === 0 ? (
//                   <div className="text-center py-6 bg-[#2C2C2E] rounded-2xl">
//                     <div className="text-gray-600 text-sm">No reviews yet</div>
//                     <div className="text-gray-700 text-xs mt-1">Be the first to rate this dish!</div>
//                   </div>
//                 ) : (
//                   <div className="space-y-2">
//                     {reviews.map((r) => (
//                       <div key={r._id} className="bg-[#2C2C2E] rounded-2xl p-3.5">
//                         <div className="flex items-center justify-between mb-1.5">
//                           <span className="text-white font-semibold text-sm">{r.customerName}</span>
//                           <div className="flex items-center gap-1.5">
//                             <StarDisplay value={r.rating} size="text-xs" />
//                             <span className="text-gray-600 text-xs">
//                               {new Date(r.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
//                             </span>
//                           </div>
//                         </div>
//                         {r.text && (
//                           <p className="text-gray-400 text-xs leading-relaxed">{r.text}</p>
//                         )}
//                       </div>
//                     ))}
//                   </div>
//                 )}
//               </div>
//             ) : (
//               <div className="mt-2 text-center text-gray-600 text-xs py-3">
//                 Reviews aren't available at this restaurant yet
//               </div>
//             )}
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
//                   ₹{activePrice * cartQty} in cart · Done
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
//                   Add · ₹{activePrice * qty}
//                 </button>
//               </div>
//             )}
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }

























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

// export default function ItemDetailModal({ item, restaurantIsPro, onClose, onReview }) {
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

//             {/* Rating summary — only meaningful when reviews are actually enabled here */}
//             {restaurantIsPro && avgRating && (
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

//             {/* Reviews section — entire block only shows for Pro restaurants */}
//             {restaurantIsPro ? (
//               <div className="mt-2">
//                 <div className="flex items-center justify-between mb-3">
//                   <h3 className="text-white font-bold text-base">
//                     Reviews
//                     {reviews.length > 0 && (
//                       <span className="text-gray-500 font-normal text-sm ml-1.5">({reviews.length})</span>
//                     )}
//                   </h3>
//                   <button
//                     onClick={(e) => { e.stopPropagation(); onReview(); }}
//                     className="text-[#FC8019] text-sm font-semibold py-1.5 px-3 rounded-xl bg-[#FC8019]/10 active:bg-[#FC8019]/20"
//                   >
//                     ✍️ Write a Review
//                   </button>
//                 </div>

//                 {loadingReviews ? (
//                   <div className="text-gray-600 text-sm text-center py-4 animate-pulse">Loading reviews...</div>
//                 ) : reviews.length === 0 ? (
//                   <div className="text-center py-6 bg-[#2C2C2E] rounded-2xl">
//                     <div className="text-gray-600 text-sm">No reviews yet</div>
//                     <div className="text-gray-700 text-xs mt-1">Be the first to rate this dish!</div>
//                   </div>
//                 ) : (
//                   <div className="space-y-2">
//                     {reviews.map((r) => (
//                       <div key={r._id} className="bg-[#2C2C2E] rounded-2xl p-3.5">
//                         <div className="flex items-center justify-between mb-1.5">
//                           <span className="text-white font-semibold text-sm">{r.customerName}</span>
//                           <div className="flex items-center gap-1.5">
//                             <StarDisplay value={r.rating} size="text-xs" />
//                             <span className="text-gray-600 text-xs">
//                               {new Date(r.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
//                             </span>
//                           </div>
//                         </div>
//                         {r.text && (
//                           <p className="text-gray-400 text-xs leading-relaxed">{r.text}</p>
//                         )}
//                       </div>
//                     ))}
//                   </div>
//                 )}
//               </div>
//             ) : (
//               // restaurant is on Trial or Basic — reviews aren't offered at all,
//               // no button, no fetched data, nothing that hints the feature exists
//               <div className="mt-2 text-center text-gray-600 text-xs py-3">
//                 Reviews aren't available at this restaurant yet
//               </div>
//             )}
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