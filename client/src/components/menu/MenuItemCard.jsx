import { useDispatch, useSelector } from "react-redux";
import { addToCart, updateQty, selectItemCartQty, selectItemCartId } from "../../features/cart/cartSlice";
import { selectAvgRating, selectReviewsByItem } from "../../features/reviews/reviewSlice";
import VegIcon from "../common/VegIcon";
import StarRating from "../common/StarRating";

export default function MenuItemCard({ item, onOpenDetail }) {
  const dispatch = useDispatch();
  const cartQty = useSelector(selectItemCartQty(item._id));
  const cartId = useSelector(selectItemCartId(item._id));
  const avg = useSelector(selectAvgRating(item._id));
  const reviews = useSelector(selectReviewsByItem(item._id));

  const handleAdd = (e) => {
    e.stopPropagation();
    dispatch(addToCart({ ...item, qty: 1 }));
  };

  const handleDecrement = (e) => {
    e.stopPropagation();
    dispatch(updateQty({ cartId, delta: -1 }));
  };

  return (
    <div
      onClick={() => onOpenDetail(item)}
      className={`rounded-2xl border border-white/10 bg-white/10 backdrop-blur-sm overflow-hidden cursor-pointer transition-all duration-200 hover:bg-white/15 hover:-translate-y-0.5 ${!item.isAvailable ? "opacity-50" : ""}`}
    >
      {/* Image area */}
      <div className="h-24 bg-white/5 flex items-center justify-center text-4xl relative">
        {item.emoji || "🍽️"}
        {item.isBestseller && item.isAvailable && (
          <div className="absolute top-2 left-2 bg-blue-600 text-white text-[9px] font-bold px-2 py-0.5 rounded">
            BESTSELLER
          </div>
        )}
        {!item.isAvailable && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <span className="text-red-400 font-bold text-xs">OUT OF STOCK</span>
          </div>
        )}
      </div>


      {/* Info */}
      <div className="p-2.5">
        <div className="flex items-start gap-1.5 mb-1.5">
          <VegIcon isVeg={item.isVeg} />
          <span className="text-white font-bold text-sm leading-tight">{item.name}</span>
        </div>

        {avg && (
          <div className="mb-1.5">
            <StarRating value={Math.round(avg)} size="text-[11px]" count={reviews.length} />
          </div>
        )}

        <div className="flex items-center justify-between mt-2">
          <span className="text-white font-bold text-base">₹{item.price}</span>

          {item.isAvailable && (
            cartQty > 0 ? (
              <div
                onClick={(e) => e.stopPropagation()}
                className="flex items-center bg-blue-600 rounded-lg overflow-hidden"
              >
                <button onClick={handleDecrement}
                  className="w-7 h-7 text-white text-base font-bold hover:bg-blue-700 transition-colors">
                  −
                </button>
                <span className="w-5 text-center text-white font-bold text-sm">{cartQty}</span>
                <button onClick={(e) => { e.stopPropagation(); onOpenDetail(item); }}
                  className="w-7 h-7 text-white text-base font-bold hover:bg-blue-700 transition-colors">
                  +
                </button>
              </div>
            ) : (
              <button onClick={handleAdd}
                className="border border-blue-400 text-blue-400 rounded-lg px-3 py-1 text-xs font-bold hover:bg-blue-400/20 transition-colors">
                ADD +
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
}