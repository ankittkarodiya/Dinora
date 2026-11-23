import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

import {
  QrCode,
  UtensilsCrossed,
  ClipboardList,
  Receipt,
  CreditCard,
  BarChart3,
  Menu,
  X,
  ChevronRight,
  Mail,
  Phone,
} from "lucide-react";

const FEATURES = [
  {
    icon: QrCode,
    title: "QR Ordering",
    desc: "Customers scan a table QR and order directly from their phone — no app to download.",
  },
  {
    icon: UtensilsCrossed,
    title: "Menu with Real Photos",
    desc: "Organise dishes into categories, upload real photos, mark veg/non-veg and bestsellers.",
  },
  {
    icon: ClipboardList,
    title: "Live Order Tracking",
    desc: "Orders flow through Pending → Accepted → Preparing → Ready → Served, visible to your kitchen in real time.",
  },
  {
    icon: Receipt,
    title: "Kitchen Slips with GST",
    desc: "One-click printable bills with CGST/SGST breakdown, ready for your kitchen and your customer.",
  },
  {
    icon: CreditCard,
    title: "Cash & Online Payments",
    desc: "Accept cash always. Link your own Razorpay account on Basic and Pro to accept UPI, cards, and netbanking.",
  },
  {
    icon: BarChart3,
    title: "Reviews & Analytics",
    desc: "On Pro: customers rate dishes after their order is served, and you get a full revenue dashboard.",
  },
];

const PLANS = [
  {
    id: "basic",
    name: "Basic",
    monthlyPrice: 699,
    yearlyPrice: 6999,
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

const getYearlySavings = (plan) => {
  const fullYearAtMonthlyRate = plan.monthlyPrice * 12;
  const savings = fullYearAtMonthlyRate - plan.yearlyPrice;
  const percentSaved = Math.round((savings / fullYearAtMonthlyRate) * 100);
  return { savings, percentSaved };
};

const STATUSES = [
  { label: "Pending", color: "#6b7280", bg: "#f3f4f6" },
  { label: "Accepted", color: "#2563eb", bg: "#eff6ff" },
  { label: "Preparing", color: "#d97706", bg: "#fffbeb" },
  { label: "Ready", color: "#16a34a", bg: "#f0fdf4" },
  { label: "Served", color: "#1e293b", bg: "#f1f5f9" },
];

function LiveTicket() {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const id = setInterval(
      () => setStep((s) => (s + 1) % STATUSES.length),
      1800,
    );
    return () => clearInterval(id);
  }, []);
  const current = STATUSES[step];
  return (
    <div className="relative w-full max-w-72 mx-auto">
      <div className="absolute -inset-4 rounded-3xl bg-blue-500/8 blur-2xl" />
      <div className="relative rounded-xl bg-white shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)] border border-gray-200/60 px-6 pt-6 pb-8">
        {/* Torn edge top */}
        <div className="absolute top-0 left-0 right-0 h-3 overflow-hidden rounded-t-xl">
          <div
            className="w-full h-full"
            style={{
              background:
                "repeating-linear-gradient(90deg, transparent, transparent 6px, white 6px, white 12px)",
              opacity: 0.5,
            }}
          />
        </div>

        <div className="flex items-center justify-between mb-4 pt-1">
          <span className="font-mono text-[11px] tracking-widest uppercase text-gray-400">
            Order Slip
          </span>
          <span className="font-mono text-[11px] tracking-widest text-gray-400">
            Table 07
          </span>
        </div>

        <div className="border-t border-dashed border-gray-200 pt-4 space-y-2.5 mb-5 font-mono text-[13px] text-gray-700">
          <div className="flex justify-between">
            <span>1× Paneer Tikka</span>
            <span>₹280</span>
          </div>
          <div className="flex justify-between">
            <span>2× Butter Naan</span>
            <span>₹120</span>
          </div>
          <div className="flex justify-between">
            <span>1× Masala Chai</span>
            <span>₹60</span>
          </div>
        </div>

        <div className="border-t border-dashed border-gray-200 pt-4 flex items-center justify-between">
          <span className="font-mono text-[11px] uppercase tracking-widest text-gray-400">
            Status
          </span>
          <span
            key={step}
            className="ticket-stamp inline-flex items-center gap-2 font-mono text-[12px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-md"
            style={{
              color: current.color,
              background: current.bg,
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full pulse-dot"
              style={{ background: current.color }}
            />
            {current.label}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const navigate = useNavigate();
  const [billingCycle, setBillingCycle] = useState("monthly");
  const [hoveredFeature, setHoveredFeature] = useState(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const scrollToSection = (id) => {
    setMobileNavOpen(false);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-white font-body text-gray-800 overflow-x-hidden">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap');

        .font-display { font-family: 'Inter', sans-serif; font-weight: 800; }
        .font-body { font-family: 'Inter', sans-serif; }
        .font-mono { font-family: 'JetBrains Mono', monospace; }

        @keyframes stampIn {
          0% { opacity: 0; transform: scale(1.4) rotate(-4deg); }
          60% { opacity: 1; transform: scale(0.96) rotate(-4deg); }
          100% { opacity: 1; transform: scale(1) rotate(-4deg); }
        }
        .ticket-stamp { animation: stampIn 0.35s ease-out; }

        @keyframes pulseDot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.3; transform: scale(0.6); }
        }
        .pulse-dot { animation: pulseDot 1.4s ease-in-out infinite; }

        @keyframes floatSlow {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        .float-slow { animation: floatSlow 5s ease-in-out infinite; }

        @keyframes steam {
          0% { opacity: 0; transform: translateY(0) scaleX(1); }
          30% { opacity: 0.4; }
          100% { opacity: 0; transform: translateY(-20px) scaleX(1.3); }
        }
        .steam-1 { animation: steam 3s ease-in infinite; }
        .steam-2 { animation: steam 3s ease-in infinite 1s; }
        .steam-3 { animation: steam 3s ease-in infinite 2s; }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .fade-up { animation: fadeUp 0.7s ease-out both; }

        @keyframes wobbleIn {
          0% { opacity: 0; transform: scale(0.9) rotate(-2deg); }
          100% { opacity: 1; transform: scale(1) rotate(0deg); }
        }
        .price-swap { animation: wobbleIn 0.35s ease-out; }

        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .mobile-nav-in { animation: slideDown 0.25s ease-out; }

        @media (prefers-reduced-motion: reduce) {
          .float-slow, .steam-1, .steam-2, .steam-3, .pulse-dot,
          .ticket-stamp, .fade-up, .price-swap, .mobile-nav-in {
            animation: none !important;
          }
        }
      `}</style>

      {/* ───── Nav ───── */}
      <nav className="sticky top-0 z-50 bg-white/85 backdrop-blur-lg border-b border-gray-200/60">
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 max-w-6xl mx-auto">
          <div className="flex items-center gap-2">
            <span className="font-display text-2xl sm:text-[1.7rem] text-gray-800">
              Din<span className="text-accent">ora</span>
            </span>
          </div>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-8">
            {["features", "how-it-works", "pricing"].map((id) => (
              <button
                key={id}
                onClick={() => scrollToSection(id)}
                className="text-gray-500 hover:text-[#2563eb] text-sm font-medium transition-colors capitalize"
              >
                {id === "how-it-works"
                  ? "How It Works"
                  : id.charAt(0).toUpperCase() + id.slice(1)}
              </button>
            ))}
          </div>

          <div className="hidden sm:flex items-center gap-3">
            <button
              onClick={() => navigate("/login")}
              className="px-5 py-2.5 rounded-full border border-gray-300 text-gray-700 text-sm font-semibold hover:border-gray-400 hover:bg-gray-50 transition-all"
            >
              Login
            </button>
            <button
              onClick={() => navigate("/register")}
              className="px-5 py-2.5 rounded-full bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-sm font-semibold transition-all shadow-[0_4px_14px_-4px_rgba(37,99,235,0.5)]"
            >
              Start Free Trial
            </button>
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileNavOpen((o) => !o)}
            className="sm:hidden text-gray-700 p-1"
            aria-label="Toggle menu"
          >
            {mobileNavOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Mobile panel */}
        {mobileNavOpen && (
          <div className="sm:hidden mobile-nav-in border-t border-gray-100 bg-white px-4 py-4 flex flex-col gap-1">
            {["features", "how-it-works", "pricing"].map((id) => (
              <button
                key={id}
                onClick={() => scrollToSection(id)}
                className="text-left text-gray-600 hover:text-[#2563eb] text-sm font-medium py-2.5 transition-colors"
              >
                {id === "how-it-works"
                  ? "How It Works"
                  : id.charAt(0).toUpperCase() + id.slice(1)}
              </button>
            ))}
            <div className="flex items-center gap-2 pt-3 mt-1 border-t border-gray-100">
              <button
                onClick={() => navigate("/login")}
                className="flex-1 px-4 py-2.5 rounded-full border border-gray-300 text-gray-700 text-sm font-semibold transition-all"
              >
                Login
              </button>
              <button
                onClick={() => navigate("/register")}
                className="flex-1 px-4 py-2.5 rounded-full bg-[#2563eb] text-white text-sm font-semibold transition-all"
              >
                Start Free Trial
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* ───── Hero ───── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-12 sm:pt-16 pb-16 sm:pb-24 grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-10 lg:gap-14 items-center">
        <div className="fade-up">
          <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200/70 rounded-full px-4 py-1.5 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 pulse-dot" />
            <span className="text-blue-700 text-[10px] sm:text-xs font-mono tracking-wide">
              10-DAY FREE TRIAL · UP TO 10 TABLES · NO CARD REQUIRED
            </span>
          </div>

          <p className="text-gray-400 text-xs font-mono tracking-wide mb-6">
            BUILT BY AN IIT BOMBAY UNDERGRADUATE
          </p>

          <h1 className="font-display text-3xl sm:text-4xl md:text-[3.4rem] leading-[1.12] font-extrabold text-gray-900 mb-5 sm:mb-6">
            Every table,
            <br />
            <span className="text-[#2563eb]">ordered, tracked,</span>
            <br />
            served on time.
          </h1>

          <p className="text-gray-500 text-base sm:text-lg mb-8 sm:mb-10 max-w-xl leading-relaxed">
            Dinora turns any table into a digital counter — customers scan and
            order, your kitchen sees it the second it's placed, and the bill
            prints itself with GST done.
          </p>

          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <button
              onClick={() => navigate("/register")}
              className="group px-8 py-4 bg-[#2563eb] hover:bg-[#1d4ed8] text-white rounded-full font-bold text-base transition-all hover:-translate-y-0.5 shadow-[0_8px_24px_-8px_rgba(37,99,235,0.5)] w-full sm:w-auto inline-flex items-center justify-center gap-2"
            >
              Start Free Trial
              <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </button>
            <button
              onClick={() => navigate("/login")}
              className="text-gray-500 hover:text-[#2563eb] text-sm font-semibold underline decoration-gray-300 underline-offset-4 transition-colors text-left"
            >
              Already have an account? Login
            </button>
          </div>
        </div>

        {/* Live kitchen ticket */}
        <div className="relative float-slow">
          <div className="absolute -top-6 right-8 text-2xl text-gray-300 steam-1">
            〜
          </div>
          <div className="absolute -top-8 right-16 text-2xl text-gray-200 steam-2">
            〜
          </div>
          <div className="absolute -top-6 right-24 text-2xl text-gray-200 steam-3">
            〜
          </div>
          <LiveTicket />
        </div>
      </div>

      {/* ───── Features ───── */}
      <div
        id="features"
        className="bg-slate-50 border-y border-gray-200/60 scroll-mt-20"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
          <h2 className="font-display text-2xl sm:text-3xl md:text-4xl text-center mb-3 text-gray-900">
            Everything your restaurant needs
          </h2>
          <p className="text-gray-400 text-center mb-12 sm:mb-16 font-mono text-xs tracking-wide">
            BUILT FOR HOW INDIAN RESTAURANTS ACTUALLY RUN
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {FEATURES.map((f, i) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.title}
                  onMouseEnter={() => setHoveredFeature(i)}
                  onMouseLeave={() => setHoveredFeature(null)}
                  className={`rounded-2xl border p-5 sm:p-6 transition-all duration-300 cursor-default ${
                    hoveredFeature === i
                      ? "border-[#2563eb]/30 bg-blue-50/50 -translate-y-1 shadow-[0_12px_30px_-12px_rgba(37,99,235,0.15)]"
                      : "border-gray-200/80 bg-white"
                  }`}
                >
                  <div
                    className={`mb-4 transition-transform duration-300 ${
                      hoveredFeature === i ? "scale-110" : ""
                    }`}
                  >
                    <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center">
                      <Icon className="w-6 h-6 text-[#2563eb]" strokeWidth={2} />
                    </div>
                  </div>
                  <div className="font-display text-gray-900 text-lg mb-2">
                    {f.title}
                  </div>
                  <div className="text-gray-500 text-sm leading-relaxed">
                    {f.desc}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ───── How it works ───── */}
      <div id="how-it-works" className="scroll-mt-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
          <h2 className="font-display text-2xl sm:text-3xl md:text-4xl text-center mb-12 sm:mb-16 text-gray-900">
            How it works
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
            {[
              {
                step: "01",
                title: "Sign up & set up",
                desc: "Create your account, add your restaurant name, address, and GST details.",
              },
              {
                step: "02",
                title: "Add menu & tables",
                desc: "Add categories, dishes with photos, and generate a QR code for every table.",
              },
              {
                step: "03",
                title: "Customers scan & order",
                desc: "They scan, browse, order, and pay — you manage everything from your dashboard.",
              },
            ].map((s, i) => (
              <div
                key={s.step}
                className="relative rounded-2xl border border-dashed border-gray-300 p-5 sm:p-6 text-center bg-white"
              >
                {i < 2 && (
                  <div className="hidden md:block absolute top-1/2 -right-3 w-6 h-px bg-gray-300" />
                )}
                <div className="font-mono text-[#2563eb] text-sm mb-4 tracking-widest font-medium">
                  {s.step}
                </div>
                <div className="font-display text-gray-900 text-lg mb-2">
                  {s.title}
                </div>
                <div className="text-gray-500 text-sm leading-relaxed">
                  {s.desc}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ───── Pricing ───── */}
      <div
        id="pricing"
        className="bg-slate-50 border-y border-gray-200/60 scroll-mt-20"
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
          <h2 className="font-display text-2xl sm:text-3xl md:text-4xl text-center mb-3 text-gray-900">
            Simple pricing
          </h2>
          <p className="text-gray-400 text-center mb-8 font-mono text-xs tracking-wide">
            10-DAY FREE TRIAL · NO CARD REQUIRED
          </p>

          {/* Toggle */}
          <div className="flex justify-center mb-10 sm:mb-12">
            <div className="inline-flex items-center gap-1 bg-gray-100 border border-gray-200 rounded-full p-1">
              <button
                onClick={() => setBillingCycle("monthly")}
                className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${
                  billingCycle === "monthly"
                    ? "bg-[#2563eb] text-white shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle("yearly")}
                className={`relative px-5 py-2 rounded-full text-sm font-semibold transition-all ${
                  billingCycle === "yearly"
                    ? "bg-[#2563eb] text-white shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Yearly
                <span className="absolute -top-2.5 -right-2.5 bg-emerald-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                  SAVE
                </span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
            {PLANS.map((plan) => {
              const price =
                billingCycle === "yearly" ? plan.yearlyPrice : plan.monthlyPrice;
              const period = billingCycle === "yearly" ? "year" : "month";
              const { savings, percentSaved } = getYearlySavings(plan);

              return (
                <div
                  key={plan.id}
                  className={`rounded-2xl border p-6 sm:p-8 relative bg-white flex flex-col ${
                    plan.badge
                      ? "border-[#2563eb]/40 shadow-[0_4px_20px_-6px_rgba(37,99,235,0.12)]"
                      : "border-gray-200"
                  }`}
                >
                  {plan.badge && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#2563eb] text-white text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap">
                      {plan.badge}
                    </div>
                  )}

                  <div className="font-display text-gray-900 text-xl mb-1">
                    {plan.name}
                  </div>

                  <div key={billingCycle} className="price-swap">
                    <div className="font-display text-gray-900 text-3xl sm:text-4xl mb-1">
                      ₹{price.toLocaleString()}
                      <span className="text-gray-400 text-sm sm:text-base font-body font-normal">
                        /{period}
                      </span>
                    </div>
                    {billingCycle === "yearly" && (
                      <div className="text-emerald-600 text-xs font-semibold mb-4">
                        You save ₹{savings.toLocaleString()} ({percentSaved}%) a
                        year
                      </div>
                    )}
                    {billingCycle === "monthly" && <div className="mb-4" />}
                  </div>

                  <div className="space-y-2.5 mb-8 flex-1">
                    {plan.features.map((f) => (
                      <div
                        key={f}
                        className="flex items-start gap-2 text-gray-600 text-sm"
                      >
                        <span className="text-[#2563eb] shrink-0 mt-0.5">
                          ✓
                        </span>
                        {f}
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => navigate("/register")}
                    className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all ${
                      plan.badge
                        ? "bg-[#2563eb] hover:bg-[#1d4ed8] text-white shadow-[0_4px_12px_-4px_rgba(37,99,235,0.4)]"
                        : "bg-gray-800 hover:bg-gray-900 text-white"
                    }`}
                  >
                    Get Started
                  </button>
                </div>
              );
            })}
          </div>

          <p className="text-center text-gray-400 text-xs mt-8">
            Register to start your free trial — no plan selection needed until
            you're ready.
          </p>
        </div>
      </div>

      {/* ───── Footer ───── */}
      <footer className="bg-gray-900 text-gray-300">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-14 pb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
            {/* Brand */}
            <div>
              <span className="font-display text-xl text-white">
                Din<span className="text-[#60a5fa]">ora</span>
              </span>
              <p className="text-gray-400 text-sm mt-3 leading-relaxed max-w-xs">
                QR ordering and restaurant management, built for how Indian
                restaurants actually run.
              </p>
            </div>

            {/* Product */}
            <div>
              <h4 className="text-white font-semibold text-sm mb-4 font-mono tracking-wide uppercase">
                Product
              </h4>
              <div className="space-y-2.5 text-sm">
                <button
                  onClick={() => scrollToSection("features")}
                  className="block text-gray-400 hover:text-[#60a5fa] transition-colors text-left"
                >
                  Features
                </button>
                <button
                  onClick={() => scrollToSection("pricing")}
                  className="block text-gray-400 hover:text-[#60a5fa] transition-colors text-left"
                >
                  Pricing
                </button>
                <button
                  onClick={() => navigate("/login")}
                  className="block text-gray-400 hover:text-[#60a5fa] transition-colors text-left"
                >
                  Login
                </button>
                <button
                  onClick={() => navigate("/register")}
                  className="block text-gray-400 hover:text-[#60a5fa] transition-colors text-left"
                >
                  Register
                </button>
              </div>
            </div>

            {/* Legal */}
            {/* <div>
              <h4 className="text-white font-semibold text-sm mb-4 font-mono tracking-wide uppercase">
                Legal
              </h4>
              <div className="space-y-2.5 text-sm">
                <button
                  onClick={() => navigate("/privacy-policy")}
                  className="block text-gray-400 hover:text-[#60a5fa] transition-colors text-left"
                >
                  Privacy Policy
                </button>
                <button
                  onClick={() => navigate("/terms-and-conditions")}
                  className="block text-gray-400 hover:text-[#60a5fa] transition-colors text-left"
                >
                  Terms &amp; Conditions
                </button>
                <button
                  onClick={() => navigate("/refund-policy")}
                  className="block text-gray-400 hover:text-[#60a5fa] transition-colors text-left"
                >
                  Cancellation &amp; Refund
                </button>
                <button
                  onClick={() => navigate("/contact")}
                  className="block text-gray-400 hover:text-[#60a5fa] transition-colors text-left"
                >
                  Contact Us
                </button>
              </div>
            </div> */}






            {/* Contact */}
            <div>
              <h4 className="text-white font-semibold text-sm mb-4 font-mono tracking-wide uppercase">
                Get in touch
              </h4>
              <div className="space-y-3 text-sm">
                <div className="text-gray-400">
                  <span className="text-gray-500 text-xs">Founder</span>
                  <br />
                  Ankit Saini
                  <span className="text-gray-500 text-xs ml-1.5">
                    IIT Bombay
                  </span>
                </div>
                <a
                  href="mailto:ankittkarodiya@gmail.com"
                  className="flex items-center gap-2 text-gray-400 hover:text-[#60a5fa] transition-colors"
                >
                  <Mail className="w-3.5 h-3.5 shrink-0" />
                  ankittkarodiya@gmail.com
                </a>
                <a
                  href="tel:+918306762768"
                  className="flex items-center gap-2 text-gray-400 hover:text-[#60a5fa] transition-colors"
                >
                  <Phone className="w-3.5 h-3.5 shrink-0" />
                  +91 8306762768
                </a>
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="border-t border-gray-700/50 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="text-gray-500 text-xs font-mono">
              © {new Date().getFullYear()} DINORA. All rights reserved.
            </span>
            <span className="text-gray-500 text-xs font-mono">
              Made in India 🇮🇳
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
