import { useState } from "react";
import { useSelector } from "react-redux";
import { selectCurrentCustomer } from "../../features/customerAuth/customerAuthSlice";
import { submitReviewApi } from "../../api/publicApi";
import toast from "react-hot-toast";
import { HandHeart } from "lucide-react";

const LABELS = ["", "Poor", "Fair", "Good", "Very Good", "Excellent 🤩"];

function StarPicker({ value, onChange }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-2 justify-center py-2">
      {[1,2,3,4,5].map((s) => (
        <span
          key={s}
          onClick={() => onChange(s)}
          onMouseEnter={() => setHovered(s)}
          onMouseLeave={() => setHovered(0)}
          className={`text-4xl cursor-pointer transition-all hover:scale-125 active:scale-110
            ${s <= (hovered || value) ? "text-amber-400" : "text-gray-700"}`}
        >
          ★
        </span>
      ))}
    </div>
  );
}

export default function ReviewModal({ item, sessionId, restaurantId, onClose, onNeedAuth }) {
  const currentCustomer = useSelector(selectCurrentCustomer);
  const [rating, setRating] = useState(0);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async () => {
    if (!currentCustomer) return onNeedAuth();
    if (!rating) return toast.error("Please select a rating");
    if (!sessionId) return toast.error("Session not found. Please scan QR again.");

    setSubmitting(true);
    try {
      await submitReviewApi({
        restaurantId,
        menuItemId: item._id,
        sessionId,
        rating,
        text: text.trim(),
      });
      setDone(true);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div onClick={onClose} className="fixed inset-0 bg-black/85 z-150 flex items-end justify-center">
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-120 bg-[#2C2C2E] rounded-t-3xl p-5 pb-10"
      >
        <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-5" />

        {done ? (
          <div className="text-center py-6">
            
            {/* <div className="text-5xl mb-3">🙏</div> */}
            <div className="mb-3 flex justify-center">
              <HandHeart size={48} strokeWidth={1.8} className="text-white" />
            </div>

            <div className="text-white font-bold text-xl">Thank you!</div>
            <div className="text-gray-400 text-sm mt-1 mb-5">Your review has been submitted</div>
            <button onClick={onClose} className="w-full py-4 bg-[#FC8019] text-white rounded-2xl font-bold">
              Done
            </button>
          </div>
        ) : !currentCustomer ? (
          <div className="text-center py-4">
            <div className="text-5xl mb-3">🔒</div>
            <div className="text-white font-bold text-xl mb-2">Login Required</div>
            <p className="text-gray-400 text-sm mb-5">Login to rate this dish</p>
            <button onClick={onNeedAuth} className="w-full py-4 bg-[#FC8019] text-white rounded-2xl font-bold">
              Login with Phone
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-white font-bold text-base">{item.name}</div>
              <div className="text-gray-500 text-xs mt-0.5">How was the dish?</div>
            </div>

            <StarPicker value={rating} onChange={setRating} />

            {rating > 0 && (
              <div className="text-center text-[#FC8019] font-semibold text-sm -mt-1">
                {LABELS[rating]}
              </div>
            )}

            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Share your experience... (optional)"
              rows={3}
              className="w-full bg-[#1C1C1E] border border-white/10 rounded-2xl px-4 py-3.5 text-white placeholder-gray-600 outline-none focus:border-[#FC8019]/40 text-sm resize-none transition-colors"
            />

            <button
              onClick={handleSubmit}
              disabled={!rating || submitting}
              className="w-full py-4 bg-[#FC8019] text-white rounded-2xl font-bold text-base disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {submitting ? "Submitting..." : "Submit Review"}
            </button>

            <p className="text-gray-600 text-xs text-center">
              Reviewing as <span className="text-gray-400">{currentCustomer.username}</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}