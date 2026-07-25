import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  getMyRestaurantApi,
  createRestaurantApi,
  updateRestaurantApi,
} from "../../api/restaurantApi";
import {
  createSubscriptionOrderApi,
  verifySubscriptionApi,
} from "../../api/subscriptionApi";
import toast from "react-hot-toast";

const PLANS = [
  {
    id: "basic",
    name: "Basic",
    monthlyPrice: 699,
    yearlyPrice: 6999,
    color: "border-blue-500/50 bg-blue-500/10",
    selectedColor: "border-blue-500 bg-blue-500/20",
    badge: null,
    // features: [
    //   "QR ordering system",
    //   "Menu management",
    //   "Up to 10 tables",
    //   "Order management",
    //   "Bill printing",
    //   "Order tracking for customers",
    //   "Cash & online payments",
    // ],
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
    color: "border-purple-500/50 bg-purple-500/10",
    selectedColor: "border-purple-500 bg-purple-500/20",
    badge: "Most Popular",
    // features: [
    //   "Everything in Basic",
    //   "Analytics dashboard",
    //   "Customer reviews",
    //   "Up to 30 tables",
    // ],
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

export default function RestaurantSetup() {
  const navigate = useNavigate();
  const [step, setStep] = useState("details");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState("pro");

  const [billingCycle, setBillingCycle] = useState("monthly"); // "monthly" | "yearly"

  // ← NEW: true when a restaurant already exists but its subscription has
  // expired — in this mode we pre-fill their real data, skip straight to
  // plan selection, and never call createRestaurantApi again (it already
  // exists), so nothing about their restaurant is ever lost or recreated.
  const [isRenewal, setIsRenewal] = useState(false);

  // const [form, setForm] = useState({
  //   name: "",
  //   slug: "",
  //   description: "",
  //   phone: "",
  //   address: "",
  //   gstNumber: "",
  //   gstPercent: "5",
  // });

  const [form, setForm] = useState(() => {
  const saved = sessionStorage.getItem("restaurantSetupForm");
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      // corrupted/invalid saved data — fall back to blank
    }
  }
  return { name: "", slug: "", description: "", phone: "", address: "", gstNumber: "", gstPercent: "5" };
  });

  useEffect(() => {
  sessionStorage.setItem("restaurantSetupForm", JSON.stringify(form));
  }, [form]);



  useEffect(() => {
    const check = async () => {
      try {
        const data = await getMyRestaurantApi();
        if (data.restaurant) {
          // ← THE FIX: only skip past setup entirely if the subscription
          // is genuinely active. If it exists but is expired, this is a
          // renewal — stay on this page, pre-fill their real data, and
          // let them choose a plan to reactivate, instead of bouncing
          // back to a dashboard that will just reject them again.
          if (data.restaurant.subscriptionStatus === "active") {
            navigate("/restaurant/dashboard");
            return;
          }
          setIsRenewal(true);
          setForm({
            name: data.restaurant.name || "",
            slug: data.restaurant.slug || "",
            description: data.restaurant.description || "",
            phone: data.restaurant.phone || "",
            address: data.restaurant.address || "",
            gstNumber: data.restaurant.gstNumber || "",
            gstPercent: String(data.restaurant.gstPercent || "5"),
          });
          setStep("plan"); // skip straight to plan selection — their info is already known
        }
      } catch {
        // no restaurant yet — this is the expected state on this page
      } finally {
        setLoading(false);
      }
    };
    check();
  }, [navigate]);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleNameChange = (e) => {
    const name = e.target.value;
    const slug = name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");
    setForm((p) => ({ ...p, name, slug }));
  };

  // ← NO backend call here at all. This just validates the form and
  // advances to the plan step. Nothing is written to the database yet.
  const handleContinueToPlans = (e) => {
    e.preventDefault();
    // if (!form.name.trim() || !form.slug.trim()) {
    //   toast.error("Restaurant name and slug are required");
    //   return;
    // }

    // Required fields — everything except gstNumber
    if (!form.name.trim()) {
      toast.error("Restaurant name is required");
      return;
    }
    if (!form.slug.trim()) {
      toast.error("URL slug is required");
      return;
    }
    // if (!form.description.trim()) {
    //   toast.error("Description is required");
    //   return;
    // }
    if (!form.phone.trim()) {
      toast.error("Phone number is required");
      return;
    }
    if (!/^\d{10}$/.test(form.phone.trim())) {
      toast.error("Enter a valid 10-digit phone number");
      return;
    }
    if (!form.gstPercent.toString().trim()) {
      toast.error("GST % is required");
      return;
    }
    if (!form.address.trim()) {
      toast.error("Address is required");
      return;
    }

    const gstPercentNum = Number(form.gstPercent);
    if (isNaN(gstPercentNum) || gstPercentNum < 0 || gstPercentNum > 28) {
      toast.error("Enter a valid GST % (0–28)");
      return;
    }
    // gstNumber intentionally has NO check here — it's the one optional field

    setStep("plan");
  };

  // ← The ONLY place createRestaurantApi is ever called for a brand-new
  // signup, and it always includes a real, chosen plan. A restaurant
  // document can never exist in the database without a deliberate plan
  // attached to it. Not reachable during renewal (button is hidden then).
  const handleStartTrial = async () => {
    if (isRenewal) return; // ← safety guard — trial restart should never happen on renewal
    setSubmitting(true);
    try {
      await createRestaurantApi({ ...form, plan: "trial" });
      sessionStorage.removeItem("restaurantSetupForm"); // ← draft no longer needed once setup is done
      toast.success("10-day free trial started!");
      navigate("/restaurant/dashboard");
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not start trial");
    } finally {
      setSubmitting(false);
    }
  };

  // handlePaySubscription
  const handlePaySubscription = async () => {
    if (!window.Razorpay) {
      toast.error("Payment gateway not loaded. Please refresh the page.");
      return;
    }
    setSubmitting(true);
    try {
      const plan = PLANS.find((p) => p.id === selectedPlan);

      // ← THE FIX: actually call the API and capture its result
      const data = await createSubscriptionOrderApi(selectedPlan, billingCycle);

      if (!data.success || !data.order) {
        toast.error(data.message || "Could not create payment order");
        setSubmitting(false);
        return;
      }

      const options = {
        key: data.keyId,
        amount: data.order.amount,
        currency: "INR",
        name: "Dinora",
        description: `${plan.name} Plan — ${billingCycle === "yearly" ? "Yearly" : "Monthly"} Subscription`,
        order_id: data.order.id,
        handler: async (response) => {
          try {
            // ← THE FIX: only create a restaurant on a genuinely new signup.
            // On renewal, the restaurant already exists — creating it again
            // would fail ("You already have a restaurant") and would skip
            // verifySubscriptionApi entirely, leaving them paid but not
            // renewed. Instead, just update their details in case they
            // edited anything, then verify the payment against the
            // existing restaurant.
            if (isRenewal) {
              await updateRestaurantApi(form);
            } else {
              await createRestaurantApi({ ...form, plan: selectedPlan });
            }

            await verifySubscriptionApi({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              plan: selectedPlan,
              billingCycle, // ← THE FIX: backend needs this to look up the right PLANS[plan][cycle]
            });

            sessionStorage.removeItem("restaurantSetupForm"); // ← same cleanup here

            // toast.success("Subscription activated! Welcome to Dinora 🎉");
            toast.success(
              isRenewal
                ? "Subscription renewed! Welcome back to Dinora"
                : "You're all set! Your Dinora subscription is now active.",
            );
            navigate("/restaurant/dashboard");
          } catch (err) {
            toast.error(
              err.response?.data?.message ||
                "Payment verification failed. Contact support.",
            );
          }
        },
        theme: { color: "#3B82F6" },
        modal: { ondismiss: () => setSubmitting(false) },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", (resp) => {
        toast.error(`Payment failed: ${resp.error.description}`);
        setSubmitting(false);
      });
      rzp.open();
    } catch (error) {
      console.error("Payment error:", error); // ← add this so future issues show up clearly in console
      toast.error(error.response?.data?.message || "Could not start payment");
      setSubmitting(false);
    }
  };

  // yearly savings
  // works out exactly how much is saved by paying yearly instead of
  // 12 separate monthly payments — computed once here, not hardcoded,
  // so it always stays accurate if prices change later
  const getYearlySavings = (plan) => {
    const fullYearAtMonthlyRate = plan.monthlyPrice * 12;
    const savings = fullYearAtMonthlyRate - plan.yearlyPrice;
    const percentSaved = Math.round((savings / fullYearAtMonthlyRate) * 100);
    return { savings, percentSaved };
  };

  if (loading)
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-800 to-slate-700 flex items-center justify-center">
        <div className="text-white text-sm">Loading...</div>
      </div>
    );

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-800 to-slate-700 px-4 py-10">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white">Dinora</h1>
          <p className="text-slate-300 mt-2">
            {isRenewal
              ? "Your subscription has expired — choose a plan to continue"
              : step === "details" ? "Setup your restaurant" : "Choose your plan"}
          </p>
        </div>

        {/* ← progress indicator hidden during renewal — there's only one real step (choose plan) */}
        {!isRenewal && (
          <div className="flex items-center gap-2 mb-8 justify-center">
            {["details", "plan"].map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2
                  ${
                    step === s
                      ? "border-blue-500 bg-blue-500/20 text-blue-400"
                      : step === "plan" && s === "details"
                        ? "border-green-500 bg-green-500/20 text-green-400"
                        : "border-white/20 bg-white/5 text-slate-500"
                  }`}
                >
                  {step === "plan" && s === "details" ? "✓" : i + 1}
                </div>
                <span
                  className={`text-xs font-semibold capitalize ${step === s ? "text-white" : "text-slate-500"}`}
                >
                  {s === "details" ? "Restaurant Info" : "Choose Plan"}
                </span>
                {i === 0 && <div className="w-8 h-px bg-white/20" />}
              </div>
            ))}
          </div>
        )}

        {step === "details" && (
          <div className="rounded-3xl border border-white/10 bg-white/10 backdrop-blur-xl p-8 shadow-2xl">
            <form onSubmit={handleContinueToPlans} className="space-y-5">
              <div>
                <label className="block text-white mb-2 font-medium">
                  Restaurant Name *
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={handleNameChange}
                  placeholder="e.g. Spice Garden"
                  // required
                  // className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                  className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-slate-400 outline-none focus:border-blue-500 resize-none"
                />
              </div>
              <div>
                <label className="block text-white mb-2 font-medium">
                  URL Slug *
                  <span className="text-slate-400 text-xs ml-2 font-normal">
                    Cannot be changed later
                  </span>
                </label>
                <div 
                className="flex rounded-xl border border-white/20 bg-white/10 overflow-hidden text-white placeholder-slate-400 outline-none focus:border-blue-500  focus-within:border-blue-500 focus-within:ring-0 focus-within:ring-blue-500"
                >
                  <span className="px-3 py-3 text-slate-400 text-sm border-r border-white/20 bg-white/5">
                    /menu/
                  </span>
                  <input
                    type="text"
                    value={form.slug}
                    onChange={(e) =>
                      set(
                        "slug",
                        e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""),
                      )
                    }
                    placeholder="spice-garden"
                    // required
                    disabled={isRenewal} // ← slug can't change, and shouldn't during renewal anyway
                    className="flex-1 px-3 py-3 text-white placeholder-slate-400 outline-none bg-transparent disabled:opacity-60"
                  />
                </div>
              </div>
              <div>
                <label className="block text-white mb-2 font-medium">
                  Description
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => set("description", e.target.value)}
                  placeholder="Brief description of your restaurant"
                  rows={2}
                  className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-slate-400 outline-none focus:border-blue-500 resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-white mb-2 font-medium">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => set("phone", e.target.value)}
                    placeholder="9999999999"
                    // required
                    className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-slate-400 outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-white mb-2 font-medium">
                    GST %
                  </label>
                  <input
                    type="number"
                    value={form.gstPercent}
                    onChange={(e) => set("gstPercent", e.target.value)}
                    placeholder="5"
                    // required
                    className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-slate-400 outline-none focus:border-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-white mb-2 font-medium">
                  Address
                </label>
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) => set("address", e.target.value)}
                  placeholder="123 MG Road, Jaipur"
                  // required
                  className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-slate-400 outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-white mb-2 font-medium">
                  GST Number (optional)
                </label>
                <input
                  type="text"
                  value={form.gstNumber}
                  onChange={(e) => set("gstNumber", e.target.value)}
                  placeholder="27AAAAA0000A1Z5"
                  className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-slate-400 outline-none focus:border-blue-500"
                />
              </div>
              <button
                type="submit"
                className="w-full rounded-xl bg-blue-600 py-3 font-semibold text-white transition-all hover:bg-blue-700 hover:-translate-y-0.5"
              >
                Continue to Plans →
              </button>
            </form>
          </div>
        )}

        {step === "plan" && (
          <div className="space-y-4">
            {/* ← "Back to details" lets them edit their info even during renewal —
                intentionally NOT hidden for isRenewal, since they might want to
                update phone/address/GST while reactivating */}
            <button
              onClick={() => setStep("details")}
              className="flex items-center gap-2 text-slate-400 hover:text-white text-sm font-semibold transition-colors mb-2"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              {isRenewal ? "Edit restaurant details" : "Back to details"}
            </button>

            {/* Trial option — hidden entirely during renewal, since a renewal
                means they've already had real usage, not a first trial */}
            {!isRenewal && (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center">
                <span className="text-slate-300 text-sm">Start with a </span>
                <span className="text-white font-bold">10-day free trial</span>
                <span className="text-slate-300 text-sm">
                  {" "}
                  {/* to explore the platform */}
                  — up to 10 tables, explore the platform
                </span>
                <button
                  onClick={handleStartTrial}
                  disabled={submitting}
                  className="block mx-auto mt-3 px-6 py-2 border border-white/20 bg-white/10 hover:bg-white/20 text-white text-sm font-semibold rounded-xl transition-all disabled:opacity-50"
                >
                  {submitting ? "Starting..." : "Start Free Trial →"}
                </button>
              </div>
            )}

            <div className="text-center text-slate-400 text-sm">
              {isRenewal ? "Choose a plan to reactivate your account" : "— or choose a plan now —"}
            </div>

            {/* Billing cycle toggle */}
            <div className="flex items-center justify-center gap-1 bg-white/5 border border-white/10 rounded-2xl p-1 mb-2">
              <button
                onClick={() => setBillingCycle("monthly")}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  billingCycle === "monthly"
                    ? "bg-blue-600 text-white"
                    : "text-slate-400"
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle("yearly")}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all relative ${
                  billingCycle === "yearly"
                    ? "bg-blue-600 text-white"
                    : "text-slate-400"
                }`}
              >
                Yearly
                <span className="absolute -top-2 -right-2 bg-green-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                  SAVE
                </span>
              </button>
            </div>

            {PLANS.map((plan) => {
              const price =
                billingCycle === "yearly"
                  ? plan.yearlyPrice
                  : plan.monthlyPrice;
              const period = billingCycle === "yearly" ? "year" : "month";
              const { savings, percentSaved } = getYearlySavings(plan);

              return (
                <div
                  key={plan.id}
                  onClick={() => setSelectedPlan(plan.id)}
                  className={`rounded-2xl border-2 p-5 cursor-pointer transition-all relative ${
                    selectedPlan === plan.id ? plan.selectedColor : plan.color
                  }`}
                >
                  {plan.badge && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-purple-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                      {plan.badge}
                    </div>
                  )}
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="text-white font-bold text-lg">
                        {plan.name}
                      </div>
                      <div className="text-slate-400 text-sm">
                        ₹{price.toLocaleString()}/{period}
                      </div>
                      {billingCycle === "yearly" && (
                        <div className="text-green-400 text-xs font-semibold mt-0.5">
                          You save ₹{savings.toLocaleString()} ({percentSaved}%)
                          a year
                        </div>
                      )}
                    </div>
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        selectedPlan === plan.id
                          ? "border-white bg-white"
                          : "border-white/30"
                      }`}
                    >
                      {selectedPlan === plan.id && (
                        <div className="w-2.5 h-2.5 rounded-full bg-slate-900" />
                      )}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    {plan.features.map((f, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 text-slate-300 text-sm"
                      >
                        <span className="text-green-400 shrink-0">✓</span>
                        <span>{f}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            <button
              onClick={handlePaySubscription}
              disabled={submitting}
              className="w-full py-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-base transition-all hover:-translate-y-0.5 disabled:opacity-50"
            >
              {submitting
                ? "Opening payment..."
                : `Pay ₹${(billingCycle === "yearly"
                    ? PLANS.find((p) => p.id === selectedPlan)?.yearlyPrice
                    : PLANS.find((p) => p.id === selectedPlan)?.monthlyPrice
                  )?.toLocaleString()}/${billingCycle === "yearly" ? "year" : "month"} →`}
            </button>

            <p className="text-center text-slate-500 text-xs">
              🔒 Payments secured by Razorpay · Cancel anytime
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

















































// import { useState, useEffect } from "react";
// import { useNavigate } from "react-router-dom";
// import {
//   getMyRestaurantApi,
//   createRestaurantApi,
// } from "../../api/restaurantApi";
// import {
//   createSubscriptionOrderApi,
//   verifySubscriptionApi,
// } from "../../api/subscriptionApi";
// import toast from "react-hot-toast";

// const PLANS = [
//   {
//     id: "basic",
//     name: "Basic",
//     monthlyPrice: 699,
//     yearlyPrice: 6999,
//     color: "border-blue-500/50 bg-blue-500/10",
//     selectedColor: "border-blue-500 bg-blue-500/20",
//     badge: null,
//     // features: [
//     //   "QR ordering system",
//     //   "Menu management",
//     //   "Up to 10 tables",
//     //   "Order management",
//     //   "Bill printing",
//     //   "Order tracking for customers",
//     //   "Cash & online payments",
//     // ],
//     features: [
//       "QR code generation for every table",
//       "Digital menu with categories and photos",
//       "Veg/Non-veg tagging and bestseller marking",
//       "Real-time order tracking for kitchen and customers",
//       "Kitchen order dashboard",
//       "Printable kitchen slips with GST breakdown",
//       "Table management",
//       "Order history with date-range filtering",
//       "Cash and online payments (your own Razorpay)",
//       "Up to 10 tables",
//     ],
//   },
//   {
//     id: "pro",
//     name: "Pro",
//     monthlyPrice: 1299,
//     yearlyPrice: 12999,
//     color: "border-purple-500/50 bg-purple-500/10",
//     selectedColor: "border-purple-500 bg-purple-500/20",
//     badge: "Most Popular",
//     // features: [
//     //   "Everything in Basic",
//     //   "Analytics dashboard",
//     //   "Customer reviews",
//     //   "Up to 30 tables",
//     // ],
//     features: [
//     "Everything in Basic",
//     "Customer reviews and dish ratings",
//     "Top-rated dishes ranking",
//     "Revenue and order trend charts for 7/14/30 days or custom range",
//     "Payment method breakdown (cash vs online)",
//     "Overall rating summary with star distribution",
//     "Up to 30 tables",
//     ],
//   },
// ];

// export default function RestaurantSetup() {
//   const navigate = useNavigate();
//   const [step, setStep] = useState("details");
//   const [loading, setLoading] = useState(true);
//   const [submitting, setSubmitting] = useState(false);
//   const [selectedPlan, setSelectedPlan] = useState("pro");

//   const [billingCycle, setBillingCycle] = useState("monthly"); // "monthly" | "yearly"

//   // const [form, setForm] = useState({
//   //   name: "",
//   //   slug: "",
//   //   description: "",
//   //   phone: "",
//   //   address: "",
//   //   gstNumber: "",
//   //   gstPercent: "5",
//   // });

//   const [form, setForm] = useState(() => {
//   const saved = sessionStorage.getItem("restaurantSetupForm");
//   if (saved) {
//     try {
//       return JSON.parse(saved);
//     } catch {
//       // corrupted/invalid saved data — fall back to blank
//     }
//   }
//   return { name: "", slug: "", description: "", phone: "", address: "", gstNumber: "", gstPercent: "5" };
//   });

//   useEffect(() => {
//   sessionStorage.setItem("restaurantSetupForm", JSON.stringify(form));
//   }, [form]);



//   useEffect(() => {
//     const check = async () => {
//       try {
//         const data = await getMyRestaurantApi();
//         if (data.restaurant) navigate("/restaurant/dashboard");
//       } catch {
//         // no restaurant yet — this is the expected state on this page
//       } finally {
//         setLoading(false);
//       }
//     };
//     check();
//   }, [navigate]);

//   const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

//   const handleNameChange = (e) => {
//     const name = e.target.value;
//     const slug = name
//       .toLowerCase()
//       .trim()
//       .replace(/\s+/g, "-")
//       .replace(/[^a-z0-9-]/g, "");
//     setForm((p) => ({ ...p, name, slug }));
//   };

//   // ← NO backend call here at all. This just validates the form and
//   // advances to the plan step. Nothing is written to the database yet.
//   const handleContinueToPlans = (e) => {
//     e.preventDefault();
//     // if (!form.name.trim() || !form.slug.trim()) {
//     //   toast.error("Restaurant name and slug are required");
//     //   return;
//     // }

//     // Required fields — everything except gstNumber
//     if (!form.name.trim()) {
//       toast.error("Restaurant name is required");
//       return;
//     }
//     if (!form.slug.trim()) {
//       toast.error("URL slug is required");
//       return;
//     }
//     // if (!form.description.trim()) {
//     //   toast.error("Description is required");
//     //   return;
//     // }
//     if (!form.phone.trim()) {
//       toast.error("Phone number is required");
//       return;
//     }
//     if (!/^\d{10}$/.test(form.phone.trim())) {
//       toast.error("Enter a valid 10-digit phone number");
//       return;
//     }
//     if (!form.gstPercent.toString().trim()) {
//       toast.error("GST % is required");
//       return;
//     }
//     if (!form.address.trim()) {
//       toast.error("Address is required");
//       return;
//     }

//     const gstPercentNum = Number(form.gstPercent);
//     if (isNaN(gstPercentNum) || gstPercentNum < 0 || gstPercentNum > 28) {
//       toast.error("Enter a valid GST % (0–28)");
//       return;
//     }
//     // gstNumber intentionally has NO check here — it's the one optional field

//     setStep("plan");
//   };

//   // ← The ONLY place createRestaurantApi is ever called, and it always
//   // includes a real, chosen plan. A restaurant document can never exist
//   // in the database without a deliberate plan attached to it.
//   const handleStartTrial = async () => {
//     setSubmitting(true);
//     try {
//       await createRestaurantApi({ ...form, plan: "trial" });
//       sessionStorage.removeItem("restaurantSetupForm"); // ← draft no longer needed once setup is done
//       toast.success("10-day free trial started!");
//       navigate("/restaurant/dashboard");
//     } catch (error) {
//       toast.error(error.response?.data?.message || "Could not start trial");
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   // handlePaySubscription
//   const handlePaySubscription = async () => {
//     if (!window.Razorpay) {
//       toast.error("Payment gateway not loaded. Please refresh the page.");
//       return;
//     }
//     setSubmitting(true);
//     try {
//       const plan = PLANS.find((p) => p.id === selectedPlan);

//       // ← THE FIX: actually call the API and capture its result
//       const data = await createSubscriptionOrderApi(selectedPlan, billingCycle);

//       if (!data.success || !data.order) {
//         toast.error(data.message || "Could not create payment order");
//         setSubmitting(false);
//         return;
//       }

//       const options = {
//         key: data.keyId,
//         amount: data.order.amount,
//         currency: "INR",
//         name: "Dinora",
//         description: `${plan.name} Plan — ${billingCycle === "yearly" ? "Yearly" : "Monthly"} Subscription`,
//         order_id: data.order.id,
//         handler: async (response) => {
//           try {
//             await createRestaurantApi({ ...form, plan: selectedPlan });
//             await verifySubscriptionApi({
//               razorpay_order_id: response.razorpay_order_id,
//               razorpay_payment_id: response.razorpay_payment_id,
//               razorpay_signature: response.razorpay_signature,
//               plan: selectedPlan,
//               billingCycle, // ← THE FIX: backend needs this to look up the right PLANS[plan][cycle]
//             });

//             sessionStorage.removeItem("restaurantSetupForm"); // ← same cleanup here

//             // toast.success("Subscription activated! Welcome to Dinora 🎉");
//             toast.success(
//               "You're all set! Your Dinora subscription is now active.",
//             );
//             navigate("/restaurant/dashboard");
//           } catch (err) {
//             toast.error(
//               err.response?.data?.message ||
//                 "Payment verification failed. Contact support.",
//             );
//           }
//         },
//         theme: { color: "#3B82F6" },
//         modal: { ondismiss: () => setSubmitting(false) },
//       };

//       const rzp = new window.Razorpay(options);
//       rzp.on("payment.failed", (resp) => {
//         toast.error(`Payment failed: ${resp.error.description}`);
//         setSubmitting(false);
//       });
//       rzp.open();
//     } catch (error) {
//       console.error("Payment error:", error); // ← add this so future issues show up clearly in console
//       toast.error(error.response?.data?.message || "Could not start payment");
//       setSubmitting(false);
//     }
//   };

//   // yearly savings
//   // works out exactly how much is saved by paying yearly instead of
//   // 12 separate monthly payments — computed once here, not hardcoded,
//   // so it always stays accurate if prices change later
//   const getYearlySavings = (plan) => {
//     const fullYearAtMonthlyRate = plan.monthlyPrice * 12;
//     const savings = fullYearAtMonthlyRate - plan.yearlyPrice;
//     const percentSaved = Math.round((savings / fullYearAtMonthlyRate) * 100);
//     return { savings, percentSaved };
//   };

//   if (loading)
//     return (
//       <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-800 to-slate-700 flex items-center justify-center">
//         <div className="text-white text-sm">Loading...</div>
//       </div>
//     );

//   return (
//     <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-800 to-slate-700 px-4 py-10">
//       <div className="max-w-2xl mx-auto">
//         <div className="text-center mb-8">
//           <h1 className="text-4xl font-bold text-white">Dinora</h1>
//           <p className="text-slate-300 mt-2">
//             {step === "details" ? "Setup your restaurant" : "Choose your plan"}
//           </p>
//         </div>

//         <div className="flex items-center gap-2 mb-8 justify-center">
//           {["details", "plan"].map((s, i) => (
//             <div key={s} className="flex items-center gap-2">
//               <div
//                 className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2
//                 ${
//                   step === s
//                     ? "border-blue-500 bg-blue-500/20 text-blue-400"
//                     : step === "plan" && s === "details"
//                       ? "border-green-500 bg-green-500/20 text-green-400"
//                       : "border-white/20 bg-white/5 text-slate-500"
//                 }`}
//               >
//                 {step === "plan" && s === "details" ? "✓" : i + 1}
//               </div>
//               <span
//                 className={`text-xs font-semibold capitalize ${step === s ? "text-white" : "text-slate-500"}`}
//               >
//                 {s === "details" ? "Restaurant Info" : "Choose Plan"}
//               </span>
//               {i === 0 && <div className="w-8 h-px bg-white/20" />}
//             </div>
//           ))}
//         </div>

//         {step === "details" && (
//           <div className="rounded-3xl border border-white/10 bg-white/10 backdrop-blur-xl p-8 shadow-2xl">
//             <form onSubmit={handleContinueToPlans} className="space-y-5">
//               <div>
//                 <label className="block text-white mb-2 font-medium">
//                   Restaurant Name *
//                 </label>
//                 <input
//                   type="text"
//                   value={form.name}
//                   onChange={handleNameChange}
//                   placeholder="e.g. Spice Garden"
//                   // required
//                   // className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
//                   className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-slate-400 outline-none focus:border-blue-500 resize-none"
//                 />
//               </div>
//               <div>
//                 <label className="block text-white mb-2 font-medium">
//                   URL Slug *
//                   <span className="text-slate-400 text-xs ml-2 font-normal">
//                     Cannot be changed later
//                   </span>
//                 </label>
//                 <div 
//                 className="flex rounded-xl border border-white/20 bg-white/10 overflow-hidden text-white placeholder-slate-400 outline-none focus:border-blue-500  focus-within:border-blue-500 focus-within:ring-0 focus-within:ring-blue-500"
//                 >
//                   <span className="px-3 py-3 text-slate-400 text-sm border-r border-white/20 bg-white/5">
//                     /menu/
//                   </span>
//                   <input
//                     type="text"
//                     value={form.slug}
//                     onChange={(e) =>
//                       set(
//                         "slug",
//                         e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""),
//                       )
//                     }
//                     placeholder="spice-garden"
//                     // required
//                     className="flex-1 px-3 py-3 text-white placeholder-slate-400 outline-none bg-transparent"
//                   />
//                 </div>
//               </div>
//               <div>
//                 <label className="block text-white mb-2 font-medium">
//                   Description
//                 </label>
//                 <textarea
//                   value={form.description}
//                   onChange={(e) => set("description", e.target.value)}
//                   placeholder="Brief description of your restaurant"
//                   rows={2}
//                   className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-slate-400 outline-none focus:border-blue-500 resize-none"
//                 />
//               </div>
//               <div className="grid grid-cols-2 gap-4">
//                 <div>
//                   <label className="block text-white mb-2 font-medium">
//                     Phone
//                   </label>
//                   <input
//                     type="tel"
//                     value={form.phone}
//                     onChange={(e) => set("phone", e.target.value)}
//                     placeholder="9999999999"
//                     // required
//                     className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-slate-400 outline-none focus:border-blue-500"
//                   />
//                 </div>
//                 <div>
//                   <label className="block text-white mb-2 font-medium">
//                     GST %
//                   </label>
//                   <input
//                     type="number"
//                     value={form.gstPercent}
//                     onChange={(e) => set("gstPercent", e.target.value)}
//                     placeholder="5"
//                     // required
//                     className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-slate-400 outline-none focus:border-blue-500"
//                   />
//                 </div>
//               </div>
//               <div>
//                 <label className="block text-white mb-2 font-medium">
//                   Address
//                 </label>
//                 <input
//                   type="text"
//                   value={form.address}
//                   onChange={(e) => set("address", e.target.value)}
//                   placeholder="123 MG Road, Jaipur"
//                   // required
//                   className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-slate-400 outline-none focus:border-blue-500"
//                 />
//               </div>
//               <div>
//                 <label className="block text-white mb-2 font-medium">
//                   GST Number (optional)
//                 </label>
//                 <input
//                   type="text"
//                   value={form.gstNumber}
//                   onChange={(e) => set("gstNumber", e.target.value)}
//                   placeholder="27AAAAA0000A1Z5"
//                   className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-slate-400 outline-none focus:border-blue-500"
//                 />
//               </div>
//               <button
//                 type="submit"
//                 className="w-full rounded-xl bg-blue-600 py-3 font-semibold text-white transition-all hover:bg-blue-700 hover:-translate-y-0.5"
//               >
//                 Continue to Plans →
//               </button>
//             </form>
//           </div>
//         )}

//         {step === "plan" && (
//           <div className="space-y-4">
//             {/* ← NEW — lets them go back and fix details before paying */}
//             <button
//               onClick={() => setStep("details")}
//               className="flex items-center gap-2 text-slate-400 hover:text-white text-sm font-semibold transition-colors mb-2"
//             >
//               <svg
//                 xmlns="http://www.w3.org/2000/svg"
//                 className="w-4 h-4"
//                 fill="none"
//                 viewBox="0 0 24 24"
//                 stroke="currentColor"
//                 strokeWidth={2.5}
//               >
//                 <path
//                   strokeLinecap="round"
//                   strokeLinejoin="round"
//                   d="M15 19l-7-7 7-7"
//                 />
//               </svg>
//               Back to details
//             </button>

//             {/* Trial option */}
//             <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center">
//               <span className="text-slate-300 text-sm">Start with a </span>
//               <span className="text-white font-bold">10-day free trial</span>
//               <span className="text-slate-300 text-sm">
//                 {" "}
//                 to explore the platform
//               </span>
//               <button
//                 onClick={handleStartTrial}
//                 disabled={submitting}
//                 className="block mx-auto mt-3 px-6 py-2 border border-white/20 bg-white/10 hover:bg-white/20 text-white text-sm font-semibold rounded-xl transition-all disabled:opacity-50"
//               >
//                 {submitting ? "Starting..." : "Start Free Trial →"}
//               </button>
//             </div>

//             <div className="text-center text-slate-400 text-sm">
//               — or choose a plan now —
//             </div>

//             {/* Billing cycle toggle */}
//             <div className="flex items-center justify-center gap-1 bg-white/5 border border-white/10 rounded-2xl p-1 mb-2">
//               <button
//                 onClick={() => setBillingCycle("monthly")}
//                 className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
//                   billingCycle === "monthly"
//                     ? "bg-blue-600 text-white"
//                     : "text-slate-400"
//                 }`}
//               >
//                 Monthly
//               </button>
//               <button
//                 onClick={() => setBillingCycle("yearly")}
//                 className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all relative ${
//                   billingCycle === "yearly"
//                     ? "bg-blue-600 text-white"
//                     : "text-slate-400"
//                 }`}
//               >
//                 Yearly
//                 <span className="absolute -top-2 -right-2 bg-green-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
//                   SAVE
//                 </span>
//               </button>
//             </div>

//             {PLANS.map((plan) => {
//               const price =
//                 billingCycle === "yearly"
//                   ? plan.yearlyPrice
//                   : plan.monthlyPrice;
//               const period = billingCycle === "yearly" ? "year" : "month";
//               const { savings, percentSaved } = getYearlySavings(plan);

//               return (
//                 <div
//                   key={plan.id}
//                   onClick={() => setSelectedPlan(plan.id)}
//                   className={`rounded-2xl border-2 p-5 cursor-pointer transition-all relative ${
//                     selectedPlan === plan.id ? plan.selectedColor : plan.color
//                   }`}
//                 >
//                   {plan.badge && (
//                     <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-purple-600 text-white text-xs font-bold px-3 py-1 rounded-full">
//                       {plan.badge}
//                     </div>
//                   )}
//                   <div className="flex items-center justify-between mb-3">
//                     <div>
//                       <div className="text-white font-bold text-lg">
//                         {plan.name}
//                       </div>
//                       <div className="text-slate-400 text-sm">
//                         ₹{price.toLocaleString()}/{period}
//                       </div>
//                       {billingCycle === "yearly" && (
//                         <div className="text-green-400 text-xs font-semibold mt-0.5">
//                           You save ₹{savings.toLocaleString()} ({percentSaved}%)
//                           a year
//                         </div>
//                       )}
//                     </div>
//                     <div
//                       className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
//                         selectedPlan === plan.id
//                           ? "border-white bg-white"
//                           : "border-white/30"
//                       }`}
//                     >
//                       {selectedPlan === plan.id && (
//                         <div className="w-2.5 h-2.5 rounded-full bg-slate-900" />
//                       )}
//                     </div>
//                   </div>
//                   <div className="space-y-1.5">
//                     {plan.features.map((f, i) => (
//                       <div
//                         key={i}
//                         className="flex items-center gap-2 text-slate-300 text-sm"
//                       >
//                         <span className="text-green-400 shrink-0">✓</span>
//                         <span>{f}</span>
//                       </div>
//                     ))}
//                   </div>
//                 </div>
//               );
//             })}

//             <button
//               onClick={handlePaySubscription}
//               disabled={submitting}
//               className="w-full py-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-base transition-all hover:-translate-y-0.5 disabled:opacity-50"
//             >
//               {submitting
//                 ? "Opening payment..."
//                 : `Pay ₹${(billingCycle === "yearly"
//                     ? PLANS.find((p) => p.id === selectedPlan)?.yearlyPrice
//                     : PLANS.find((p) => p.id === selectedPlan)?.monthlyPrice
//                   )?.toLocaleString()}/${billingCycle === "yearly" ? "year" : "month"} →`}
//             </button>

//             <p className="text-center text-slate-500 text-xs">
//               🔒 Payments secured by Razorpay · Cancel anytime
//             </p>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }