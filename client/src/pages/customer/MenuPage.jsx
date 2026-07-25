import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  setTable,
  selectCartCount,
  selectCartTotal,
  calculateGrandTotal, //new
  addToCart,
  updateQty,
  selectItemCartQty,
  selectItemCartId,
} from "../../features/cart/cartSlice";
import {
  selectCurrentCustomer,
  logoutCustomer,
  loadCustomer,
} from "../../features/customerAuth/customerAuthSlice";
import {
  getMenuApi,
  createSessionApi,
  getSessionOrdersApi,
} from "../../api/publicApi";
// import { getMenuApi, createSessionApi } from "../../api/publicApi";
import ItemDetailModal from "../../components/menu/ItemDetailModal";
import CartDrawer from "../../components/cart/CartDrawer";
import ReviewModal from "../../components/reviews/ReviewModal";
import CustomerAuthModal from "../../components/customer/CustomerAuthModal";
import OrderTracker from "../../components/customer/OrderTracker";

// for customer order history
// Add import
import OrderHistoryModal from "../../components/customer/OrderHistoryModal";

import { optimizeImage } from "../../utils/imageOptimize";

  // optimize images
  // Inserts Cloudinary optimization parameters into any existing image URL.
  // Works on already-uploaded images without needing to re-upload anything —
  // Cloudinary generates and caches the resized/compressed version on first request.
  // const optimizeImage = (url, width = 400) => {
  //   if (!url || !url.includes("res.cloudinary.com")) return url; // safety: leave non-Cloudinary URLs untouched
  //   return url.replace("/upload/", `/upload/f_auto,q_auto,w_${width},c_fill/`);
  // };

// ── Item Row — Swiggy style, Cloudinary photo, no emoji fallback ──
function ItemRow({ item, onOpen }) {
  const dispatch = useDispatch();
  const cartQty = useSelector(selectItemCartQty(item._id));
  const cartId = useSelector(selectItemCartId(item._id));

  const handleAdd = (e) => {
    e.stopPropagation();
    dispatch(addToCart({ ...item, qty: 1 }));
  };

  const handleMinus = (e) => {
    e.stopPropagation();
    dispatch(updateQty({ cartId, delta: -1 }));
  };

  const handlePlus = (e) => {
    e.stopPropagation();
    dispatch(addToCart({ ...item, qty: 1 }));
  };

  return (
    <div
      onClick={() => onOpen(item)}
      className={`flex items-start gap-3 px-4 py-4 cursor-pointer active:bg-white/5 transition-colors border-b border-white/5 last:border-0 ${!item.isAvailable ? "opacity-50" : ""}`}
    >
      <div className="flex-1 min-w-0 pr-2">
        <div className="flex items-center gap-2 mb-1.5">
          <div
            className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 ${item.isVeg ? "border-green-500" : "border-red-500"}`}
          >
            <div
              className={`w-2 h-2 rounded-full ${item.isVeg ? "bg-green-500" : "bg-red-500"}`}
            />
          </div>
          {item.isBestseller && (
            <span className="text-[#FF7043] text-[10px] font-bold border border-[#FF7043]/60 rounded px-1.5 py-0.5 uppercase tracking-wide">
              Bestseller
            </span>
          )}

        </div>

        <h3 className="text-white font-semibold text-[15px] leading-snug">
          {item.name}
        </h3>

        {/* <div className="text-white font-bold text-sm mt-1">₹{item.price}</div> */}

        {/* new */}
        {item.halfPrice ? (
  <div className="text-white font-bold text-sm mt-1">
    ₹{item.halfPrice} <span className="text-gray-500 font-normal text-xs">Half</span>
    <span className="text-gray-600 mx-1.5">·</span>
    ₹{item.price} <span className="text-gray-500 font-normal text-xs">Full</span>
  </div>
) : (
  <div className="text-white font-bold text-sm mt-1">₹{item.price}</div>
)}

        {item.description && (
          <p className="text-gray-500 text-xs mt-1.5 leading-relaxed line-clamp-2">
            {item.description}
          </p>
        )}

        {!item.isAvailable && (
          <span className="text-red-400 text-xs font-semibold mt-1.5 block">
            Currently unavailable
          </span>
        )}
      </div>

      {/* Right — Cloudinary image + button */}
      <div className="shrink-0 relative">
        <div className="w-28 h-24 rounded-2xl overflow-hidden bg-[#2C2C2E]">
          {item.image ? (
            <img
              // src={item.image}
              src={optimizeImage(item.image, 200)}
              alt={item.name}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-700">
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21,15 16,10 5,21" />
              </svg>
            </div>
          )}
        </div>

        {/* {item.isAvailable && (
          <div
            className="absolute -bottom-3 left-1/2 -translate-x-1/2"
            onClick={(e) => e.stopPropagation()}
          >
            {cartQty > 0 ? (
              <div className="flex items-center bg-[#FC8019] rounded-xl overflow-hidden shadow-lg shadow-[#FC8019]/30 border border-[#FC8019]">
                <button
                  onClick={handleMinus}
                  className="w-9 h-9 text-white font-black text-xl flex items-center justify-center active:bg-[#e07018]"
                >
                  −
                </button>
                <span className="w-7 text-center text-white font-black text-sm">
                  {cartQty}
                </span>
                <button
                  onClick={handlePlus}
                  className="w-9 h-9 text-white font-black text-xl flex items-center justify-center active:bg-[#e07018]"
                >
                  +
                </button>
              </div>
            ) : (
              <button
                onClick={handleAdd}
                className="bg-[#1C1C1E] border-2 border-[#FC8019] text-[#FC8019] font-black text-sm px-6 py-1.5 rounded-xl shadow-lg active:bg-[#FC8019] active:text-white transition-colors"
              >
                ADD
              </button>
            )}
          </div>
        )} */}

        {/* new */}
        {item.isAvailable && (
  <div
    className="absolute -bottom-3 left-1/2 -translate-x-1/2"
    onClick={(e) => e.stopPropagation()}
  >
    {item.halfPrice ? (
      <button
        onClick={() => onOpen(item)}
        className="bg-[#1C1C1E] border-2 border-[#FC8019] text-[#FC8019] font-black text-sm px-6 py-1.5 rounded-xl shadow-lg active:bg-[#FC8019] active:text-white transition-colors"
      >
        ADD
      </button>
    ) : cartQty > 0 ? (
      <div className="flex items-center bg-[#FC8019] rounded-xl overflow-hidden shadow-lg shadow-[#FC8019]/30 border border-[#FC8019]">
        <button
          onClick={handleMinus}
          className="w-9 h-9 text-white font-black text-xl flex items-center justify-center active:bg-[#e07018]"
        >
          −
        </button>
        <span className="w-7 text-center text-white font-black text-sm">
          {cartQty}
        </span>
        <button
          onClick={handlePlus}
          className="w-9 h-9 text-white font-black text-xl flex items-center justify-center active:bg-[#e07018]"
        >
          +
        </button>
      </div>
    ) : (
      <button
        onClick={handleAdd}
        className="bg-[#1C1C1E] border-2 border-[#FC8019] text-[#FC8019] font-black text-sm px-6 py-1.5 rounded-xl shadow-lg active:bg-[#FC8019] active:text-white transition-colors"
      >
        ADD
      </button>
    )}
  </div>
)}


      </div>
    </div>
  );
}

// ── Main MenuPage ─────────────────────────────────────────────────
export default function MenuPage() {
  const { restaurantSlug, tableId } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const cartCount = useSelector(selectCartCount);
  const cartTotal = useSelector(selectCartTotal);

  const currentCustomer = useSelector(selectCurrentCustomer);

  const [restaurant, setRestaurant] = useState(null);

  // new 👇
  const gstPercent = restaurant?.gstPercent ?? 5;
  const { grandTotal: cartGrandTotal } = calculateGrandTotal(cartTotal, gstPercent);
  // new 👆

  const [categories, setCategories] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [table, setTableData] = useState(null);
  const [restaurantId, setRestaurantId] = useState(null);
  const [sessionId, setSessionId] = useState(
    () => sessionStorage.getItem(`session_${tableId}`) || null,
  );

  const [activeCat, setActiveCat] = useState("all");
  const [selectedItem, setSelectedItem] = useState(null);
  const [reviewItem, setReviewItem] = useState(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [trackerOpen, setTrackerOpen] = useState(false);
  const [pendingReviewItem, setPendingReviewItem] = useState(null);
  const [toast, setToast] = useState(null);
  // const [orderCount, setOrderCount] = useState(
  //   () => Number(sessionStorage.getItem(`orderCount_${tableId}`) || 0)
  // );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);

  // for customer order history
  const [historyOpen, setHistoryOpen] = useState(false);

  const restaurantIsPro = restaurant?.subscriptionPlan === "pro";

  useEffect(() => {
    dispatch(loadCustomer());
  }, [dispatch]);

  useEffect(() => {
    const loadMenu = async () => {
      try {
        const data = await getMenuApi(restaurantSlug, tableId);
        setRestaurant(data.restaurant);
        setCategories(data.categories);
        setMenuItems(data.menuItems);
        setTableData(data.table);
        setRestaurantId(data.restaurant._id);
        dispatch(
          setTable({ tableId: data.table._id, tableName: data.table.name }),
        );

        const savedSession = sessionStorage.getItem(`session_${tableId}`);
        if (!savedSession) {
          const sessionData = await createSessionApi({
            restaurantId: data.restaurant._id,
            tableId: data.table._id,
          });
          const sid = sessionData.session._id;
          setSessionId(sid);
          sessionStorage.setItem(`session_${tableId}`, sid);
        }
      } catch {
        setError("Menu not found. Please scan the QR code again.");
      } finally {
        setLoading(false);
      }
    };
    loadMenu();
  }, [restaurantSlug, tableId, dispatch]);

  useEffect(() => {
    if (currentCustomer && pendingReviewItem && !showAuth) {
      setReviewItem(pendingReviewItem);
      setPendingReviewItem(null);
    }
  }, [currentCustomer, pendingReviewItem, showAuth]);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleReview = (item) => {
    setSelectedItem(null);
    if (!currentCustomer) {
      setPendingReviewItem(item);
      setShowAuth(true);
    } else {
      setReviewItem(item);
    }
  };

  // const handleOrderPlaced = () => {
  //   setOrderCount((prev) => {
  //     const newCount = prev + 1;
  //     sessionStorage.setItem(`orderCount_${tableId}`, String(newCount));
  //     return newCount;
  //   });
  //   showToast("Order placed! Kitchen is on it 🍳");
  // };

  // new
  //REPLACE with real-count fetching:
  const [orderCount, setOrderCount] = useState(0);

  // fetch real order count for this session from backend
  const fetchOrderCount = async () => {
    if (!sessionId) return;
    try {
      const data = await getSessionOrdersApi(sessionId);
      const activeOrders = (data.orders || []).filter(
        (o) => o.status !== "Cancelled",
      );
      setOrderCount(activeOrders.length);
    } catch {
      // ignore
    }
  };

  // fetch on mount once sessionId is known, and refresh periodically
  useEffect(() => {
    if (sessionId) fetchOrderCount();
  }, [sessionId]);

  const handleOrderPlaced = () => {
    fetchOrderCount(); // re-fetch real count from DB after placing an order
    showToast("Order placed! Kitchen is on it 🍳");
  };

  const handleGoToLogin = () => {
    sessionStorage.setItem("menuReturnUrl", location.pathname);
    sessionStorage.setItem("menuRestaurantId", restaurantId || "");
    navigate("/customer/login");
  };

  const handleGoToRegister = () => {
    sessionStorage.setItem("menuReturnUrl", location.pathname);
    sessionStorage.setItem("menuRestaurantId", restaurantId || "");
    navigate("/customer/register");
  };

  // logout
  const handleLogout = async () => {
  await dispatch(logoutCustomer());
  fetchOrderCount(); // ← re-fetch, since after logout req.customer is gone,
                      //   backend now returns un-scoped (all-table) count if not logged in
  showToast("Logged out");
};

  const getFilteredItems = () => {
    if (searchQuery.trim()) {
      return menuItems.filter((m) =>
        m.name.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }
    if (activeCat === "all") return null;
    return menuItems.filter((m) => {
      const catId = (m.categoryId?._id || m.categoryId)?.toString();
      return catId === activeCat;
    });
  };

  const filteredItems = getFilteredItems();
  const selectedCategory = categories.find(
    (c) => c._id?.toString() === activeCat,
  );

  const itemsByCategory = categories
    .map((cat) => ({
      ...cat,
      items: menuItems.filter((m) => {
        const catId = (m.categoryId?._id || m.categoryId)?.toString();
        return catId === cat._id?.toString();
      }),
    }))
    .filter((cat) => cat.items.length > 0);


  if (loading)
    return (
      <div className="min-h-screen bg-[#1C1C1E] flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4 animate-pulse">🍽️</div>
          <div className="text-white font-bold text-lg">Loading menu...</div>
        </div>
      </div>
    );

  if (error)
    return (
      <div className="min-h-screen bg-[#1C1C1E] flex items-center justify-center p-6">
        <div className="text-center">
          <div className="text-5xl mb-4">❌</div>
          <div className="text-white font-bold text-xl mb-2">
            Table Not Found
          </div>
          <div className="text-gray-400 text-sm">{error}</div>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-[#1C1C1E] font-sans max-w-120 mx-auto relative">
      {toast && (
        <div
          className={`fixed top-4 left-1/2 -translate-x-1/2 z-999 px-5 py-2.5 rounded-xl font-semibold text-sm text-white shadow-2xl whitespace-nowrap
          ${toast.type === "success" ? "bg-[#25C866]" : "bg-red-500"}`}
        >
          {toast.msg}
        </div>
      )}

      {/* ── STICKY HEADER ── */}
      <div className="sticky top-0 z-50 bg-[#1C1C1E]">
        <div className="px-4 pt-4 pb-3 flex items-start justify-between">
          {/* Restaurant logo + name */}
          <div className="flex items-center gap-3 flex-1 min-w-0 pr-3">
            {/* <div className="w-11 h-11 overflow-hidden bg-white/5 shrink-0 border-2 border-white/10"> */}
            {/* <div className="w-11 h-11 rounded-full overflow-hidden bg-white/5 shrink-0 border-2 border-white/10"> */}
            {/* {restaurant?.logo ? (
                <img src={restaurant.logo} alt={restaurant.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-600">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M3 3h18v18H3z" opacity="0" />
                    <path d="M4 21V8a1 1 0 011-1h3V3M16 3v4h3a1 1 0 011 1v13" />
                  </svg>
                </div>
              )} */}
            {/* </div> */}
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <div className="w-1.5 h-1.5 rounded-full bg-[#25C866] animate-pulse" />
                <span className="text-[#25C866] text-xs font-semibold uppercase tracking-wide">
                  {table?.name}
                </span>
              </div>
              <h1 className="text-white font-bold text-xl leading-tight truncate">
                {restaurant?.name}
              </h1>
              {restaurant?.description && (
                <p className="text-gray-400 text-xs mt-0.5 truncate">
                  {restaurant.description}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                setShowSearch(!showSearch);
                if (showSearch) setSearchQuery("");
              }}
              className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-gray-300 text-base"
            >
              {showSearch ? "✕" : "🔍"}
            </button>
            <button
              onClick={() => setCartOpen(true)}
              className="relative w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-gray-300"
            >
              🛒
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-[#FC8019] text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {showSearch && (
          <div className="px-4 pb-3">
            <div className="flex items-center gap-2 bg-[#2C2C2E] rounded-2xl px-4 py-3">
              <span className="text-gray-500 text-sm">🔍</span>
              <input
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search dishes..."
                className="flex-1 bg-transparent text-white placeholder-gray-500 outline-none text-sm"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="text-gray-500"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        )}

        {/* Customer bar */}
        <div className="px-4 py-2 border-t border-white/5 flex items-center justify-between">
          {/* {currentCustomer ? (
            <>
              <span className="text-gray-300 text-xs">
                Welcome! <span className="text-gray-300 font-medium">{currentCustomer.username}</span>
              </span>
              <button
                onClick={async () => { await dispatch(logoutCustomer()); }}
                className="text-red-400 text-xs font-medium"
              >
                Logout
              </button>
            </>
          ) : ( */}
          {/* new for customer order history */}
          {currentCustomer ? (
            <>
              {/* <span className="text-gray-300 text-xs">
                Welcome!{" "}
                <span className="text-gray-300 font-medium">
                  {currentCustomer.username}
                </span>
              </span> */}
              <span className="font-['Poppins'] text-gray-300 text-sm">
                Welcome!{" "}
                <span className="font-semibold text-white">
                 {currentCustomer.username}
                </span>
              </span>

              <div className="flex gap-3">
                <button
                  onClick={() => setHistoryOpen(true)}
                  className="text-[#FC8019] text-xs font-semibold"
                >
                  My Orders
                </button>

                {/* <button
                  onClick={async () => {
                    await dispatch(logoutCustomer());
                  }}
                  className="text-red-400 text-xs font-medium"
                >
                  Logout
                </button> */}
                {/* new */}
                <button onClick={handleLogout} className="text-red-400 text-xs font-medium">
                  [← Logout
                </button>
              </div>
            </>
          ) : (
            <>
              <span className="text-gray-300 text-xs">
                Login to rate dishes ⭐
              </span>
              <div className="flex gap-4">
                <button
                  onClick={handleGoToLogin}
                  className="text-[#FC8019] text-xs font-semibold"
                >
                  Login
                </button>
                <button
                  onClick={handleGoToRegister}
                  className="text-[#FC8019] text-xs font-semibold"
                >
                  Register
                </button>
              </div>
            </>
          )}
        </div>

        {orderCount > 0 && (
          <div
            onClick={() => setTrackerOpen(true)}
            className="mx-4 mb-2 bg-[#25C866]/10 border border-[#25C866]/20 rounded-xl px-3 py-2 flex items-center justify-between cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#25C866] animate-pulse" />
              <span className="text-[#25C866] text-xs font-semibold">
                {orderCount} order{orderCount > 1 ? "s" : ""} placed
              </span>
            </div>
            <span className="text-[#25C866] text-xs font-bold">Track →</span>
          </div>
        )}

        {!searchQuery && (
          <div className="border-t border-white/5">
            <div
              className="flex overflow-x-auto"
              style={{ scrollbarWidth: "none" }}
            >
              {[{ _id: "all", name: "All", image: null }, ...categories].map(
                (cat) => (
                  <button
                    key={cat._id}
                    onClick={() => setActiveCat(cat._id?.toString() || "all")}
                    className={`shrink-0 flex items-center gap-1.5 px-4 py-3 text-xs font-semibold whitespace-nowrap border-b-2 transition-all
                    ${
                      activeCat === (cat._id?.toString() || "all")
                        ? "text-[#FC8019] border-[#FC8019]"
                        : "text-gray-500 border-transparent"
                    }`}
                  >
                    {/* removed this for categories */}
                    {/* {cat.image && (
                    <img src={cat.image} alt={cat.name} className="w-5 h-5 rounded-full object-cover" />
                  )} */}
                    {cat.name}
                  </button>
                ),
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── MENU CONTENT ── */}
      <div className="pb-36">
        {searchQuery && (
          <>
            <div className="px-4 pt-4 pb-2">
              <span className="text-gray-500 text-xs">
                {filteredItems?.length || 0} result
                {filteredItems?.length !== 1 ? "s" : ""}
              </span>
            </div>
            {filteredItems?.length === 0 ? (
              <div className="text-center py-16 text-gray-600">
                <div className="text-4xl mb-3">🔍</div>
                <div className="font-semibold text-gray-400">
                  No dishes found
                </div>
                <div className="text-sm mt-1">Try a different search term</div>
              </div>
            ) : (
              <div className="mt-2">
                {filteredItems?.map((item) => (
                  <ItemRow
                    key={item._id}
                    item={item}
                    onOpen={setSelectedItem}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {!searchQuery && activeCat !== "all" && (
          <>
            <div className="px-4 pt-5 pb-3">
              <h2 className="text-white font-bold text-base">
                {selectedCategory?.name}
                <span className="text-gray-600 font-normal text-sm ml-2">
                  ({filteredItems?.length || 0} items)
                </span>
              </h2>
            </div>
            {filteredItems?.length === 0 ? (
              <div className="text-center py-16 text-gray-600">
                <div className="text-4xl mb-3">🍽️</div>
                <div>No items in this category</div>
              </div>
            ) : (
              <div className="mt-2">
                {filteredItems?.map((item) => (
                  <ItemRow
                    key={item._id}
                    item={item}
                    onOpen={setSelectedItem}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {!searchQuery && activeCat === "all" && (
          <>
            {itemsByCategory.length === 0 ? (
              <div className="text-center py-16 text-gray-600">
                <div className="text-4xl mb-3">🍽️</div>
                <div>No menu items available</div>
              </div>
            ) : (
              itemsByCategory.map((cat) => (
                <div key={cat._id}>
                  <div className="px-4 pt-6 pb-3 flex items-center gap-2">
                    {/* removed this for category */}
                    {/* {cat.image && (
                      <img src={cat.image} alt={cat.name} className="w-6 h-6 rounded-full object-cover" />
                    )} */}
                    <h2 className="text-white font-bold text-base">
                      {cat.name}
                    </h2>
                    <span className="text-gray-600 text-xs">
                      ({cat.items.length})
                    </span>
                  </div>
                  <div className="mt-1">
                    {cat.items.map((item) => (
                      <ItemRow
                        key={item._id}
                        item={item}
                        onOpen={setSelectedItem}
                      />
                    ))}
                  </div>
                </div>
              ))
            )}
          </>
        )}
      </div>

      {/* ── FLOATING CART BUTTON ── */}
      {cartCount > 0 && !cartOpen && (
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-120 z-60 px-4 pb-6 pt-4 bg-linear-to-t from-[#1C1C1E] to-transparent">
          <button
            onClick={() => setCartOpen(true)}
            className="w-full bg-[#FC8019] text-white rounded-2xl py-4 font-bold flex items-center justify-between px-5 shadow-2xl shadow-[#FC8019]/40 active:scale-[0.98] transition-transform"
          >
            <div className="bg-white/20 rounded-xl w-8 h-8 flex items-center justify-center text-sm font-black">
              {cartCount}
            </div>
            <span className="font-bold text-base">View Cart</span>
            {/* <span className="font-bold text-base">₹{cartTotal}</span> */}
            {/* <span className="font-bold text-base">₹{Math.round(cartGrandTotal)}</span> */}
            <span className="font-bold text-base">₹{cartGrandTotal.toFixed(2)}</span>
          </button>
        </div>
      )}

      {/* ── MODALS ── */}
      {selectedItem && (
        <ItemDetailModal
          item={selectedItem}
          restaurantIsPro={restaurantIsPro}   //{/* ← this is the new line */}
          onClose={() => setSelectedItem(null)}
          onReview={() => handleReview(selectedItem)}
        />
      )}

      <CartDrawer
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        tableId={table?._id}
        tableName={table?.name}
        restaurantId={restaurantId}
        sessionId={sessionId}
        // gstPercent={restaurant?.gstPercent || 5}
        gstPercent={restaurant?.gstPercent ?? 5} // {/* ?? not ||, so an actual 0% doesn't get overridden */}
        // {/* ← add this */}
        onOrderPlaced={handleOrderPlaced}
        onNeedLogin={() => setShowAuth(true)}
      />

      {reviewItem && (
        <ReviewModal
          item={reviewItem}
          sessionId={sessionId}
          restaurantId={restaurantId}
          onClose={() => setReviewItem(null)}
          onNeedAuth={() => {
            setPendingReviewItem(reviewItem);
            setReviewItem(null);
            setShowAuth(true);
          }}
        />
      )}

      {showAuth && (
        <CustomerAuthModal
          restaurantId={restaurantId}
          onClose={() => {
            setShowAuth(false);
            setPendingReviewItem(null);
          }}
          onLoginClick={() => {
            setShowAuth(false);
            handleGoToLogin();
          }}
          onRegisterClick={() => {
            setShowAuth(false);
            handleGoToRegister();
          }}
        />
      )}

      <OrderTracker
        sessionId={sessionId}
        isOpen={trackerOpen}
        onClose={() => setTrackerOpen(false)}
      />

      <OrderHistoryModal
        isOpen={historyOpen}
        onClose={() => setHistoryOpen(false)}
      />

    </div>
  );
}