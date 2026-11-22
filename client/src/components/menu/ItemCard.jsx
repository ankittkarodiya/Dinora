import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  addToCart,
  updateQty,
  selectItemCartQty,
  selectItemCartId,
  selectItemTotalCartQty,
} from "../../features/cart/cartSlice";
import { optimizeImage } from "../../utils/imageOptimize";

/* ── veg / non-veg marker ── */
function VegMark({ isVeg }) {
  const c = isVeg ? "border-ok" : "border-danger";
  const d = isVeg ? "bg-ok" : "bg-danger";
  return (
    <span className={`w-4 h-4 rounded-[3px] border-[1.5px] ${c} flex items-center justify-center shrink-0`}>
      <span className={`w-2 h-2 rounded-full ${d}`} />
    </span>
  );
}

/* ── +/- stepper ── */
function Stepper({ qty, onMinus, onPlus, small = false }) {
  const b = small ? "w-7 h-7 text-sm" : "w-8 h-8 text-base";
  return (
    <div className="inline-flex items-center rounded-lg bg-accent text-white overflow-hidden shadow-sm">
      <button onClick={onMinus} className={`${b} font-bold flex items-center justify-center active:bg-accent-hover`}>−</button>
      <span className="min-w-5 text-center font-bold text-xs">{qty}</span>
      <button onClick={onPlus} className={`${b} font-bold flex items-center justify-center active:bg-accent-hover`}>+</button>
    </div>
  );
}

/* ── ADD button ── */
const AddButton = ({ onClick, small = false }) => (
  <button
    onClick={onClick}
    className={`border border-accent text-accent bg-surface font-bold rounded-lg active:bg-accent active:text-white transition-colors ${
      small ? "text-[11px] px-4 py-1" : "text-xs px-5 py-1.5"
    }`}
  >
    ADD
  </button>
);

/* ══════════════════════════════════════════════════════════════
   ITEM CARD — Swiggy-style vertical card for 2-column grid
   Photo on top → veg mark + bestseller + rating → name →
   price (LEFT) + ADD button (RIGHT) — same row, NOT overlapping photo
   No description on card (shows in ItemDetailModal on click)
   ══════════════════════════════════════════════════════════════ */
export default function ItemCard({ item, onOpen }) {
  const dispatch = useDispatch();
  const hasHalfFull = !!item.halfPrice;

  const cartQty  = useSelector(selectItemCartQty(item._id));
  const cartId   = useSelector(selectItemCartId(item._id));

  const halfQty    = useSelector(selectItemCartQty(item._id, "half"));
  const fullQty    = useSelector(selectItemCartQty(item._id, "full"));
  const totalQty   = useSelector(selectItemTotalCartQty(item._id));
  const halfCartId = useSelector(selectItemCartId(item._id, "half"));
  const fullCartId = useSelector(selectItemCartId(item._id, "full"));

  const [showSheet, setShowSheet] = useState(false);

  const stop = (fn) => (e) => { e.stopPropagation(); fn(e); };

  const add        = stop(() => dispatch(addToCart({ ...item, qty: 1 })));
  const minus      = stop(() => dispatch(updateQty({ cartId, delta: -1 })));
  const openSheet  = stop(() => setShowSheet(true));
  const addPortion = (portion) =>
    dispatch(addToCart({ ...item, price: portion === "half" ? item.halfPrice : item.price, portion, qty: 1 }));
  const adjustPortion = (portion, delta) =>
    dispatch(updateQty({ cartId: portion === "half" ? halfCartId : fullCartId, delta }));

  return (
    <>
      <div
        onClick={() => onOpen(item)}
        className={`cursor-pointer ${!item.isAvailable ? "opacity-55" : ""}`}
      >
        {/* ── Photo (full width, top) ── */}
        <div className="w-full aspect-[4/3] rounded-xl overflow-hidden bg-subtle">
          {item.image ? (
            <img
              src={optimizeImage(item.image, 400)}
              alt={item.name}
              loading="lazy"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-faint">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21,15 16,10 5,21" />
              </svg>
            </div>
          )}
        </div>

        {/* ── Info below photo ── */}
        <div className="mt-2 px-0.5">
          {/* Veg mark + Bestseller + Rating */}
          <div className="flex items-center gap-1.5">
            <VegMark isVeg={item.isVeg} />
            {item.isBestseller && (
              <span className="text-[10px] font-bold text-amber-600">⭐Bestseller</span>
            )}
            {item.ratingCount > 0 && (
              <span className="ml-auto text-[11px] font-bold text-ok flex items-center gap-0.5">
                ★ {item.ratingAvg}
                <span className="text-muted font-normal">({item.ratingCount})</span>
              </span>
            )}
          </div>

          {/* Name */}
          <h3 className="text-ink font-semibold text-sm leading-snug line-clamp-2 mt-1">{item.name}</h3>

          {/* Price (LEFT) + ADD button (RIGHT) — same row */}
          <div className="flex items-center justify-between mt-1.5">
            <div className="min-w-0">
              {hasHalfFull ? (
                <div className="text-ink font-bold text-sm">
                  ₹{item.halfPrice}
                  <span className="text-muted font-normal text-[10px] ml-0.5">onwards</span>
                </div>
              ) : (
                <div className="text-ink font-bold text-sm">₹{item.price}</div>
              )}
              {!item.isAvailable && (
                <span className="text-danger text-[10px] font-semibold">Unavailable</span>
              )}
            </div>

            {item.isAvailable && (
              <div onClick={(e) => e.stopPropagation()}>
                {hasHalfFull ? (
                  totalQty > 0 ? (
                    <div className="inline-flex items-center rounded-lg bg-accent text-white overflow-hidden shadow-sm">
                      <button onClick={openSheet} className="w-8 h-8 text-base font-bold">−</button>
                      <button onClick={openSheet} className="min-w-5 text-center font-bold text-xs">{totalQty}</button>
                      <button onClick={openSheet} className="w-8 h-8 text-base font-bold">+</button>
                    </div>
                  ) : (
                    <AddButton onClick={openSheet} />
                  )
                ) : cartQty > 0 ? (
                  <Stepper qty={cartQty} onMinus={minus} onPlus={add} />
                ) : (
                  <AddButton onClick={add} />
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Half / Full portion sheet ── */}
      {showSheet && (
        <div
          onClick={(e) => { e.stopPropagation(); setShowSheet(false); }}
          className="fixed inset-0 bg-ink/40 z-200 flex items-end justify-center"
        >
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-120 bg-surface rounded-t-3xl p-5 pb-8 shadow-2xl">
            <div className="flex justify-center mb-4">
              <div className="w-10 h-1 bg-line rounded-full" />
            </div>
            <div className="text-faint text-xs font-bold uppercase tracking-wide mb-1">Customisable</div>
            <h3 className="font-display text-ink font-semibold text-xl mb-4">{item.name}</h3>

            {[
              { key: "half", label: "Half", price: item.halfPrice, qty: halfQty },
              { key: "full", label: "Full", price: item.price,     qty: fullQty },
            ].map((p) => (
              <div key={p.key} className="flex items-center justify-between px-4 py-3.5 rounded-2xl border border-line bg-page mb-2.5">
                <div>
                  <div className="text-ink font-medium text-sm">{p.label}</div>
                  <div className="text-muted text-xs mt-0.5">₹{p.price}</div>
                </div>
                {p.qty > 0 ? (
                  <Stepper small qty={p.qty} onMinus={() => adjustPortion(p.key, -1)} onPlus={() => adjustPortion(p.key, 1)} />
                ) : (
                  <AddButton small onClick={() => addPortion(p.key)} />
                )}
              </div>
            ))}

            <button onClick={() => setShowSheet(false)} className="w-full mt-4 bg-ink text-white rounded-2xl py-3 font-bold text-sm">
              Done
            </button>
          </div>
        </div>
      )}
    </>
  );
}
