import { useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Plus, Minus, Trash2, ShoppingCart } from "lucide-react";
import toast from "react-hot-toast";

import { getMenuItemsApi } from "../../api/menuItemApi";
import { getCategoriesApi } from "../../api/categoryApi";
import { createCounterOrderApi } from "../../api/orderApi";
import { useOrders } from "../../context/OrdersContext";
import KitchenSlip from "../../components/admin/KitchenSlip";

const PAYMENT_OPTIONS = [
  { value: "cash", label: "Cash" },
  { value: "online", label: "UPI / Card" },
];

const round2 = (n) => Math.round(n * 100) / 100;

function VegDot({ isVeg }) {
  const color = isVeg ? "border-green-600" : "border-red-600";
  const dot = isVeg ? "bg-green-600" : "bg-red-600";
  return (
    <span className={`inline-flex items-center justify-center w-4 h-4 border-2 rounded-sm shrink-0 bg-white ${color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
    </span>
  );
}

// "Add" turns into  [ - 1 + ]  as soon as the item is in the cart
function QtyControl({ qty, label, onAdd, onMinus, onPlus }) {
  if (qty > 0) {
    return (
      <div className="flex-1 h-8 flex items-center justify-between rounded-lg bg-blue-600 text-white overflow-hidden">
        <button
          onClick={onMinus}
          className="w-8 h-8 flex items-center justify-center hover:bg-blue-700 active:bg-blue-800 cursor-pointer transition-colors"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
        <span className="text-xs font-bold">{qty}</span>
        <button
          onClick={onPlus}
          className="w-8 h-8 flex items-center justify-center hover:bg-blue-700 active:bg-blue-800 cursor-pointer transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }
  return (
    <button
      onClick={onAdd}
      className="flex-1 h-8 rounded-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-semibold transition-all duration-150 cursor-pointer active:scale-[0.98]"
    >
      {label}
    </button>
  );
}

export default function CounterOrder() {
  const { restaurant, refetchOrders } = useOrders();
  const cartRef = useRef(null);

  // Same query keys as Dashboard / MenuManager → shared cache, no extra calls
  const { data: menuItemsData, isLoading: itemsLoading } = useQuery({
    queryKey: ["menuItems"],
    queryFn: async () => (await getMenuItemsApi()).items || [],
  });
  const { data: categoriesData, isLoading: catsLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => (await getCategoriesApi()).categories || [],
  });
  const menuItems = menuItemsData || [];
  const categories = categoriesData || [];

  const [activeCat, setActiveCat] = useState("all");
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState([]);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [payment, setPayment] = useState("cash");
  const [placing, setPlacing] = useState(false);
  const [billOrder, setBillOrder] = useState(null);

  const visibleItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    return menuItems.filter((m) => {
      const catId = m.categoryId?._id || m.categoryId;
      if (activeCat !== "all" && catId !== activeCat) return false;
      if (q && !m.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [menuItems, activeCat, search]);

  // quantity of each cart line, looked up by key → used by the Add / - 1 + buttons
  const qtyMap = useMemo(() => Object.fromEntries(cart.map((l) => [l.key, l.qty])), [cart]);
  const keyOf = (item, portion) => `${item._id}:${portion || "full"}`;

  const addToCart = (item, portion = null) => {
    const price = portion === "half" ? item.halfPrice : item.price;
    const key = keyOf(item, portion);
    setCart((prev) => {
      const existing = prev.find((l) => l.key === key);
      if (existing) return prev.map((l) => (l.key === key ? { ...l, qty: l.qty + 1 } : l));
      return [...prev, { key, menuItemId: item._id, name: item.name, price, qty: 1, portion, isVeg: item.isVeg }];
    });
  };

  const changeQty = (key, delta) => {
    setCart((prev) =>
      prev.map((l) => (l.key === key ? { ...l, qty: l.qty + delta } : l)).filter((l) => l.qty > 0),
    );
  };

  const removeLine = (key) => setCart((prev) => prev.filter((l) => l.key !== key));

  const itemCount = cart.reduce((s, l) => s + l.qty, 0);
  const subtotal = cart.reduce((s, l) => s + l.price * l.qty, 0);
  const gstPercent = Number(restaurant?.gstPercent ?? 5);
  const hasGst = gstPercent > 0;
  const gstAmount = hasGst ? round2((subtotal * gstPercent) / 100) : 0;
  const total = round2(subtotal + gstAmount);

  const handlePlaceOrder = async () => {
    if (cart.length === 0) return toast.error("Add at least one item");

    const name = customerName.trim();
    const phone = customerPhone.replace(/\D/g, "");
    if (phone && phone.length !== 10) {
      return toast.error("Phone number must be 10 digits");
    }

    setPlacing(true);
    try {
      const res = await createCounterOrderApi({
        items: cart.map((l) => ({ menuItemId: l.menuItemId, qty: l.qty, portion: l.portion })),
        customerName: name,
        customerPhone: phone,
        paymentMethod: payment,
      });
      setBillOrder(res.order);
      setCart([]);
      setCustomerName("");
      setCustomerPhone("");
      setPayment("cash");
      refetchOrders();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not place the order");
    } finally {
      setPlacing(false);
    }
  };

  const loading = itemsLoading || catsLoading;

  return (
    // On large screens the page is exactly one screen tall: the title, search and
    // categories stay put, only the item grid (and the cart list) scroll inside.
    <div className="pb-24 lg:pb-0 lg:h-[calc(100vh-3rem)] lg:flex lg:flex-col">
      <div className="mb-4 shrink-0">
        <h1 className="text-2xl font-bold text-gray-900">Counter Order</h1>
        <p className="text-gray-600 text-sm mt-1">Take an order for a walk-in customer and print the bill.</p>
      </div>

      <div className="grid gap-6 lg:flex-1 lg:min-h-0 lg:grid-rows-[minmax(0,1fr)] lg:grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-[minmax(0,1fr)_380px]">
        {/* ───────── menu ───────── */}
        <div className="min-w-0 flex flex-col lg:min-h-0">
          <div className="shrink-0">
            <div className="relative mb-3">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search items..."
                className="w-full rounded-xl border border-gray-200 bg-white pl-10 pr-4 py-2.5 text-sm text-gray-900 outline-none focus:border-blue-600"
              />
            </div>

            <div className="flex gap-2 overflow-x-auto pb-3">
              {[{ _id: "all", name: "All" }, ...categories].map((c) => (
                <button
                  key={c._id}
                  onClick={() => setActiveCat(c._id)}
                  className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium border transition-all duration-150 cursor-pointer active:scale-[0.98] ${
                    activeCat === c._id
                      ? "bg-blue-600 border-blue-600 text-white"
                      : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          <div className="lg:flex-1 lg:min-h-0 lg:overflow-y-auto lg:pr-1">
            {loading ? (
              <div className="text-gray-400 text-sm py-10 text-center">Loading menu...</div>
            ) : visibleItems.length === 0 ? (
              <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center text-gray-600">
                No items found
              </div>
            ) : (
              <div className="grid grid-cols-[repeat(auto-fill,minmax(165px,1fr))] gap-3 pb-2">
                {visibleItems.map((item) => {
                  const unavailable = item.isAvailable === false;
                  const hasHalf = item.halfPrice != null;
                  const fullKey = keyOf(item, hasHalf ? "full" : null);
                  const halfKey = keyOf(item, "half");
                  return (
                    <div
                      key={item._id}
                      className={`aspect-square rounded-2xl border border-gray-200 bg-white p-2.5 flex flex-col ${
                        unavailable ? "opacity-50" : ""
                      }`}
                    >
                      <div className="relative flex-1 min-h-0 rounded-xl overflow-hidden bg-gray-100">
                        {item.image ? (
                          <img src={item.image} alt={item.name} className="absolute inset-0 w-full h-full object-cover" />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center text-3xl font-bold text-gray-300">
                            {item.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="absolute top-1.5 left-1.5">
                          <VegDot isVeg={item.isVeg} />
                        </div>
                      </div>

                      <div className="mt-2 text-[13px] font-semibold text-gray-900 leading-tight line-clamp-2 min-h-[2rem]">
                        {item.name}
                      </div>

                      <div className="mt-1.5 flex items-center gap-1.5">
                        {unavailable ? (
                          <span className="text-xs font-medium text-gray-600">Unavailable</span>
                        ) : hasHalf ? (
                          <>
                            <QtyControl
                              qty={qtyMap[halfKey] || 0}
                              label={`Half ₹${item.halfPrice}`}
                              onAdd={() => addToCart(item, "half")}
                              onMinus={() => changeQty(halfKey, -1)}
                              onPlus={() => changeQty(halfKey, 1)}
                            />
                            <QtyControl
                              qty={qtyMap[fullKey] || 0}
                              label={`Full ₹${item.price}`}
                              onAdd={() => addToCart(item, "full")}
                              onMinus={() => changeQty(fullKey, -1)}
                              onPlus={() => changeQty(fullKey, 1)}
                            />
                          </>
                        ) : (
                          <>
                            <span className="text-sm font-bold text-gray-900 mr-auto pl-0.5">₹{item.price}</span>
                            <div className="w-[88px] flex">
                              <QtyControl
                                qty={qtyMap[fullKey] || 0}
                                label="Add"
                                onAdd={() => addToCart(item, null)}
                                onMinus={() => changeQty(fullKey, -1)}
                                onPlus={() => changeQty(fullKey, 1)}
                              />
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ───────── cart (always visible on large screens) ───────── */}
        <div
          ref={cartRef}
          className="rounded-2xl border border-gray-200 bg-white p-5 flex flex-col lg:h-full lg:min-h-0 scroll-mt-20"
        >
          <div className="flex items-center gap-2 mb-4 shrink-0">
            <ShoppingCart className="w-5 h-5 text-gray-900" />
            <h2 className="font-bold text-gray-900">Current order</h2>
          </div>

          <div className="max-h-80 lg:max-h-none lg:flex-1 lg:min-h-[96px] overflow-y-auto pr-1">
            {cart.length === 0 ? (
              <div className="text-sm text-gray-400 py-6 text-center">Tap Add on an item to start</div>
            ) : (
              <div className="space-y-3">
                {cart.map((l) => (
                  <div key={l.key} className="flex items-start gap-3">
                    <VegDot isVeg={l.isVeg} />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {l.name}
                        {l.portion === "half" ? " (Half)" : ""}
                      </div>
                      <div className="text-xs text-gray-600">
                        ₹{l.price} × {l.qty} = ₹{l.price * l.qty}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => changeQty(l.key, -1)}
                        className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 active:bg-gray-100 cursor-pointer transition-all duration-150"
                      >
                        <Minus className="w-3.5 h-3.5 text-gray-600" />
                      </button>
                      <span className="w-6 text-center text-sm font-semibold text-gray-900">{l.qty}</span>
                      <button
                        onClick={() => changeQty(l.key, 1)}
                        className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 active:bg-gray-100 cursor-pointer transition-all duration-150"
                      >
                        <Plus className="w-3.5 h-3.5 text-gray-600" />
                      </button>
                      <button
                        onClick={() => removeLine(l.key)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-gray-50 active:bg-gray-100 cursor-pointer transition-all duration-150"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-gray-400" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="shrink-0">
            {/* totals — GST rows only appear when GST is above 0% */}
            <div className="mt-4 pt-4 border-t border-gray-200 space-y-1.5 text-sm">
              {hasGst && (
                <>
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span>₹{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>GST ({gstPercent}%)</span>
                    <span>₹{gstAmount.toFixed(2)}</span>
                  </div>
                </>
              )}
              <div className="flex justify-between text-gray-900 font-bold text-base pt-1">
                <span>Total</span>
                <span>₹{total.toFixed(2)}</span>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <div className="text-xs font-medium text-gray-600">Customer (optional: name, phone, both, or leave empty)</div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Name"
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-blue-600"
                />
                <input
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="Phone"
                  inputMode="numeric"
                  maxLength={13}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-blue-600"
                />
              </div>
            </div>

            <div className="mt-4">
              <div className="text-xs font-medium text-gray-600 mb-2">Payment received via</div>
              <div className="grid grid-cols-2 gap-2">
                {PAYMENT_OPTIONS.map((p) => (
                  <button
                    key={p.value}
                    onClick={() => setPayment(p.value)}
                    className={`rounded-xl border px-2 py-2.5 text-sm font-semibold transition-all duration-150 cursor-pointer active:scale-[0.98] ${
                      payment === p.value
                        ? "bg-blue-600 border-blue-600 text-white"
                        : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handlePlaceOrder}
              disabled={placing || cart.length === 0}
              className="mt-4 w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-sm transition-all duration-150 cursor-pointer active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {placing ? "Placing order..." : `Place order & print bill · ₹${total.toFixed(2)}`}
            </button>
          </div>
        </div>
      </div>

      {/* mobile bottom bar */}
      {cart.length > 0 && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-200 px-4 py-3 flex items-center justify-between">
          <div>
            <div className="text-xs text-gray-600">
              {itemCount} item{itemCount !== 1 ? "s" : ""}
            </div>
            <div className="font-bold text-gray-900">₹{total.toFixed(2)}</div>
          </div>
          <button
            onClick={() => cartRef.current?.scrollIntoView({ behavior: "auto", block: "start" })}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-sm transition-all duration-150 cursor-pointer"
          >
            View order
          </button>
        </div>
      )}

      {billOrder && (
        <KitchenSlip
          order={billOrder}
          onClose={() => setBillOrder(null)}
          onPrinted={() => {}}
          hideNote
          closeLabel="Done"
        />
      )}
    </div>
  );
}







































// import { useMemo, useRef, useState } from "react";
// import { useQuery } from "@tanstack/react-query";
// import { Search, Plus, Minus, Trash2, ShoppingCart } from "lucide-react";
// import toast from "react-hot-toast";

// import { getMenuItemsApi } from "../../api/menuItemApi";
// import { getCategoriesApi } from "../../api/categoryApi";
// import { createCounterOrderApi } from "../../api/orderApi";
// import { useOrders } from "../../context/OrdersContext";
// import KitchenSlip from "../../components/admin/KitchenSlip";

// const PAYMENT_OPTIONS = [
//   { value: "cash", label: "Cash" },
//   { value: "online", label: "UPI / Card" },
// ];

// const round2 = (n) => Math.round(n * 100) / 100;

// function VegDot({ isVeg }) {
//   const color = isVeg ? "border-green-600" : "border-red-600";
//   const dot = isVeg ? "bg-green-600" : "bg-red-600";
//   return (
//     <span
//       className={`inline-flex items-center justify-center w-4 h-4 border-2 rounded-sm shrink-0 ${color}`}
//     >
//       <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
//     </span>
//   );
// }

// export default function CounterOrder() {
//   const { restaurant, refetchOrders } = useOrders();
//   const cartRef = useRef(null);

//   // Same query keys as Dashboard / MenuManager → shared cache, no extra calls
//   const { data: menuItemsData, isLoading: itemsLoading } = useQuery({
//     queryKey: ["menuItems"],
//     queryFn: async () => (await getMenuItemsApi()).items || [],
//   });
//   const { data: categoriesData, isLoading: catsLoading } = useQuery({
//     queryKey: ["categories"],
//     queryFn: async () => (await getCategoriesApi()).categories || [],
//   });
//   const menuItems = menuItemsData || [];
//   const categories = categoriesData || [];

//   const [activeCat, setActiveCat] = useState("all");
//   const [search, setSearch] = useState("");
//   const [cart, setCart] = useState([]);
//   const [customerName, setCustomerName] = useState("");
//   const [customerPhone, setCustomerPhone] = useState("");
//   const [payment, setPayment] = useState("cash");
//   const [placing, setPlacing] = useState(false);
//   const [billOrder, setBillOrder] = useState(null); // order whose bill is open

//   // ── menu filtering ────────────────────────────────────────────────
//   const visibleItems = useMemo(() => {
//     const q = search.trim().toLowerCase();
//     return menuItems.filter((m) => {
//       const catId = m.categoryId?._id || m.categoryId;
//       if (activeCat !== "all" && catId !== activeCat) return false;
//       if (q && !m.name.toLowerCase().includes(q)) return false;
//       return true;
//     });
//   }, [menuItems, activeCat, search]);

//   // ── cart helpers ──────────────────────────────────────────────────
//   const addToCart = (item, portion = null) => {
//     const price = portion === "half" ? item.halfPrice : item.price;
//     const key = `${item._id}:${portion || "full"}`;
//     setCart((prev) => {
//       const existing = prev.find((l) => l.key === key);
//       if (existing) {
//         return prev.map((l) => (l.key === key ? { ...l, qty: l.qty + 1 } : l));
//       }
//       return [
//         ...prev,
//         {
//           key,
//           menuItemId: item._id,
//           name: item.name,
//           price,
//           qty: 1,
//           portion,
//           isVeg: item.isVeg,
//         },
//       ];
//     });
//   };

//   const changeQty = (key, delta) => {
//     setCart((prev) =>
//       prev
//         .map((l) => (l.key === key ? { ...l, qty: l.qty + delta } : l))
//         .filter((l) => l.qty > 0),
//     );
//   };

//   const removeLine = (key) => setCart((prev) => prev.filter((l) => l.key !== key));

//   const itemCount = cart.reduce((s, l) => s + l.qty, 0);
//   const subtotal = cart.reduce((s, l) => s + l.price * l.qty, 0);
//   const gstPercent = restaurant?.gstPercent ?? 5;
//   const gstAmount = round2((subtotal * gstPercent) / 100);
//   const total = round2(subtotal + gstAmount);

//   // ── place order → open the bill ───────────────────────────────────
//   const handlePlaceOrder = async () => {
//     if (cart.length === 0) return toast.error("Add at least one item");

//     const name = customerName.trim();
//     const phone = customerPhone.replace(/\D/g, "");

//     // if ((name && !phone) || (!name && phone)) {
//     //   return toast.error("Enter both name and phone, or leave both empty");
//     // }

//     if (phone && phone.length !== 10) {
//       return toast.error("Phone number must be 10 digits");
//     }

//     setPlacing(true);
//     try {
//       const res = await createCounterOrderApi({
//         items: cart.map((l) => ({
//           menuItemId: l.menuItemId,
//           qty: l.qty,
//           portion: l.portion,
//         })),
//         customerName: name,
//         customerPhone: phone,
//         paymentMethod: payment,
//       });
//       setBillOrder(res.order); // opens the bill with the Print button
//       setCart([]);
//       setCustomerName("");
//       setCustomerPhone("");
//       setPayment("cash");
//       refetchOrders(); // so the Orders page already has it
//     } catch (err) {
//       toast.error(err.response?.data?.message || "Could not place the order");
//     } finally {
//       setPlacing(false);
//     }
//   };

//   const loading = itemsLoading || catsLoading;

//   return (
//     <div className="pb-24 lg:pb-0">
//       <div className="mb-5">
//         <h1 className="text-2xl font-bold text-gray-900">Counter Order</h1>
//         <p className="text-gray-600 text-sm mt-1">
//           Take an order for a walk-in customer and print the bill.
//         </p>
//       </div>

//       <div className="grid gap-6 lg:grid-cols-[1fr_380px] items-start">
//         {/* ───────── menu ───────── */}
//         <div className="min-w-0">
//           <div className="relative mb-4">
//             <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
//             <input
//               value={search}
//               onChange={(e) => setSearch(e.target.value)}
//               placeholder="Search items..."
//               className="w-full rounded-xl border border-gray-200 bg-white pl-10 pr-4 py-2.5 text-sm text-gray-900 outline-none focus:border-blue-600"
//             />
//           </div>

//           <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
//             {[{ _id: "all", name: "All" }, ...categories].map((c) => (
//               <button
//                 key={c._id}
//                 onClick={() => setActiveCat(c._id)}
//                 className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium border transition-all duration-150 cursor-pointer active:scale-[0.98] ${
//                   activeCat === c._id
//                     ? "bg-blue-600 border-blue-600 text-white"
//                     : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
//                 }`}
//               >
//                 {c.name}
//               </button>
//             ))}
//           </div>

//           {loading ? (
//             <div className="text-gray-400 text-sm py-10 text-center">Loading menu...</div>
//           ) : visibleItems.length === 0 ? (
//             <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center text-gray-600">
//               No items found
//             </div>
//           ) : (
//             <div className="grid gap-3 sm:grid-cols-2">
//               {visibleItems.map((item) => {
//                 const unavailable = item.isAvailable === false;
//                 const hasHalf = item.halfPrice != null;
//                 return (
//                   <div
//                     key={item._id}
//                     className={`rounded-2xl border border-gray-200 bg-white p-4 flex gap-3 ${
//                       unavailable ? "opacity-50" : ""
//                     }`}
//                   >
//                     {item.image ? (
//                       <img
//                         src={item.image}
//                         alt={item.name}
//                         className="w-16 h-16 rounded-xl object-cover shrink-0"
//                       />
//                     ) : null}
//                     <div className="min-w-0 flex-1">
//                       <div className="flex items-center gap-2">
//                         <VegDot isVeg={item.isVeg} />
//                         <span className="font-semibold text-gray-900 text-sm truncate">
//                           {item.name}
//                         </span>
//                       </div>

//                       {unavailable ? (
//                         <div className="mt-3 text-xs font-medium text-gray-600">
//                           Unavailable
//                         </div>
//                       ) : hasHalf ? (
//                         <div className="mt-3 flex gap-2">
//                           <button
//                             onClick={() => addToCart(item, "half")}
//                             className="flex-1 rounded-lg border border-blue-600 text-blue-600 hover:bg-blue-50 active:bg-blue-100 text-xs font-semibold py-1.5 transition-all duration-150 cursor-pointer active:scale-[0.98]"
//                           >
//                             Half ₹{item.halfPrice}
//                           </button>
//                           <button
//                             onClick={() => addToCart(item, "full")}
//                             className="flex-1 rounded-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-semibold py-1.5 transition-all duration-150 cursor-pointer active:scale-[0.98]"
//                           >
//                             Full ₹{item.price}
//                           </button>
//                         </div>
//                       ) : (
//                         <div className="mt-3 flex items-center justify-between">
//                           <span className="text-gray-900 font-semibold text-sm">
//                             ₹{item.price}
//                           </span>
//                           <button
//                             onClick={() => addToCart(item, null)}
//                             className="rounded-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-semibold px-4 py-1.5 transition-all duration-150 cursor-pointer active:scale-[0.98]"
//                           >
//                             Add
//                           </button>
//                         </div>
//                       )}
//                     </div>
//                   </div>
//                 );
//               })}
//             </div>
//           )}
//         </div>

//         {/* ───────── cart ───────── */}
//         <div
//           ref={cartRef}
//           className="rounded-2xl border border-gray-200 bg-white p-5 lg:sticky lg:top-6 scroll-mt-20"
//         >
//           <div className="flex items-center gap-2 mb-4">
//             <ShoppingCart className="w-5 h-5 text-gray-900" />
//             <h2 className="font-bold text-gray-900">Current order</h2>
//           </div>

//           {cart.length === 0 ? (
//             <div className="text-sm text-gray-400 py-6 text-center">
//               Tap an item to add it
//             </div>
//           ) : (
//             <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
//               {cart.map((l) => (
//                 <div key={l.key} className="flex items-start gap-3">
//                   <VegDot isVeg={l.isVeg} />
//                   <div className="min-w-0 flex-1">
//                     <div className="text-sm font-medium text-gray-900 truncate">
//                       {l.name}
//                       {l.portion === "half" ? " (Half)" : ""}
//                     </div>
//                     <div className="text-xs text-gray-600">
//                       ₹{l.price} × {l.qty} = ₹{l.price * l.qty}
//                     </div>
//                   </div>
//                   <div className="flex items-center gap-1 shrink-0">
//                     <button
//                       onClick={() => changeQty(l.key, -1)}
//                       className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 active:bg-gray-100 cursor-pointer transition-all duration-150"
//                     >
//                       <Minus className="w-3.5 h-3.5 text-gray-600" />
//                     </button>
//                     <span className="w-6 text-center text-sm font-semibold text-gray-900">
//                       {l.qty}
//                     </span>
//                     <button
//                       onClick={() => changeQty(l.key, 1)}
//                       className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 active:bg-gray-100 cursor-pointer transition-all duration-150"
//                     >
//                       <Plus className="w-3.5 h-3.5 text-gray-600" />
//                     </button>
//                     <button
//                       onClick={() => removeLine(l.key)}
//                       className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-gray-50 active:bg-gray-100 cursor-pointer transition-all duration-150"
//                     >
//                       <Trash2 className="w-3.5 h-3.5 text-gray-400" />
//                     </button>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           )}

//           {/* totals */}
//           <div className="mt-5 pt-4 border-t border-gray-200 space-y-1.5 text-sm">
//             <div className="flex justify-between text-gray-600">
//               <span>Subtotal</span>
//               <span>₹{subtotal.toFixed(2)}</span>
//             </div>
//             <div className="flex justify-between text-gray-600">
//               <span>GST ({gstPercent}%)</span>
//               <span>₹{gstAmount.toFixed(2)}</span>
//             </div>
//             <div className="flex justify-between text-gray-900 font-bold text-base pt-1">
//               <span>Total</span>
//               <span>₹{total.toFixed(2)}</span>
//             </div>
//           </div>

//           {/* customer (optional) */}
//           <div className="mt-5 space-y-2">
//             <div className="text-xs font-medium text-gray-600">
//                 Customer (optional)
//                 {/* Customer (optional: name, phone, both, or leave empty) */}
//             </div>
//             <input
//               value={customerName}
//               onChange={(e) => setCustomerName(e.target.value)}
//               placeholder="Name"
//               className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 outline-none focus:border-blue-600"
//             />
//             <input
//               value={customerPhone}
//               onChange={(e) => setCustomerPhone(e.target.value)}
//               placeholder="Phone (10 digits)"
//               inputMode="numeric"
//               maxLength={13}
//               className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 outline-none focus:border-blue-600"
//             />
//           </div>

//           {/* payment */}
//           <div className="mt-5">
//             <div className="text-xs font-medium text-gray-600 mb-2">Payment received via</div>
//             <div className="grid grid-cols-2 gap-2">
//               {PAYMENT_OPTIONS.map((p) => (
//                 <button
//                   key={p.value}
//                   onClick={() => setPayment(p.value)}
//                   className={`rounded-xl border px-2 py-2.5 text-sm font-semibold transition-all duration-150 cursor-pointer active:scale-[0.98] ${
//                     payment === p.value
//                       ? "bg-blue-600 border-blue-600 text-white"
//                       : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
//                   }`}
//                 >
//                   {p.label}
//                 </button>
//               ))}
//             </div>
//           </div>

//           <button
//             onClick={handlePlaceOrder}
//             disabled={placing || cart.length === 0}
//             className="mt-5 w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-sm transition-all duration-150 cursor-pointer active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
//           >
//             {/* {placing ? "Placing order..." : `Place order & print bill · ₹${total.toFixed(2)}`} */}

//             {placing ? "Placing order..." : `Place order`}
//           </button>
//         </div>
//       </div>

//       {/* mobile bottom bar */}
//       {cart.length > 0 && (
//         <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-200 px-4 py-3 flex items-center justify-between">
//           <div>
//             <div className="text-xs text-gray-600">
//               {itemCount} item{itemCount !== 1 ? "s" : ""}
//             </div>
//             <div className="font-bold text-gray-900">₹{total.toFixed(2)}</div>
//           </div>
//           <button
//             onClick={() =>
//               cartRef.current?.scrollIntoView({ behavior: "auto", block: "start" })
//             }
//             className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-sm transition-all duration-150 cursor-pointer"
//           >
//             View order
//           </button>
//         </div>
//       )}

//       {/* the old bill, opened right after the order is placed */}
//       {billOrder && (
//         <KitchenSlip
//           order={billOrder}
//           onClose={() => setBillOrder(null)}
//           onPrinted={() => {}}
//           hideNote
//           closeLabel="Done"
//         />
//       )}
//     </div>
//   );
// }