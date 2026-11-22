import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  setTable,
  selectCartCount,
  selectCartTotal,
  calculateGrandTotal,
} from "../../features/cart/cartSlice";
import {
  selectCurrentCustomer,
  logoutCustomer,
  loadCustomer,
} from "../../features/customerAuth/customerAuthSlice";
import { getMenuApi, createSessionApi, getSessionOrdersApi } from "../../api/publicApi";
import ItemDetailModal from "../../components/menu/ItemDetailModal";
import ItemCard from "../../components/menu/ItemCard";
import CartDrawer from "../../components/cart/CartDrawer";
import ReviewModal from "../../components/reviews/ReviewModal";
import CustomerAuthModal from "../../components/customer/CustomerAuthModal";
import OrderTracker from "../../components/customer/OrderTracker";
import OrderHistoryModal from "../../components/customer/OrderHistoryModal";
import { Search, X, ShoppingBag, User, ClipboardList, LogOut as LogOutIcon, GripVertical, Phone } from "lucide-react";

export default function MenuPage() {
  const { restaurantSlug, tableId } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const cartCount = useSelector(selectCartCount);
  const cartTotal = useSelector(selectCartTotal);
  const currentCustomer = useSelector(selectCurrentCustomer);

  const [restaurant, setRestaurant] = useState(null);
  const gstPercent = restaurant?.gstPercent ?? 5;
  const { grandTotal: cartGrandTotal } = calculateGrandTotal(cartTotal, gstPercent);

  const [categories, setCategories] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [table, setTableData] = useState(null);
  const [restaurantId, setRestaurantId] = useState(null);
  const [sessionId, setSessionId] = useState(() => sessionStorage.getItem(`session_${tableId}`) || null);

  const [selectedItem, setSelectedItem] = useState(null);
  const [reviewItem, setReviewItem] = useState(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [trackerOpen, setTrackerOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [floatingPos, setFloatingPos] = useState({ x: 24, y: 24 }); // bottom-right offset
  const dragRef = useRef(null);
  const [pendingReviewItem, setPendingReviewItem] = useState(null);
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [vegOnly, setVegOnly] = useState(false);
  const [selectedCat, setSelectedCat] = useState(null);
  const [orderCount, setOrderCount] = useState(0);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const restaurantIsPro = restaurant?.subscriptionPlan === "pro";
  const isKiosk = !!table?.isKiosk;

  useEffect(() => { dispatch(loadCustomer()); }, [dispatch]);

  const startSession = useCallback(
    async (rId, tId) => {
      const sessionData = await createSessionApi({ restaurantId: rId, tableId: tId });
      const sid = sessionData.session._id;
      setSessionId(sid);
      sessionStorage.setItem(`session_${tableId}`, sid);
      return sid;
    },
    [tableId],
  );

  useEffect(() => {
    const loadMenu = async () => {
      try {
        const data = await getMenuApi(restaurantSlug, tableId);
        setRestaurant(data.restaurant);
        setCategories(data.categories);
        setMenuItems(data.menuItems);
        setTableData(data.table);
        setRestaurantId(data.restaurant._id);
        dispatch(setTable({ tableId: data.table._id, tableName: data.table.name }));
        if (!sessionStorage.getItem(`session_${tableId}`)) {
          await startSession(data.restaurant._id, data.table._id);
        }
      } catch {
        setError("Menu not found. Please scan the QR code again.");
      } finally {
        setLoading(false);
      }
    };
    loadMenu();
  }, [restaurantSlug, tableId, dispatch, startSession]);

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
    if (isKiosk) return;
    setSelectedItem(null);
    if (!currentCustomer) { setPendingReviewItem(item); setShowAuth(true); }
    else setReviewItem(item);
  };

  const fetchOrderCount = async () => {
    if (!sessionId || isKiosk) return;
    try {
      const data = await getSessionOrdersApi(sessionId);
      setOrderCount((data.orders || []).filter((o) => o.status !== "Cancelled").length);
    } catch { /* ignore */ }
  };

  useEffect(() => {
    if (sessionId && table) fetchOrderCount();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, table]);

  const handleOrderPlaced = () => {
    fetchOrderCount();
    if (!isKiosk) showToast("Order placed! Kitchen is on it 🍳");
  };

  const handleKioskReset = async () => {
    sessionStorage.removeItem(`session_${tableId}`);
    setSessionId(null);
    setOrderCount(0);
    setSearchQuery("");
    setVegOnly(false);
    setSelectedCat(null);
    try { await startSession(restaurantId, table._id); }
    catch { showToast("Could not start a new session. Please refresh.", "error"); }
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

  const handleLogout = async () => {
    await dispatch(logoutCustomer());
    fetchOrderCount();
    showToast("Logged out");
  };

  // ── filtering ──
  const sections = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const visible = menuItems.filter((m) => {
      if (q && !m.name.toLowerCase().includes(q)) return false;
      if (vegOnly && !m.isVeg) return false;
      return true;
    });

    if (selectedCat) {
      const cat = categories.find((c) => c._id?.toString() === selectedCat);
      if (!cat) return [];
      const catItems = visible.filter(
        (m) => (m.categoryId?._id || m.categoryId)?.toString() === cat._id?.toString()
      );
      return catItems.length > 0 ? [{ ...cat, items: catItems }] : [];
    }

    return categories
      .map((cat) => ({
        ...cat,
        items: visible.filter((m) => (m.categoryId?._id || m.categoryId)?.toString() === cat._id?.toString()),
      }))
      .filter((cat) => cat.items.length > 0);
  }, [menuItems, categories, searchQuery, vegOnly, selectedCat]);

  const resultCount = sections.reduce((n, s) => n + s.items.length, 0);

  const customerDisplayName = currentCustomer?.username
    ? currentCustomer.username.charAt(0).toUpperCase() + currentCustomer.username.slice(1).toLowerCase()
    : "";

  /* ── loading ── */
  if (loading)
    return (
      <div className="min-h-screen bg-page flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 mx-auto mb-4 rounded-full border-2 border-line border-t-accent animate-spin" />
          <div className="text-muted font-medium text-sm">Loading menu...</div>
        </div>
      </div>
    );

  /* ── error ── */
  if (error)
    return (
      <div className="min-h-screen bg-page flex items-center justify-center p-6">
        <div className="text-center">
          <div className="font-display text-ink font-semibold text-2xl mb-2">Table not found</div>
          <div className="text-muted text-sm">{error}</div>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-page font-sans">

      {/* ── Toast ── */}
      {toast && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-999 px-5 py-2.5 rounded-xl font-semibold text-sm text-white shadow-xl whitespace-nowrap ${
          toast.type === "success" ? "bg-ok" : "bg-danger"
        }`}>
          {toast.msg}
        </div>
      )}


      {/* ═══════════════════════════════════════════════════════════
          DESKTOP SIDEBAR — fixed left, kiosk-style category panel
      ═══════════════════════════════════════════════════════════ */}
      <aside className="hidden lg:flex flex-col fixed top-0 left-0 h-screen w-56 xl:w-60 bg-surface border-r border-line z-40">

        {/* ── Branding ── */}
        <div className="px-4 pt-5 pb-4">
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-ok animate-pulse" />
            <span className="text-ok text-[10px] font-bold uppercase tracking-wider">
              {isKiosk ? "Self-order" : table?.name}
            </span>
          </div>
          <h1 className="font-display text-ink font-bold text-lg leading-tight">
            {restaurant?.name}
          </h1>
          {restaurant?.description && (
            <p className="text-muted text-[11px] mt-1.5 line-clamp-2 leading-relaxed">
              {restaurant.description}
            </p>
          )}
          {restaurant?.phone && (
            <a href={`tel:${restaurant.phone}`}
              className="flex items-center gap-1.5 mt-2 text-muted text-[11px] hover:text-accent transition-colors">
              <Phone size={11} />
              <span>{restaurant.phone}</span>
            </a>
          )}
        </div>

        <div className="mx-3.5 border-t border-line" />

        {/* ── Category nav (scrollable) ── */}
        <nav className="flex-1 overflow-y-auto px-2.5 py-3 space-y-0.5" style={{ scrollbarWidth: "thin" }}>
          <button
            onClick={() => setSelectedCat(null)}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl text-[13px] font-semibold transition-all ${
              selectedCat === null
                ? "bg-accent text-white shadow-sm"
                : "text-muted hover:bg-page hover:text-ink"
            }`}
          >
            All Items
          </button>
          {categories.map((cat) => (
            <button
              key={cat._id}
              onClick={() => setSelectedCat(selectedCat === cat._id?.toString() ? null : cat._id?.toString())}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl text-[13px] font-semibold transition-all ${
                selectedCat === cat._id?.toString()
                  ? "bg-accent text-white shadow-sm"
                  : "text-muted hover:bg-page hover:text-ink"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </nav>

        {/* ── Sidebar bottom: user actions ── */}
        {!isKiosk && (
          <div className="px-2.5 py-3 border-t border-line">
            {currentCustomer ? (
              <div className="space-y-0.5">
                <button onClick={() => setHistoryOpen(true)}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-[13px] font-medium text-muted hover:bg-page hover:text-ink transition-colors">
                  <ClipboardList size={15} />
                  My Orders
                </button>
                <button onClick={() => setShowLogoutConfirm(true)}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-[13px] font-medium text-muted hover:bg-page hover:text-ink transition-colors">
                  <LogOutIcon size={15} />
                  Logout
                </button>
              </div>
            ) : (
              <div className="space-y-1.5">
                <button onClick={handleGoToLogin}
                  className="w-full flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-[13px] font-semibold border border-line text-ink hover:bg-page transition-colors">
                  <User size={14} />
                  Login
                </button>
                <button onClick={handleGoToRegister}
                  className="w-full px-3.5 py-2 rounded-xl text-[13px] font-semibold bg-accent text-white text-center hover:brightness-110 transition">
                  Register
                </button>
              </div>
            )}
          </div>
        )}
      </aside>


      {/* ═══════════════════════════════════════════════════════════
          MAIN CONTENT — offset by sidebar width on desktop
      ═══════════════════════════════════════════════════════════ */}
      <div className="lg:ml-56 xl:ml-60">

        {/* ─────────────────────────────────────────────────────
            MOBILE / TABLET STICKY HEADER (hidden on desktop)
        ───────────────────────────────────────────────────── */}
        <div className="sticky top-0 z-50 bg-page/95 backdrop-blur lg:hidden">
          <div className="px-4">

            {/* Top nav row */}
            <div className="pt-3 pb-2 flex items-center gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-ok animate-pulse" />
                  <span className="text-ok text-[10px] font-bold uppercase tracking-wider">
                    {isKiosk ? "Self-order" : table?.name}
                  </span>
                </div>
                <h1 className="font-display text-ink font-semibold text-xl leading-tight truncate">
                  {restaurant?.name}
                </h1>
                {restaurant?.phone && (
                  <a href={`tel:${restaurant.phone}`}
                    className="flex items-center gap-1 mt-0.5 text-muted text-[10px] hover:text-accent transition-colors">
                    <Phone size={10} />
                    <span>{restaurant.phone}</span>
                  </a>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {!isKiosk && (
                  currentCustomer ? (
                    <>
                      <button onClick={() => setHistoryOpen(true)}
                        className="w-8 h-8 rounded-full bg-accent-soft flex items-center justify-center" aria-label="My Orders" title="My Orders">
                        <ClipboardList size={15} className="text-accent" />
                      </button>
                      <button onClick={() => setShowLogoutConfirm(true)}
                        className="w-8 h-8 rounded-full bg-surface border border-line flex items-center justify-center" aria-label="Logout" title="Logout">
                        <LogOutIcon size={14} className="text-muted" />
                      </button>
                    </>
                  ) : (
                    <>
                      <button onClick={handleGoToLogin}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface border border-line text-xs font-semibold text-ink hover:bg-page transition-colors">
                        <User size={13} className="text-muted" />Login
                      </button>
                      <button onClick={handleGoToRegister}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent text-white text-xs font-semibold hover:brightness-110 transition">
                        Register
                      </button>
                    </>
                  )
                )}
                <button onClick={() => setCartOpen(true)}
                  className="relative w-9 h-9 shrink-0 rounded-full bg-surface border border-line flex items-center justify-center text-ink hover:bg-page transition-colors" aria-label="Open cart">
                  <ShoppingBag size={16} />
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-accent text-white text-[10px] font-bold min-w-4.5 h-4.5 px-1 rounded-full flex items-center justify-center shadow-sm">
                      {cartCount}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Mobile greeting + Search + Veg toggle */}
            <div className="pb-3">
              {!isKiosk && currentCustomer && (
                <div className="pb-2">
                  <span className="text-muted text-sm">
                    Welcome! <span className="font-semibold text-ink">{customerDisplayName}</span>
                  </span>
                </div>
              )}
              <div className="flex items-start gap-3">
              <div className="flex-1 flex items-center gap-2 bg-surface border border-line rounded-xl px-3.5 py-2.5 focus-within:border-accent transition-colors">
                <Search size={16} className="text-faint shrink-0" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search dishes"
                  className="flex-1 bg-transparent text-ink placeholder-faint outline-none text-sm"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery("")} className="text-faint hover:text-muted">
                    <X size={16} />
                  </button>
                )}
              </div>
              <button
                onClick={() => setVegOnly(!vegOnly)}
                className={`shrink-0 flex items-center gap-2 rounded-xl border px-3 py-2.5 transition-all ${
                  vegOnly ? "border-ok bg-ok/8" : "border-line bg-surface"
                }`}
                aria-label="Toggle veg only"
              >
                <span className="w-3.5 h-3.5 rounded-[3px] border-[1.5px] border-ok flex items-center justify-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-ok" />
                </span>
                <span className={`text-[11px] font-bold ${vegOnly ? "text-ok" : "text-muted"}`}>VEG</span>
                <span className={`relative w-9 h-5 rounded-full transition-colors duration-200 ${vegOnly ? "bg-ok" : "bg-faint/40"}`}>
                  <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                    vegOnly ? "translate-x-4" : "translate-x-0"
                  }`} />
                </span>
              </button>
              </div>
            </div>

            {/* Category tabs (mobile/tablet horizontal scroll) */}
            {categories.length > 0 && (
              <div className="border-b border-line">
                <div className="flex overflow-x-auto" style={{ scrollbarWidth: "none" }}>
                  <button
                    onClick={() => setSelectedCat(null)}
                    className={`shrink-0 px-4 py-3 text-xs font-semibold whitespace-nowrap border-b-2 transition-all ${
                      selectedCat === null
                        ? "text-accent border-accent"
                        : "text-muted border-transparent hover:text-ink"
                    }`}
                  >
                    All
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat._id}
                      onClick={() => setSelectedCat(selectedCat === cat._id?.toString() ? null : cat._id?.toString())}
                      className={`shrink-0 px-4 py-3 text-xs font-semibold whitespace-nowrap border-b-2 transition-all ${
                        selectedCat === cat._id?.toString()
                          ? "text-accent border-accent"
                          : "text-muted border-transparent hover:text-ink"
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Order tracker strip (mobile) */}
            {!isKiosk && orderCount > 0 && (
              <div className="py-2">
                <div
                  onClick={() => setTrackerOpen(true)}
                  className="bg-ok-soft border border-ok/20 rounded-xl px-3 py-2 flex items-center justify-between cursor-pointer hover:bg-ok/10 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-ok animate-pulse" />
                    <span className="text-ok text-xs font-semibold">
                      {orderCount} order{orderCount > 1 ? "s" : ""} placed
                    </span>
                  </div>
                  <span className="text-ok text-xs font-bold">Track →</span>
                </div>
              </div>
            )}
          </div>
        </div>


        {/* ─────────────────────────────────────────────────────
            DESKTOP STICKY TOP BAR (hidden on mobile/tablet)
        ───────────────────────────────────────────────────── */}
        <div className="hidden lg:block sticky top-0 z-50 bg-page/95 backdrop-blur-sm border-b border-line">
          <div className="px-6 xl:px-8 py-3.5">
            <div className="flex items-center gap-4 xl:gap-5">

              {/* Search — fills available space */}
              <div className="flex-1 flex items-center gap-2 bg-surface border border-line rounded-xl px-4 py-2.5 focus-within:border-accent transition-colors">
                <Search size={16} className="text-faint shrink-0" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search dishes"
                  className="flex-1 bg-transparent text-ink placeholder-faint outline-none text-sm"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery("")} className="text-faint hover:text-muted">
                    <X size={16} />
                  </button>
                )}
              </div>

              {/* Veg toggle */}
              <button
                onClick={() => setVegOnly(!vegOnly)}
                className={`shrink-0 flex items-center gap-2 rounded-xl border px-3.5 py-2.5 transition-all ${
                  vegOnly ? "border-ok bg-ok/8" : "border-line bg-surface"
                }`}
                aria-label="Toggle veg only"
              >
                <span className="w-3.5 h-3.5 rounded-[3px] border-[1.5px] border-ok flex items-center justify-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-ok" />
                </span>
                <span className={`text-xs font-bold ${vegOnly ? "text-ok" : "text-muted"}`}>VEG</span>
                <span className={`relative w-9 h-5 rounded-full transition-colors duration-200 ${vegOnly ? "bg-ok" : "bg-faint/40"}`}>
                  <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                    vegOnly ? "translate-x-4" : "translate-x-0"
                  }`} />
                </span>
              </button>

              {/* Cart icon with badge — same as mobile */}
              <button
                onClick={() => setCartOpen(true)}
                className="relative shrink-0 ml-auto w-9 h-9 rounded-full bg-surface border border-line flex items-center justify-center text-ink hover:bg-page transition-colors"
                aria-label="Open cart"
              >
                <ShoppingBag size={16} />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-accent text-white text-[10px] font-bold min-w-4.5 h-4.5 px-1 rounded-full flex items-center justify-center shadow-sm">
                    {cartCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>


        {/* ═══════════════════════════════════════════════════════════
            MENU GRID
        ═══════════════════════════════════════════════════════════ */}
        <div className="px-4 lg:px-6 xl:px-8 pb-40">

          {/* Desktop welcome line — above the grid, not in the top bar */}
          <div className="hidden lg:block pt-6 pb-1">
            {!isKiosk && currentCustomer ? (
              <h2 className="font-display text-ink font-semibold text-xl">
                Welcome! {customerDisplayName}
              </h2>
            ) : (
              <h2 className="font-display text-ink font-semibold text-xl">
                {isKiosk ? "What would you like today?" : "What are you craving?"}
              </h2>
            )}
          </div>

          {resultCount === 0 ? (
            <div className="text-center py-20">
              <div className="font-semibold text-ink">
                {searchQuery || vegOnly || selectedCat ? "No dishes found" : "No menu items available"}
              </div>
              {(searchQuery || vegOnly || selectedCat) && (
                <div className="text-muted text-sm mt-1">Try a different search or filter</div>
              )}
            </div>
          ) : (
            sections.map((cat) => (
              <section key={cat._id} id={`cat-${cat._id}`} className="scroll-mt-56 lg:scroll-mt-24 pt-6 lg:pt-8">
                <h2 className="font-display text-ink font-semibold text-lg lg:text-xl mb-3 lg:mb-5">
                  {cat.name}{" "}
                  <span className="text-faint font-sans font-normal text-sm">({cat.items.length})</span>
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-x-3 gap-y-5 md:gap-x-4 md:gap-y-6 lg:gap-x-5 lg:gap-y-7">
                  {cat.items.map((item) => (
                    <ItemCard key={item._id} item={item} onOpen={setSelectedItem} />
                  ))}
                </div>
              </section>
            ))
          )}
        </div>
      </div>


      {/* ═══════════════════════════════════════════════════════════
          FLOATING CART BAR
      ═══════════════════════════════════════════════════════════ */}
      {cartCount > 0 && !cartOpen && (
        <div className="fixed bottom-0 left-0 right-0 lg:left-56 xl:left-60 z-60 pointer-events-none">
          <div className="max-w-120 lg:max-w-md mx-auto px-4 pb-5 pt-6 bg-linear-to-t from-page via-page/90 to-transparent pointer-events-auto">
            <button
              onClick={() => setCartOpen(true)}
              className="w-full bg-accent text-white rounded-2xl py-4 font-bold flex items-center justify-between px-5 shadow-xl shadow-accent/30 active:scale-[0.98] active:bg-accent-hover transition-transform"
            >
              <div className="bg-white/20 rounded-xl w-8 h-8 flex items-center justify-center text-sm font-bold">{cartCount}</div>
              <span className="font-bold text-base">View Cart</span>
              <span className="font-bold text-base">₹{cartGrandTotal.toFixed(2)}</span>
            </button>
          </div>
        </div>
      )}


      {/* ═══════════════════════════════════════════════════════════
          MODALS
      ═══════════════════════════════════════════════════════════ */}
      {selectedItem && (
        <ItemDetailModal
          item={selectedItem}
          restaurantIsPro={restaurantIsPro}
          onClose={() => setSelectedItem(null)}
          onReview={() => handleReview(selectedItem)}
        />
      )}

      {/* Floating draggable order tracker for desktop — bottom right */}
      {!isKiosk && orderCount > 0 && (
        <div
          ref={dragRef}
          style={{ bottom: floatingPos.y, right: floatingPos.x }}
          className="hidden lg:flex fixed z-50 items-center gap-2 bg-ok text-white rounded-full pl-2 pr-5 py-2.5 cursor-grab active:cursor-grabbing shadow-lg hover:shadow-xl select-none transition-shadow"
          onPointerDown={(e) => {
            const el = dragRef.current;
            if (!el) return;
            el.setPointerCapture(e.pointerId);
            const startX = e.clientX, startY = e.clientY;
            const startRight = floatingPos.x, startBottom = floatingPos.y;
            let moved = false;
            const onMove = (ev) => {
              const dx = ev.clientX - startX, dy = ev.clientY - startY;
              if (Math.abs(dx) > 3 || Math.abs(dy) > 3) moved = true;
              const newRight = Math.max(8, Math.min(window.innerWidth - 200, startRight - dx));
              const newBottom = Math.max(8, Math.min(window.innerHeight - 60, startBottom + (startY - ev.clientY)));
              setFloatingPos({ x: newRight, y: newBottom });
            };
            const onUp = (ev) => {
              el.releasePointerCapture(ev.pointerId);
              el.removeEventListener("pointermove", onMove);
              el.removeEventListener("pointerup", onUp);
              if (!moved) setTrackerOpen(true);
            };
            el.addEventListener("pointermove", onMove);
            el.addEventListener("pointerup", onUp);
          }}
        >
          <GripVertical size={14} className="text-white/50 shrink-0" />
          <span className="w-2 h-2 rounded-full bg-white animate-pulse shrink-0" />
          <span className="text-sm font-semibold">
            {orderCount} order{orderCount > 1 ? "s" : ""} placed
          </span>
          <span className="text-sm font-bold">→</span>
        </div>
      )}

      <CartDrawer
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        tableId={table?._id}
        tableName={table?.name}
        restaurantId={restaurantId}
        sessionId={sessionId}
        gstPercent={restaurant?.gstPercent ?? 5}
        isKiosk={isKiosk}
        onOrderPlaced={handleOrderPlaced}
        onKioskReset={handleKioskReset}
      />

      {!isKiosk && reviewItem && (
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

      {!isKiosk && showAuth && (
        <CustomerAuthModal
          restaurantId={restaurantId}
          onClose={() => setShowAuth(false)}
          onLoginClick={() => { setShowAuth(false); handleGoToLogin(); }}
          onRegisterClick={() => { setShowAuth(false); handleGoToRegister(); }}
        />
      )}

      {!isKiosk && <OrderTracker sessionId={sessionId} isOpen={trackerOpen} onClose={() => setTrackerOpen(false)} />}
      {!isKiosk && <OrderHistoryModal isOpen={historyOpen} onClose={() => setHistoryOpen(false)} />}

      {/* ── Logout Confirmation ── */}
      {showLogoutConfirm && (
        <div onClick={() => setShowLogoutConfirm(false)}
          className="fixed inset-0 bg-ink/40 z-200 flex items-center justify-center p-4">
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-xs bg-surface rounded-2xl p-5 shadow-2xl border border-line text-center">
            <div className="w-10 h-10 mx-auto mb-3 rounded-full bg-accent-soft flex items-center justify-center">
              <LogOutIcon size={18} className="text-accent" />
            </div>
            <h3 className="font-display text-ink font-semibold text-lg">Log out?</h3>
            <p className="text-muted text-xs mt-1 mb-5">Your cart will stay, but order history needs login.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-page border border-line text-ink">Cancel</button>
              <button onClick={() => { setShowLogoutConfirm(false); handleLogout(); }}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-accent text-white">Yes, Log out</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
