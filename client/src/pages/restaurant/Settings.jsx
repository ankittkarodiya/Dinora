import { useState, useEffect, useRef } from "react";
import {
  getMyRestaurantApi,
  updateRestaurantApi,
  uploadLogoApi,
} from "../../api/restaurantApi";
import {
  addRazorpayKeysApi,
  getSubscriptionStatusApi,
  createSubscriptionOrderApi,
  verifySubscriptionApi,
} from "../../api/subscriptionApi";
import { fetchWithRetry } from "../../utils/fetchWithRetry";
import toast from "react-hot-toast";
import PasswordInput from "../../components/common/PasswordInput";

// import { isNotificationSoundEnabled, setNotificationSoundEnabled } from "../../utils/notificationPrefs";
import {
  isNotificationSoundEnabled,
  setNotificationSoundEnabled,
  getSelectedSound,
  setSelectedSound,
  canUseNotificationSound,
} from "../../utils/notificationPrefs";
import { SOUND_PRESETS, playSound } from "../../utils/notificationSounds";

const PLANS = [
  {
    id: "basic",
    name: "Basic",
    monthlyPrice: 699,
    yearlyPrice: 6999,
    // features: ["QR ordering", "Menu management", "Up to 10 tables", "Bill printing", "Order tracking for customers", "Cash & online payments"],
    features: [
      "QR code generation for every table",
      "Digital menu with categories and photos",
      "Veg/Non-veg tagging and bestseller marking",
      "Real-time order tracking for kitchen and customers",
      "Kitchen order dashboard",
      "Printable kitchen slips with GST breakdown",
      "Table management",
      "Order history with date-range filtering",
      "Cash and online payments (your own Razorpay)",
      "Up to 15 tables",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    monthlyPrice: 1299,
    yearlyPrice: 12999,
    badge: "Most Popular",
    // features: ["Everything in Basic", "Analytics dashboard", "Customer reviews", "Up to 30 tables", ],
    features: [
      "Everything in Basic",
      "Customer reviews and dish ratings",
      "Top-rated dishes ranking",
      "Revenue and order trend charts for 7/14/30 days or custom range",
      "Payment method breakdown (cash vs online)",
      "Overall rating summary with star distribution",
      "Up to 30 tables",
    ],
  },
];

// works out exactly how much is saved by paying yearly instead of
// 12 separate monthly payments — computed here, never hardcoded
const getYearlySavings = (plan) => {
  const fullYearAtMonthlyRate = plan.monthlyPrice * 12;
  const savings = fullYearAtMonthlyRate - plan.yearlyPrice;
  const percentSaved = Math.round((savings / fullYearAtMonthlyRate) * 100);
  return { savings, percentSaved };
};

export default function Settings() {
  const [restaurant, setRestaurant] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);

  // const [saving, setSaving] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false); // ← renamed from `saving`
  const [linkingRazorpay, setLinkingRazorpay] = useState(false); // ← new, separate state
  const [payingPlan, setPayingPlan] = useState(null);
  const [billingCycle, setBillingCycle] = useState("monthly"); // ← new toggle state

  const [profileForm, setProfileForm] = useState({
    name: "",
    description: "",
    phone: "",
    address: "",
    gstNumber: "",
    gstPercent: "5",
  });
  const [razorpayForm, setRazorpayForm] = useState({
    keyId: "",
    keySecret: "",
  });
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [fetchError, setFetchError] = useState(false);

  // new for notification sound
  // inside your component, alongside other useState:
  const [soundEnabled, setSoundEnabledState] = useState(true);
  const [selectedSound, setSelectedSoundState] = useState("chime");
  useEffect(() => {
    setSoundEnabledState(isNotificationSoundEnabled());
    setSelectedSoundState(getSelectedSound()); // ← new
  }, []);

  const handleSoundChange = (soundId) => {
    setSelectedSoundState(soundId);
    setSelectedSound(soundId);
    playSound(soundId); // ← instantly previews it when picked
  };

  const restaurantIsPro = restaurant?.subscriptionPlan === "pro"; // if you don't already have this derived somewhere
  const notificationSoundAllowed = canUseNotificationSound(restaurantIsPro); // ← new

  const toggleSound = () => {
    // if (!restaurantIsPro) return; // locked for non-Pro

    if (!notificationSoundAllowed) return; // ← was: if (!restaurantIsPro) return;

    const next = !soundEnabled;
    setSoundEnabledState(next);
    setNotificationSoundEnabled(next);
  };

  // derived value — recalculates on every render, no extra state needed
  // to disable the save profile btn when nothing changed in form
  const hasChanges =
    restaurant &&
    (profileForm.name !== (restaurant.name || "") ||
      profileForm.description !== (restaurant.description || "") ||
      profileForm.phone !== (restaurant.phone || "") ||
      profileForm.address !== (restaurant.address || "") ||
      profileForm.gstNumber !== (restaurant.gstNumber || "") ||
      profileForm.gstPercent !== String(restaurant.gstPercent ?? "5") ||
      logoFile !== null); // ← also counts as a change if they picked a new logo

  const hasFetchedRef = useRef(false);

  useEffect(() => {
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      const [restData, subData] = await fetchWithRetry(() =>
        Promise.all([getMyRestaurantApi(), getSubscriptionStatusApi()]),
      );
      const rest = restData.restaurant;
      setRestaurant(rest);
      setSubscription(subData.subscription);
      setProfileForm({
        name: rest.name || "",
        description: rest.description || "",
        phone: rest.phone || "",
        address: rest.address || "",
        gstNumber: rest.gstNumber || "",
        gstPercent: String(rest.gstPercent || "5"),
      });
      if (rest.razorpayKeyId)
        setRazorpayForm({ keyId: rest.razorpayKeyId, keySecret: "" });
      setLogoPreview(rest.logo || null);
      setFetchError(false);
    } catch {
      setFetchError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      if (logoFile) await uploadLogoApi(logoFile);
      const data = await updateRestaurantApi(profileForm);
      setRestaurant(data.restaurant);
      // ← THE FIX: also sync profileForm with the actual saved values,
      // since that's what the input fields are genuinely bound to
      setProfileForm({
        name: data.restaurant.name || "",
        description: data.restaurant.description || "",
        phone: data.restaurant.phone || "",
        address: data.restaurant.address || "",
        gstNumber: data.restaurant.gstNumber || "",
        gstPercent: String(data.restaurant.gstPercent ?? "5"),
      });

      toast.success("Profile updated");
    } catch {
      toast.error("Failed to update");
    } finally {
      // setSaving(false);
      setSavingProfile(false);
    }
  };

  const handleSaveRazorpay = async (e) => {
    e.preventDefault();
    if (!razorpayForm.keyId || !razorpayForm.keySecret) {
      return toast.error("Both Key ID and Secret are required");
    }
    // setSaving(true);
    setLinkingRazorpay(true);
    try {
      await addRazorpayKeysApi(razorpayForm);
      toast.success("Razorpay linked! Customers can now pay online.");
      setRestaurant((p) => ({
        ...p,
        razorpayLinked: true,
        razorpayKeyId: razorpayForm.keyId,
      }));
      setRazorpayForm((p) => ({ ...p, keySecret: "" }));
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to link Razorpay");
    } finally {
      // setSaving(false);
      setLinkingRazorpay(false);
    }
  };

  const handleSubscribe = async (planId) => {
    if (!window.Razorpay)
      return toast.error("Payment gateway not loaded. Refresh the page.");
    setPayingPlan(planId);
    try {
      const plan = PLANS.find((p) => p.id === planId);
      const price =
        billingCycle === "yearly" ? plan.yearlyPrice : plan.monthlyPrice;

      // ← FIX: actually pass billingCycle to the API call
      const data = await createSubscriptionOrderApi(planId, billingCycle);

      if (!data.success || !data.order) {
        toast.error(data.message || "Could not create payment");
        setPayingPlan(null);
        return;
      }
      const options = {
        key: data.keyId,
        amount: data.order.amount,
        currency: "INR",
        name: "Dinora",
        description: `${plan.name} Plan — ${billingCycle === "yearly" ? "Yearly" : "Monthly"}`,
        order_id: data.order.id,
        handler: async (response) => {
          try {
            // ← FIX: pass billingCycle here too, so the backend can look up
            // PLANS[plan][cycle] correctly and set the right expiry
            await verifySubscriptionApi({
              ...response,
              plan: planId,
              billingCycle,
            });
            toast.success("Subscription updated! 🎉");
            const subData = await getSubscriptionStatusApi();
            setSubscription(subData.subscription);
          } catch (err) {
            toast.error(err.response?.data?.message || "Verification failed");
          }
        },
        theme: { color: "#3B82F6" },
        modal: { ondismiss: () => setPayingPlan(null) },
      };
      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", (resp) => {
        toast.error(`Payment failed: ${resp.error.description}`);
        setPayingPlan(null);
      });
      rzp.open();
    } catch (err) {
      console.error("Subscribe error:", err);
      toast.error(err.response?.data?.message || "Could not start payment");
      setPayingPlan(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-400 text-sm animate-pulse">
          Loading settings...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-white font-bold text-2xl">Settings</h2>
        <p className="text-slate-400 text-sm mt-1">
          Manage your restaurant, subscription, and payments
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── LEFT: Main content ── */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <h3 className="text-white font-bold text-base mb-5">
              Restaurant Profile
            </h3>
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="flex gap-4 items-start">
                <input
                  id="settings-logo-input"
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="hidden"
                />
                <div className="flex-1">
                  <label className="block text-slate-300 text-xs font-bold uppercase tracking-wide mb-1.5">
                    Restaurant Name
                  </label>
                  <input
                    value={profileForm.name}
                    onChange={(e) =>
                      setProfileForm((p) => ({ ...p, name: e.target.value }))
                    }
                    className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white outline-none focus:border-blue-500 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 text-xs font-bold uppercase tracking-wide mb-1.5">
                  Description
                </label>
                <textarea
                  value={profileForm.description}
                  onChange={(e) =>
                    setProfileForm((p) => ({
                      ...p,
                      description: e.target.value,
                    }))
                  }
                  rows={2}
                  className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white outline-none focus:border-blue-500 text-sm resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 text-xs font-bold uppercase tracking-wide mb-1.5">
                    Phone
                  </label>
                  <input
                    value={profileForm.phone}
                    onChange={(e) =>
                      setProfileForm((p) => ({ ...p, phone: e.target.value }))
                    }
                    className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white outline-none focus:border-blue-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 text-xs font-bold uppercase tracking-wide mb-1.5">
                    Address
                  </label>
                  <input
                    value={profileForm.address}
                    onChange={(e) =>
                      setProfileForm((p) => ({ ...p, address: e.target.value }))
                    }
                    className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white outline-none focus:border-blue-500 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 text-xs font-bold uppercase tracking-wide mb-1.5">
                    GST Number
                  </label>
                  <input
                    value={profileForm.gstNumber}
                    onChange={(e) =>
                      setProfileForm((p) => ({
                        ...p,
                        gstNumber: e.target.value,
                      }))
                    }
                    placeholder="27AAAAA0000A1Z5"
                    className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white outline-none focus:border-blue-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 text-xs font-bold uppercase tracking-wide mb-1.5">
                    GST %
                  </label>
                  <input
                    type="number"
                    value={profileForm.gstPercent}
                    onChange={(e) =>
                      setProfileForm((p) => ({
                        ...p,
                        gstPercent: e.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white outline-none focus:border-blue-500 text-sm"
                  />
                </div>
              </div>

              <button
                type="submit"
                // disabled={savingProfile}
                disabled={savingProfile || !hasChanges}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm disabled:opacity-50"
              >
                {/* {saving ? "Saving..." : "Save Profile"} */}
                {savingProfile ? "Saving..." : "Save Profile"}
              </button>
            </form>
          </div>

          {/* Subscription Plans */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <h3 className="text-white font-bold text-base mb-1">
              Subscription Plans
            </h3>
            <p className="text-slate-400 text-xs mb-4">
              Upgrade or switch your plan anytime
            </p>

            {/* new for active plan details */}
            {/* ← NEW: subscription status banner, moved here from the sidebar */}
            {fetchError ? (
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 mb-4 flex items-center justify-between flex-wrap gap-3">
                <div>
                  <div className="text-amber-300 font-bold text-sm">
                    ⚠️ Couldn't verify subscription
                  </div>
                  <div className="text-slate-400 text-xs mt-0.5">
                    This is usually just a connection hiccup.
                  </div>
                </div>
                <button
                  onClick={() => window.location.reload()}
                  className="text-blue-400 text-xs font-semibold shrink-0"
                >
                  Retry →
                </button>
              </div>
            ) : (
              <div
                className={`rounded-xl border p-4 mb-4 flex items-center justify-between flex-wrap gap-3 ${
                  subscription?.status === "active"
                    ? "border-green-500/30 bg-green-500/10"
                    : "border-red-500/30 bg-red-500/10"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-lg shrink-0 ${
                      subscription?.status === "active"
                        ? "bg-green-500/20 text-green-300"
                        : "bg-red-500/20 text-red-300"
                    }`}
                  >
                    {subscription?.status === "active" ? "✓" : "✕"}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-white font-bold text-sm">
                        {subscription?.plan
                          ? `${subscription.plan.charAt(0).toUpperCase() + subscription.plan.slice(1)} Plan`
                          : "Trial"}
                      </span>
                      {subscription?.billingCycle &&
                        subscription?.plan !== "trial" && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/10 text-slate-300">
                            {subscription.billingCycle === "yearly"
                              ? "Yearly"
                              : "Monthly"}
                          </span>
                        )}
                    </div>
                    <div
                      className={`text-xs font-semibold mt-0.5 ${
                        subscription?.status === "active"
                          ? "text-green-300"
                          : "text-red-300"
                      }`}
                    >
                      {subscription?.status === "active" ? "Active" : "Expired"}
                    </div>
                  </div>
                </div>

                {subscription?.expiresAt && (
                  <div className="text-right shrink-0">
                    <div className="text-slate-500 text-[10px] uppercase font-bold tracking-wide">
                      {subscription.status === "active" ? "Renews" : "Expired"}
                    </div>
                    <div className="text-white text-sm font-semibold">
                      {new Date(subscription.expiresAt).toLocaleDateString(
                        "en-IN",
                        {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        },
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Billing cycle toggle */}
            <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-xl p-1 mb-4 max-w-full">
              <button
                onClick={() => setBillingCycle("monthly")}
                className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
                  billingCycle === "monthly"
                    ? "bg-blue-600 text-white"
                    : "text-slate-400"
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle("yearly")}
                className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all relative ${
                  billingCycle === "yearly"
                    ? "bg-blue-600 text-white"
                    : "text-slate-400"
                }`}
              >
                Yearly
                <span className="absolute -top-2 -right-2 bg-green-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full">
                  SAVE
                </span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {PLANS.map((plan) => {
                const price =
                  billingCycle === "yearly"
                    ? plan.yearlyPrice
                    : plan.monthlyPrice;
                const period = billingCycle === "yearly" ? "yr" : "mo";
                const { savings, percentSaved } = getYearlySavings(plan);
                // const isCurrent = subscription?.plan === plan.id && subscription?.status === "active";
                const isCurrent =
                  subscription?.plan === plan.id &&
                  subscription?.status === "active" &&
                  subscription?.billingCycle === billingCycle;

                return (
                  <div
                    key={plan.id}
                    className={`rounded-2xl border-2 p-4 relative transition-all flex flex-col ${
                      isCurrent
                        ? "border-green-500 bg-green-500/10"
                        : "border-white/10 bg-white/5"
                    }`}
                  >
                    {plan.badge && !isCurrent && (
                      <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-purple-600 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                        {plan.badge}
                      </div>
                    )}
                    {isCurrent && (
                      <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-green-600 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                        Current Plan
                      </div>
                    )}
                    <div className="text-white font-bold text-base mt-1">
                      {plan.name}
                    </div>
                    <div className="text-slate-300 text-sm mb-1">
                      ₹{price.toLocaleString()}
                      <span className="text-slate-500 text-xs">/{period}</span>
                    </div>
                    {billingCycle === "yearly" && (
                      <div className="text-green-400 text-[11px] font-semibold mb-2">
                        Save ₹{savings.toLocaleString()} ({percentSaved}%)
                      </div>
                    )}
                    <div className="space-y-1 mb-4 mt-2">
                      {plan.features.map((f, i) => (
                        <div
                          key={i}
                          className="text-slate-400 text-xs flex gap-1.5"
                        >
                          <span className="text-green-400 shrink-0">✓</span>
                          {f}
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={() => handleSubscribe(plan.id)}
                      disabled={isCurrent || payingPlan === plan.id}
                      className={`w-full py-2.5 rounded-xl font-bold text-xs transition-all mt-auto ${
                        isCurrent
                          ? "bg-white/10 text-slate-500 cursor-not-allowed"
                          : "bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
                      }`}
                    >
                      {isCurrent
                        ? "Active"
                        : payingPlan === plan.id
                          ? "Opening..."
                          : "Choose Plan"}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── RIGHT: Sidebar ── */}
        <div className="space-y-6">
          {/* Subscription status */}
          {/* {fetchError ? (
            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
              <div className="text-amber-300 font-bold text-sm mb-1">⚠️ Couldn't verify subscription</div>
              <div className="text-slate-400 text-xs mb-3">This is usually just a connection hiccup.</div>
              <button onClick={() => window.location.reload()} className="text-blue-400 text-xs font-semibold">Retry →</button>
            </div>
          ) : (
            <div className={`rounded-2xl border p-4 ${
              subscription?.status === "active" ? "border-green-500/30 bg-green-500/10" : "border-red-500/30 bg-red-500/10"
            }`}>
              <div className={`font-bold text-sm mb-1 ${subscription?.status === "active" ? "text-green-300" : "text-red-300"}`}>
                {subscription?.status === "active" ? "✅ Active" : "❌ Expired"}
              </div>
              <div className="text-white font-semibold text-sm">
                {subscription?.plan ? `${subscription.plan.charAt(0).toUpperCase() + subscription.plan.slice(1)} Plan` : "Trial"}
                {subscription?.billingCycle && subscription?.plan !== "trial" && (
                  <span className="text-slate-400 font-normal text-xs ml-1.5">
                    ({subscription.billingCycle === "yearly" ? "Yearly" : "Monthly"})
                  </span>
                )}
              </div>
              {subscription?.expiresAt && (
                <div className="text-slate-400 text-xs mt-1">
                  {subscription.status === "active" ? "Renews" : "Expired"} on{" "}
                  {new Date(subscription.expiresAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                </div>
              )}
            </div>
          )} */}

          {/* Razorpay Integration */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="flex items-center gap-2 mb-3">
              <h3 className="text-white font-bold text-sm">
                Razorpay Integration
              </h3>
              {restaurant?.razorpayLinked && (
                <span className="text-[10px] bg-green-500/20 text-green-400 border border-green-500/30 px-2 py-0.5 rounded-full font-bold">
                  Linked
                </span>
              )}
            </div>
            <p className="text-slate-400 text-xs leading-relaxed mb-4">
              Link your own Razorpay account so customer payments go straight to
              you, not through us.
            </p>
            <form onSubmit={handleSaveRazorpay} className="space-y-3">
              <input
                value={razorpayForm.keyId}
                onChange={(e) =>
                  setRazorpayForm((p) => ({ ...p, keyId: e.target.value }))
                }
                placeholder="Razorpay Key ID"
                className="w-full rounded-xl border border-white/20 bg-white/10 px-3 py-2.5 text-white placeholder-slate-500 outline-none focus:border-blue-500 text-xs font-mono"
              />
              <PasswordInput
                value={razorpayForm.keySecret}
                onChange={(e) =>
                  setRazorpayForm((p) => ({ ...p, keySecret: e.target.value }))
                }
                placeholder="Razorpay Key Secret"
                className="w-full rounded-xl border border-white/20 bg-white/10 px-3 py-2.5 text-white placeholder-slate-500 outline-none focus:border-blue-500 text-xs font-mono"
              />
              <button
                type="submit"
                disabled={linkingRazorpay || !razorpayForm.keyId}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs disabled:opacity-50"
              >
                {/* {saving ? "Linking..." : restaurant?.razorpayLinked ? "Update Keys" : "Link Account"} */}
                {linkingRazorpay
                  ? "Linking..."
                  : restaurant?.razorpayLinked
                    ? "Update Keys"
                    : "Link Account"}
              </button>

              <div className="flex items-start gap-2 mt-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-4 h-4 text-slate-500 shrink-0 mt-0.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Your Razorpay Secret Key is encrypted before it's stored. Not
                  even our team can view it once saved — it's only ever used
                  securely, server-side, to process your payments.
                </p>
              </div>
            </form>
          </div>

          {/* Notifications */}
          {/* <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="flex items-center gap-2 mb-3">
              <h3 className="text-white font-bold text-sm">Notifications</h3>
              {!restaurantIsPro && (
                <span className="text-[10px] bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full font-bold">
                  PRO
                </span>
              )}
            </div>
            <label className={`flex items-center gap-3 ${restaurantIsPro ? "cursor-pointer" : "cursor-not-allowed"}`}>
              <div
                onClick={toggleSound}
                className={`w-12 h-6 rounded-full relative transition-colors ${
                  soundEnabled && restaurantIsPro ? "bg-blue-500" : "bg-slate-600"
                } ${restaurantIsPro ? "cursor-pointer" : "cursor-not-allowed"}`}
              >
                <div
                  className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    soundEnabled && restaurantIsPro ? "translate-x-7" : "translate-x-1"
                  }`}
                />
              </div>
              <span className={`text-sm font-semibold ${restaurantIsPro ? "text-slate-300" : "text-slate-500"}`}>
                Play sound for new orders
                {!restaurantIsPro && (
                  <span className="block text-slate-500 text-xs font-normal mt-0.5">
                    Upgrade to Pro to enable
                  </span>
                )}
              </span>
            </label>
          </div> */}

          {/* Notifications */}
          {/* <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="flex items-center gap-2 mb-3">
              <h3 className="text-white font-bold text-sm">Notifications</h3>
              {!restaurantIsPro && (
                <span className="text-[10px] bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full font-bold">
                  PRO
                </span>
              )}
            </div>

            <label
              className={`flex items-center gap-3 mb-4 ${restaurantIsPro ? "cursor-pointer" : "cursor-not-allowed"}`}
            >
              <div
                onClick={toggleSound}
                className={`w-12 h-6 rounded-full relative transition-colors ${
                  soundEnabled && restaurantIsPro
                    ? "bg-blue-500"
                    : "bg-slate-600"
                } ${restaurantIsPro ? "cursor-pointer" : "cursor-not-allowed"}`}
              >
                <div
                  className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    soundEnabled && restaurantIsPro
                      ? "translate-x-7"
                      : "translate-x-1"
                  }`}
                />
              </div>
              <span
                className={`text-sm font-semibold ${restaurantIsPro ? "text-slate-300" : "text-slate-500"}`}
              >
                Play sound for new orders
                {!restaurantIsPro && (
                  <span className="block text-slate-500 text-xs font-normal mt-0.5">
                    Upgrade to Pro to enable
                  </span>
                )}
              </span>
            </label>

            {restaurantIsPro && soundEnabled && (
              <div className="space-y-2 pt-3 border-t border-white/10">
                <div className="text-slate-400 text-xs font-bold uppercase tracking-wide mb-2">
                  Notification Sound
                </div>
                {SOUND_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => handleSoundChange(preset.id)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl border text-sm font-semibold transition-colors ${
                      selectedSound === preset.id
                        ? "border-blue-500 bg-blue-500/10 text-white"
                        : "border-white/10 bg-white/5 text-slate-400"
                    }`}
                  >
                    <span>{preset.label}</span>
                    {selectedSound === preset.id && (
                      <span className="text-blue-400 text-xs">✓ Selected</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div> */}

          {/* new Notifications */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="flex items-center gap-2 mb-3">
              <h3 className="text-white font-bold text-sm">Notifications</h3>
              {!notificationSoundAllowed && (
                <span className="text-[10px] bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full font-bold">
                  PRO
                </span>
              )}
            </div>

            <label
              className={`flex items-center gap-3 mb-4 ${notificationSoundAllowed ? "cursor-pointer" : "cursor-not-allowed"}`}
            >
              <div
                onClick={toggleSound}
                className={`w-12 h-6 rounded-full relative transition-colors ${
                  soundEnabled && notificationSoundAllowed
                    ? "bg-blue-500"
                    : "bg-slate-600"
                } ${notificationSoundAllowed ? "cursor-pointer" : "cursor-not-allowed"}`}
              >
                <div
                  className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    soundEnabled && notificationSoundAllowed
                      ? "translate-x-7"
                      : "translate-x-1"
                  }`}
                />
              </div>
              <span
                className={`text-sm font-semibold ${notificationSoundAllowed ? "text-slate-300" : "text-slate-500"}`}
              >
                Play sound for new orders
                {!notificationSoundAllowed && (
                  <span className="block text-slate-500 text-xs font-normal mt-0.5">
                    Upgrade to Pro to enable
                  </span>
                )}
              </span>
            </label>

            {notificationSoundAllowed && soundEnabled && (
              <div className="space-y-2 pt-3 border-t border-white/10">
                <div className="text-slate-400 text-xs font-bold uppercase tracking-wide mb-2">
                  Notification Sound
                </div>
                {SOUND_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => handleSoundChange(preset.id)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl border text-sm font-semibold transition-colors ${
                      selectedSound === preset.id
                        ? "border-blue-500 bg-blue-500/10 text-white"
                        : "border-white/10 bg-white/5 text-slate-400"
                    }`}
                  >
                    <span>{preset.label}</span>
                    {selectedSound === preset.id && (
                      <span className="text-blue-400 text-xs">✓ Selected</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
