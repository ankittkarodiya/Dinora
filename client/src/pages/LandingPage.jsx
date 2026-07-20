import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

import {
  QrCode,
  UtensilsCrossed,
  ClipboardList,
  Receipt,
  CreditCard,
  BarChart3,
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
    // features: [
    //   "QR ordering",
    //   "Menu & category management with photos",
    //   "Up to 10 tables",
    //   "Order management",
    //   "Kitchen slip printing with GST",
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
      "Up to 10 tables",
      ],
    },
  {
    id: "pro",
    name: "Pro",
    monthlyPrice: 1299,
    yearlyPrice: 12999,
    badge: "Most Popular",
    // features: [
    //   "Everything in Basic",
    //   "Up to 30 tables",
    //   "Online payments (your own Razorpay)",
    //   "Customer reviews & ratings",
    //   "Analytics dashboard",
    //   "Order history & date filtering",
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

const getYearlySavings = (plan) => {
  const fullYearAtMonthlyRate = plan.monthlyPrice * 12;
  const savings = fullYearAtMonthlyRate - plan.yearlyPrice;
  const percentSaved = Math.round((savings / fullYearAtMonthlyRate) * 100);
  return { savings, percentSaved };
};

const STATUSES = [
  { label: "Pending", color: "#8a8378", dot: "#c9c2b4" },
  { label: "Accepted", color: "#c98a2e", dot: "#e8a33d" },
  { label: "Preparing", color: "#b8451f", dot: "#e8622f" },
  { label: "Ready", color: "#3f6b52", dot: "#6ea684" },
  { label: "Served", color: "#1d1a17", dot: "#4b6355" },
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
    <div className="relative w-full max-w-75 mx-auto">
      <div className="absolute -inset-3 rounded-[28px] bg-[#e8a33d]/10 blur-2xl" />
      <div className="relative rounded-sm bg-[#fbf3e7] text-[#1d1a17] shadow-[0_20px_50px_-15px_rgba(0,0,0,0.6)] px-6 pt-6 pb-8 ticket-edge">
        <div className="flex items-center justify-between mb-4">
          <span className="font-mono text-[11px] tracking-widest uppercase text-[#8a8378]">
            Order Slip
          </span>
          <span className="font-mono text-[11px] tracking-widest text-[#8a8378]">
            Table 07
          </span>
        </div>
        <div className="border-t border-dashed border-[#c9c2b4] pt-4 space-y-2 mb-5 font-mono text-[13px]">
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
        <div className="border-t border-dashed border-[#c9c2b4] pt-4 flex items-center justify-between">
          <span className="font-mono text-[11px] uppercase tracking-widest text-[#8a8378]">
            Status
          </span>
          <span
            key={step}
            className="ticket-stamp inline-flex items-center gap-2 font-mono text-[12px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-sm"
            style={{
              color: current.color,
              border: `1.5px solid ${current.color}`,
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full pulse-dot"
              style={{ background: current.dot }}
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

  return (
    <div className="min-h-screen bg-[#1d1a17] font-body text-[#f6efe3] overflow-x-hidden">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap');
        .font-display { font-family: 'Fraunces', serif; font-optical-sizing: auto; }
        .font-body { font-family: 'Inter', sans-serif; }
        .font-mono { font-family: 'JetBrains Mono', monospace; }
        .ticket-edge {
          --notch: 12px;
          -webkit-mask-image: radial-gradient(circle at 0 0, transparent var(--notch), black calc(var(--notch) + 0.5px)),
                               radial-gradient(circle at 100% 0, transparent var(--notch), black calc(var(--notch) + 0.5px));
        }
        .ticket-edge::after {
          content: "";
          position: absolute;
          left: 0; right: 0; bottom: -6px;
          height: 12px;
          background: repeating-linear-gradient(90deg, transparent, transparent 6px, #1d1a17 6px, #1d1a17 12px);
        }
        @keyframes stampIn {
          0% { opacity: 0; transform: scale(1.4) rotate(-6deg); }
          60% { opacity: 1; transform: scale(0.94) rotate(-6deg); }
          100% { opacity: 1; transform: scale(1) rotate(-6deg); }
        }
        .ticket-stamp { animation: stampIn 0.4s ease-out; }
        @keyframes pulseDot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.7); }
        }
        .pulse-dot { animation: pulseDot 1.4s ease-in-out infinite; }
        @keyframes floatSlow {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        .float-slow { animation: floatSlow 5s ease-in-out infinite; }
        @keyframes steam {
          0% { opacity: 0; transform: translateY(0) scaleX(1); }
          30% { opacity: 0.6; }
          100% { opacity: 0; transform: translateY(-22px) scaleX(1.4); }
        }
        .steam-1 { animation: steam 3s ease-in infinite; }
        .steam-2 { animation: steam 3s ease-in infinite 1s; }
        .steam-3 { animation: steam 3s ease-in infinite 2s; }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .fade-up { animation: fadeUp 0.7s ease-out both; }
        @keyframes wobbleIn {
          0% { opacity: 0; transform: scale(0.9) rotate(-2deg); }
          100% { opacity: 1; transform: scale(1) rotate(0deg); }
        }
        .price-swap { animation: wobbleIn 0.35s ease-out; }
        @media (prefers-reduced-motion: reduce) {
          .float-slow, .steam-1, .steam-2, .steam-3, .pulse-dot, .ticket-stamp, .fade-up, .price-swap { animation: none !important; }
        }
      `}</style>

      {/* Nav */}
      <nav className="flex items-center justify-between px-4 sm:px-6 py-5 max-w-6xl mx-auto">
        <span className="font-display font-semibold text-xl sm:text-2xl tracking-tight text-[#f6efe3]">
          Din<span className="text-[#e8a33d]">ora</span>
        </span>
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => navigate("/login")}
            className="px-4 sm:px-5 py-2 rounded-full border border-[#f6efe3]/25 text-[#f6efe3] text-xs sm:text-sm font-semibold hover:border-[#f6efe3]/50 hover:bg-[#f6efe3]/5 transition-all"
          >
            Login
          </button>
          <button
            onClick={() => navigate("/register")}
            className="px-4 sm:px-5 py-2 rounded-full bg-[#c1440e] hover:bg-[#a83a0c] text-white text-xs sm:text-sm font-semibold transition-all shadow-[0_6px_20px_-6px_rgba(193,68,14,0.7)]"
          >
            Register
          </button>
        </div>
      </nav>

      {/* Hero */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-10 sm:pt-14 pb-16 sm:pb-24 grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-10 lg:gap-14 items-center">
        <div className="fade-up">
          <div className="inline-flex items-center gap-2 bg-[#e8a33d]/10 border border-[#e8a33d]/25 rounded-full px-4 py-1.5 mb-6 sm:mb-7">
            <span className="w-1.5 h-1.5 rounded-full bg-[#e8a33d] pulse-dot" />
            <span className="text-[#e8a33d] text-[10px] sm:text-xs font-mono tracking-wide">
              4-DAY FREE TRIAL · NO CARD REQUIRED
            </span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl md:text-[3.4rem] leading-[1.1] md:leading-[1.08] font-semibold text-[#f6efe3] mb-5 sm:mb-6">
            Every table,
            <br />
            <span className="text-[#e8a33d]">ordered, tracked,</span>
            <br />
            served on time.
          </h1>
          <p className="text-[#c9c2b4] text-base sm:text-lg mb-8 sm:mb-10 max-w-xl leading-relaxed">
            Dinora turns any table into a digital counter — customers scan and
            order, your kitchen sees it the second it's placed, and the bill
            prints itself with GST done.
          </p>

          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <button
              onClick={() => navigate("/login")}
              className="px-8 py-4 bg-[#c1440e] hover:bg-[#a83a0c] text-white rounded-full font-bold text-base transition-all hover:-translate-y-0.5 shadow-[0_10px_30px_-10px_rgba(193,68,14,0.8)] w-full sm:w-auto"
            >
              Login to Dashboard →
            </button>
            {/* ← replaces the old "Start Free Trial" button — plain text CTA instead */}
            <button
              onClick={() => navigate("/register")}
              className="text-[#f6efe3]/80 hover:text-[#e8a33d] text-sm font-semibold underline decoration-[#e8a33d]/40 underline-offset-4 transition-colors text-left"
            >
              Register to start your free trial
            </button>
          </div>
        </div>

        {/* Signature element: live kitchen ticket */}
        <div className="relative float-slow">
          <div className="absolute -top-6 right-6 text-2xl opacity-70 steam-1">
            〜
          </div>
          <div className="absolute -top-8 right-14 text-2xl opacity-50 steam-2">
            〜
          </div>
          <div className="absolute -top-6 right-24 text-2xl opacity-40 steam-3">
            〜
          </div>
          <LiveTicket />
        </div>
      </div>

      {/* Features */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14 sm:py-16 border-t border-[#f6efe3]/10">
        <h2 className="font-display text-2xl sm:text-3xl md:text-4xl text-center mb-3 text-[#f6efe3] font-semibold">
          Everything your restaurant needs
        </h2>
        <p className="text-[#8a8378] text-center mb-10 sm:mb-14 font-mono text-xs sm:text-sm tracking-wide px-4">
          BUILT FOR HOW INDIAN RESTAURANTS ACTUALLY RUN
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {/* {FEATURES.map((f, i) => (
            <div
              key={f.title}
              onMouseEnter={() => setHoveredFeature(i)}
              onMouseLeave={() => setHoveredFeature(null)}
              className={`rounded-2xl border p-5 sm:p-6 transition-all duration-300 cursor-default ${
                hoveredFeature === i
                  ? "border-[#e8a33d]/50 bg-[#f6efe3]/6 -translate-y-1 shadow-[0_16px_40px_-16px_rgba(232,163,61,0.3)]"
                  : "border-[#f6efe3]/10 bg-[#f6efe3]/3"
              }`}
            >
              <div className={`text-3xl mb-3 transition-transform duration-300 ${hoveredFeature === i ? "scale-110" : ""}`}>
                {f.icon}
              </div>
              <div className="text-[#f6efe3] font-display font-semibold text-lg mb-2">{f.title}</div>
              <div className="text-[#a39c8e] text-sm leading-relaxed">{f.desc}</div>
            </div>
          ))} */}
          {FEATURES.map((f, i) => {
  const Icon = f.icon;

  return (
    <div
      key={f.title}
      onMouseEnter={() => setHoveredFeature(i)}
      onMouseLeave={() => setHoveredFeature(null)}
      className={`rounded-2xl border p-5 sm:p-6 transition-all duration-300 cursor-default ${
        hoveredFeature === i
          ? "border-[#e8a33d]/50 bg-[#f6efe3]/6 -translate-y-1 shadow-[0_16px_40px_-16px_rgba(232,163,61,0.3)]"
          : "border-[#f6efe3]/10 bg-[#f6efe3]/3"
      }`}
    >
      {/* Icon */}
      <div
        className={`mb-4 transition-transform duration-300 ${
          hoveredFeature === i ? "scale-110" : ""
        }`}
      >
        <div className="w-14 h-14 rounded-xl bg-[#e8a33d]/10 border border-[#e8a33d]/20 flex items-center justify-center">
          <Icon
            className="w-7 h-7 text-[#e8a33d]"
            strokeWidth={2.2}
          />
        </div>
      </div>

      {/* Title */}
      <div className="text-[#f6efe3] font-display font-semibold text-lg mb-2">
        {f.title}
      </div>

      {/* Description */}
      <div className="text-[#a39c8e] text-sm leading-relaxed">
        {f.desc}
      </div>
    </div>
  );
})}

        </div>
      </div>

      {/* How it works */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-14 sm:py-16">
        <h2 className="font-display text-2xl sm:text-3xl md:text-4xl text-center mb-10 sm:mb-14 text-[#f6efe3] font-semibold">
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
              className="relative rounded-2xl border border-dashed border-[#f6efe3]/15 p-5 sm:p-6 text-center"
            >
              {i < 2 && (
                <div className="hidden md:block absolute top-1/2 -right-3 w-6 h-px bg-[#f6efe3]/15" />
              )}
              <div className="font-mono text-[#e8a33d] text-sm mb-4 tracking-widest">
                {s.step}
              </div>
              <div className="font-display text-[#f6efe3] font-semibold text-lg mb-2">
                {s.title}
              </div>
              <div className="text-[#a39c8e] text-sm leading-relaxed">
                {s.desc}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pricing */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-14 sm:py-16 border-t border-[#f6efe3]/10">
        <h2 className="font-display text-2xl sm:text-3xl md:text-4xl text-center mb-3 text-[#f6efe3] font-semibold">
          Simple pricing
        </h2>
        <p className="text-[#8a8378] text-center mb-8 font-mono text-xs sm:text-sm tracking-wide px-4">
          4-DAY FREE TRIAL · NO CARD REQUIRED
        </p>

        {/* Monthly / Yearly toggle */}
        <div className="flex justify-center mb-10 sm:mb-12">
          <div className="inline-flex items-center gap-1 bg-[#f6efe3]/5 border border-[#f6efe3]/10 rounded-full p-1">
            <button
              onClick={() => setBillingCycle("monthly")}
              className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${
                billingCycle === "monthly"
                  ? "bg-[#c1440e] text-white"
                  : "text-[#a39c8e]"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle("yearly")}
              className={`relative px-5 py-2 rounded-full text-sm font-semibold transition-all ${
                billingCycle === "yearly"
                  ? "bg-[#c1440e] text-white"
                  : "text-[#a39c8e]"
              }`}
            >
              Yearly
              <span className="absolute -top-2.5 -right-2.5 bg-[#6ea684] text-[#1d1a17] text-[9px] font-bold px-1.5 py-0.5 rounded-full">
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
                className={`rounded-2xl border p-6 sm:p-8 relative bg-[#f6efe3]/3 flex flex-col ${
                  plan.badge ? "border-[#e8a33d]/50" : "border-[#f6efe3]/10"
                }`}
              >
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#e8a33d] text-[#1d1a17] text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap">
                    {plan.badge}
                  </div>
                )}
                <div className="font-display text-[#f6efe3] font-semibold text-xl mb-1">
                  {plan.name}
                </div>

                <div key={billingCycle} className="price-swap">
                  <div className="font-display text-[#f6efe3] font-bold text-3xl sm:text-4xl mb-1">
                    ₹{price.toLocaleString()}
                    <span className="text-[#8a8378] text-sm sm:text-base font-body font-normal">
                      /{period}
                    </span>
                  </div>
                  {billingCycle === "yearly" && (
                    <div className="text-[#6ea684] text-xs font-semibold mb-4">
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
                      className="flex items-start gap-2 text-[#c9c2b4] text-sm"
                    >
                      <span className="text-[#6ea684] shrink-0">✓</span>
                      {f}
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => navigate("/register")}
                  className="w-full py-3.5 bg-[#c1440e] hover:bg-[#a83a0c] text-white rounded-xl font-bold text-sm transition-all mt-auto"
                >
                  Get Started
                </button>
              </div>
            );
          })}
        </div>

        <p className="text-center text-[#8a8378] text-xs mt-8">
          Register to start your free trial — no plan selection needed until
          you're ready.
        </p>
      </div>

      {/* Footer */}
      {/* <div className="border-t border-[#f6efe3]/10 py-8 text-center px-4">
        <span className="text-[#8a8378] text-sm font-mono">© {new Date().getFullYear()} DINORA</span>
      </div> */}
      {/* Footer */}
      <footer className="border-t border-[#f6efe3]/10 pt-14 pb-8 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          {/* <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12"> */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10 mb-12">
            {/* Brand column */}
            <div>
              <span className="font-display font-semibold text-xl tracking-tight text-[#f6efe3]">
                Din<span className="text-[#e8a33d]">ora</span>
              </span>
              <p className="text-[#a39c8e] text-sm mt-3 leading-relaxed max-w-xs">
                QR ordering and restaurant management, built for how Indian
                restaurants actually run.
              </p>
            </div>

            {/* Contact */}
            <div>
              <div className="text-[#f6efe3] font-semibold text-sm mb-4 font-mono tracking-wide uppercase">
                Contact
              </div>
              <div className="space-y-2.5 text-sm">
                <div className="text-[#a39c8e]">
                  <span className="text-[#8a8378]">Founder:</span> Ankit Saini
                </div>
                <a
                  href="mailto:your-email@example.com"
                  className="block text-[#a39c8e] hover:text-[#e8a33d] transition-colors"
                >
                  ankittkarodiya@gmail.com
                </a>
                <a
                  href="tel:+91XXXXXXXXXX"
                  className="block text-[#a39c8e] hover:text-[#e8a33d] transition-colors"
                >
                  +91 8306762768
                </a>
              </div>
            </div>

            {/* Social */}
            {/* <div>
              <div className="text-[#f6efe3] font-semibold text-sm mb-4 font-mono tracking-wide uppercase">
                Follow
              </div>
              <div className="flex gap-3">
                <a
                  href="https://instagram.com/your-handle"
                  target="_blank"
                  rel="noreferrer"
                  className="w-10 h-10 rounded-full border border-[#f6efe3]/15 flex items-center justify-center hover:border-[#e8a33d]/50 hover:bg-[#e8a33d]/10 transition-all"
                  aria-label="Instagram"
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    className="text-[#f6efe3]"
                  >
                    <rect x="2" y="2" width="20" height="20" rx="5" />
                    <circle cx="12" cy="12" r="4" />
                    <circle
                      cx="17.5"
                      cy="6.5"
                      r="1"
                      fill="currentColor"
                      stroke="none"
                    />
                  </svg>
                </a>

                <a
                  href="https://linkedin.com/in/your-handle"
                  target="_blank"
                  rel="noreferrer"
                  className="w-10 h-10 rounded-full border border-[#f6efe3]/15 flex items-center justify-center hover:border-[#e8a33d]/50 hover:bg-[#e8a33d]/10 transition-all"
                  aria-label="LinkedIn"
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="text-[#f6efe3]"
                  >
                    <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.36V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.38-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 110-4.12 2.06 2.06 0 010 4.12zM7.11 20.45H3.56V9h3.55v11.45z" />
                  </svg>
                </a>

                <a
                  href="https://twitter.com/your-handle"
                  target="_blank"
                  rel="noreferrer"
                  className="w-10 h-10 rounded-full border border-[#f6efe3]/15 flex items-center justify-center hover:border-[#e8a33d]/50 hover:bg-[#e8a33d]/10 transition-all"
                  aria-label="X (Twitter)"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="text-[#f6efe3]"
                  >
                    <path d="M18.9 2H22l-7.6 8.7L23.3 22h-7.3l-5.7-7.4L3.7 22H.6l8.2-9.3L.9 2h7.5l5.2 6.8L18.9 2zm-1.3 18h2L6.5 3.9h-2L17.6 20z" />
                  </svg>
                </a>
              </div>
            </div> */}

            {/* Product links */}
            <div>
              <div className="text-[#f6efe3] font-semibold text-sm mb-4 font-mono tracking-wide uppercase">
                Product
              </div>
              <div className="space-y-2.5 text-sm">
                <button
                  onClick={() => navigate("/login")}
                  className="block text-[#a39c8e] hover:text-[#e8a33d] transition-colors text-left"
                >
                  Login
                </button>
                <button
                  onClick={() => navigate("/register")}
                  className="block text-[#a39c8e] hover:text-[#e8a33d] transition-colors text-left"
                >
                  Register
                </button>
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="border-t border-[#f6efe3]/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="text-[#8a8378] text-xs font-mono">
              © {new Date().getFullYear()} DINORA. All rights reserved.
            </span>
            <span className="text-[#8a8378] text-xs font-mono">
              Made in India 🇮🇳
            </span>
          </div>
        </div>
      </footer>
      
    </div>
  );
}





















// import { useNavigate } from "react-router-dom";
// import { useEffect, useState } from "react";

// const FEATURES = [
//   { icon: "📱", title: "QR Ordering", desc: "Customers scan a table QR and order directly from their phone — no app to download." },
//   { icon: "🍽️", title: "Menu with Real Photos", desc: "Organise dishes into categories, upload real photos, mark veg/non-veg and bestsellers." },
//   { icon: "📋", title: "Live Order Tracking", desc: "Orders flow through Pending → Accepted → Preparing → Ready → Served, visible to your kitchen in real time." },
//   { icon: "🧾", title: "Kitchen Slips with GST", desc: "One-click printable bills with CGST/SGST breakdown, ready for your kitchen and your customer." },
//   { icon: "💳", title: "Cash & Online Payments", desc: "Accept cash always. Link your own Razorpay account on Basic and Pro to accept UPI, cards, and netbanking." },
//   { icon: "⭐", title: "Reviews & Analytics", desc: "On Pro: customers rate dishes after their order is served, and you get a full revenue dashboard." },
// ];

// const PLANS = [
//   {
//     id: "basic", name: "Basic", price: 999,
//     features: ["QR ordering", "Menu & category management with photos", "Up to 10 tables", "Order management", "Kitchen slip printing with GST", "Cash payments"],
//   },
//   {
//     id: "pro", name: "Pro", price: 1999, badge: "Most Popular",
//     features: ["Everything in Basic", "Up to 30 tables", "Online payments (your own Razorpay)", "Customer reviews & ratings", "Analytics dashboard", "Order history & date filtering"],
//   },
// ];

// const STATUSES = [
//   { label: "Pending",   color: "#8a8378", dot: "#c9c2b4" },
//   { label: "Accepted",  color: "#c98a2e", dot: "#e8a33d" },
//   { label: "Preparing", color: "#b8451f", dot: "#e8622f" },
//   { label: "Ready",     color: "#3f6b52", dot: "#6ea684" },
//   { label: "Served",    color: "#1d1a17", dot: "#4b6355" },
// ];

// function LiveTicket() {
//   const [step, setStep] = useState(0);

//   useEffect(() => {
//     const id = setInterval(() => setStep((s) => (s + 1) % STATUSES.length), 1800);
//     return () => clearInterval(id);
//   }, []);

//   const current = STATUSES[step];

//   return (
//     <div className="relative w-full max-w-75 mx-auto">
//       <div className="absolute -inset-3 rounded-[28px] bg-[#e8a33d]/10 blur-2xl" />
//       <div className="relative rounded-sm bg-[#fbf3e7] text-[#1d1a17] shadow-[0_20px_50px_-15px_rgba(0,0,0,0.6)] px-6 pt-6 pb-8 ticket-edge">
//         <div className="flex items-center justify-between mb-4">
//           <span className="font-mono text-[11px] tracking-widest uppercase text-[#8a8378]">Order Slip</span>
//           <span className="font-mono text-[11px] tracking-widest text-[#8a8378]">Table 07</span>
//         </div>
//         <div className="border-t border-dashed border-[#c9c2b4] pt-4 space-y-2 mb-5 font-mono text-[13px]">
//           <div className="flex justify-between"><span>1× Paneer Tikka</span><span>₹280</span></div>
//           <div className="flex justify-between"><span>2× Butter Naan</span><span>₹120</span></div>
//           <div className="flex justify-between"><span>1× Masala Chai</span><span>₹60</span></div>
//         </div>
//         <div className="border-t border-dashed border-[#c9c2b4] pt-4 flex items-center justify-between">
//           <span className="font-mono text-[11px] uppercase tracking-widest text-[#8a8378]">Status</span>
//           <span
//             key={step}
//             className="ticket-stamp inline-flex items-center gap-2 font-mono text-[12px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-sm"
//             style={{ color: current.color, border: `1.5px solid ${current.color}` }}
//           >
//             <span className="w-1.5 h-1.5 rounded-full pulse-dot" style={{ background: current.dot }} />
//             {current.label}
//           </span>
//         </div>
//       </div>
//     </div>
//   );
// }

// export default function LandingPage() {
//   const navigate = useNavigate();

//   return (
//     <div className="min-h-screen bg-[#1d1a17] font-body text-[#f6efe3]">
//       <style>{`
//         @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap');
//         .font-display { font-family: 'Fraunces', serif; font-optical-sizing: auto; }
//         .font-body { font-family: 'Inter', sans-serif; }
//         .font-mono { font-family: 'JetBrains Mono', monospace; }

//         .ticket-edge {
//           --notch: 12px;
//           -webkit-mask-image: radial-gradient(circle at 0 0, transparent var(--notch), black calc(var(--notch) + 0.5px)),
//                                radial-gradient(circle at 100% 0, transparent var(--notch), black calc(var(--notch) + 0.5px));
//         }
//         .ticket-edge::after {
//           content: "";
//           position: absolute;
//           left: 0; right: 0; bottom: -6px;
//           height: 12px;
//           background: repeating-linear-gradient(90deg, transparent, transparent 6px, #1d1a17 6px, #1d1a17 12px);
//         }

//         @keyframes stampIn {
//           0% { opacity: 0; transform: scale(1.4) rotate(-6deg); }
//           60% { opacity: 1; transform: scale(0.94) rotate(-6deg); }
//           100% { opacity: 1; transform: scale(1) rotate(-6deg); }
//         }
//         .ticket-stamp { animation: stampIn 0.4s ease-out; }

//         @keyframes pulseDot {
//           0%, 100% { opacity: 1; transform: scale(1); }
//           50% { opacity: 0.4; transform: scale(0.7); }
//         }
//         .pulse-dot { animation: pulseDot 1.4s ease-in-out infinite; }

//         @keyframes floatSlow {
//           0%, 100% { transform: translateY(0px); }
//           50% { transform: translateY(-10px); }
//         }
//         .float-slow { animation: floatSlow 5s ease-in-out infinite; }

//         @keyframes steam {
//           0% { opacity: 0; transform: translateY(0) scaleX(1); }
//           30% { opacity: 0.6; }
//           100% { opacity: 0; transform: translateY(-22px) scaleX(1.4); }
//         }
//         .steam-1 { animation: steam 3s ease-in infinite; }
//         .steam-2 { animation: steam 3s ease-in infinite 1s; }
//         .steam-3 { animation: steam 3s ease-in infinite 2s; }

//         @keyframes fadeUp {
//           from { opacity: 0; transform: translateY(16px); }
//           to { opacity: 1; transform: translateY(0); }
//         }
//         .fade-up { animation: fadeUp 0.7s ease-out both; }

//         @media (prefers-reduced-motion: reduce) {
//           .float-slow, .steam-1, .steam-2, .steam-3, .pulse-dot, .ticket-stamp, .fade-up { animation: none !important; }
//         }
//       `}</style>

//       {/* Nav */}
//       <nav className="flex items-center justify-between px-6 py-5 max-w-6xl mx-auto">
//         <span className="font-display font-semibold text-2xl tracking-tight text-[#f6efe3]">
//           Table<span className="text-[#e8a33d]">Turn</span>
//         </span>
//         <div className="flex items-center gap-3">
//           <button
//             onClick={() => navigate("/login")}
//             className="px-5 py-2 rounded-full border border-[#f6efe3]/25 text-[#f6efe3] text-sm font-semibold hover:border-[#f6efe3]/50 hover:bg-[#f6efe3]/5 transition-all"
//           >
//             Login
//           </button>
//           <button
//             onClick={() => navigate("/register")}
//             className="px-5 py-2 rounded-full bg-[#c1440e] hover:bg-[#a83a0c] text-white text-sm font-semibold transition-all shadow-[0_6px_20px_-6px_rgba(193,68,14,0.7)]"
//           >
//             Register
//           </button>
//         </div>
//       </nav>

//       {/* Hero */}
//       <div className="max-w-6xl mx-auto px-6 pt-14 pb-24 grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-14 items-center">
//         <div className="fade-up">
//           <div className="inline-flex items-center gap-2 bg-[#e8a33d]/10 border border-[#e8a33d]/25 rounded-full px-4 py-1.5 mb-7">
//             <span className="w-1.5 h-1.5 rounded-full bg-[#e8a33d] pulse-dot" />
//             <span className="text-[#e8a33d] text-xs font-mono tracking-wide">4-DAY FREE TRIAL · NO CARD REQUIRED</span>
//           </div>
//           <h1 className="font-display text-4xl md:text-[3.4rem] leading-[1.08] font-semibold text-[#f6efe3] mb-6">
//             Every table,<br />
//             <span className="text-[#e8a33d]">ordered, tracked,</span><br />
//             served on time.
//           </h1>
//           <p className="text-[#c9c2b4] text-lg mb-10 max-w-xl leading-relaxed">
//             Dinora turns any table into a digital counter — customers scan and order,
//             your kitchen sees it the second it's placed, and the bill prints itself with GST done.
//           </p>
//           <div className="flex flex-col sm:flex-row gap-4">
//             <button
//               onClick={() => navigate("/register")}
//               className="px-8 py-4 bg-[#c1440e] hover:bg-[#a83a0c] text-white rounded-full font-bold text-base transition-all hover:-translate-y-0.5 shadow-[0_10px_30px_-10px_rgba(193,68,14,0.8)]"
//             >
//               Start Free Trial →
//             </button>
//             <button
//               onClick={() => navigate("/login")}
//               className="px-8 py-4 border border-[#f6efe3]/20 text-[#f6efe3] rounded-full font-bold text-base hover:bg-[#f6efe3]/5 transition-all"
//             >
//               Login to Dashboard
//             </button>
//           </div>
//         </div>

//         {/* Signature element: live kitchen ticket */}
//         <div className="relative float-slow">
//           <div className="absolute -top-6 right-6 text-2xl opacity-70 steam-1">〜</div>
//           <div className="absolute -top-8 right-14 text-2xl opacity-50 steam-2">〜</div>
//           <div className="absolute -top-6 right-24 text-2xl opacity-40 steam-3">〜</div>
//           <LiveTicket />
//         </div>
//       </div>

//       {/* Features */}
//       <div className="max-w-6xl mx-auto px-6 py-16 border-t border-[#f6efe3]/10">
//         <h2 className="font-display text-3xl md:text-4xl text-center mb-3 text-[#f6efe3] font-semibold">
//           Everything your restaurant needs
//         </h2>
//         <p className="text-[#8a8378] text-center mb-14 font-mono text-sm tracking-wide">
//           BUILT FOR HOW INDIAN RESTAURANTS ACTUALLY RUN
//         </p>
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
//           {FEATURES.map((f) => (
//             <div
//               key={f.title}
//               className="rounded-2xl border border-[#f6efe3]/10 bg-[#f6efe3]/3 p-6 hover:bg-[#f6efe3]/6 hover:border-[#e8a33d]/30 transition-all"
//             >
//               <div className="text-3xl mb-3">{f.icon}</div>
//               <div className="text-[#f6efe3] font-display font-semibold text-lg mb-2">{f.title}</div>
//               <div className="text-[#a39c8e] text-sm leading-relaxed">{f.desc}</div>
//             </div>
//           ))}
//         </div>
//       </div>

//       {/* How it works — styled as a perforated ticket strip */}
//       <div className="max-w-4xl mx-auto px-6 py-16">
//         <h2 className="font-display text-3xl md:text-4xl text-center mb-14 text-[#f6efe3] font-semibold">
//           How it works
//         </h2>
//         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
//           {[
//             { step: "01", title: "Sign up & set up", desc: "Create your account, add your restaurant name, address, and GST details." },
//             { step: "02", title: "Add menu & tables", desc: "Add categories, dishes with photos, and generate a QR code for every table." },
//             { step: "03", title: "Customers scan & order", desc: "They scan, browse, order, and pay — you manage everything from your dashboard." },
//           ].map((s, i) => (
//             <div key={s.step} className="relative rounded-2xl border border-dashed border-[#f6efe3]/15 p-6 text-center">
//               {i < 2 && <div className="hidden md:block absolute top-1/2 -right-3 w-6 h-px bg-[#f6efe3]/15" />}
//               <div className="font-mono text-[#e8a33d] text-sm mb-4 tracking-widest">{s.step}</div>
//               <div className="font-display text-[#f6efe3] font-semibold text-lg mb-2">{s.title}</div>
//               <div className="text-[#a39c8e] text-sm leading-relaxed">{s.desc}</div>
//             </div>
//           ))}
//         </div>
//       </div>

//       {/* Pricing — menu-board styled cards */}
//       <div className="max-w-4xl mx-auto px-6 py-16 border-t border-[#f6efe3]/10">
//         <h2 className="font-display text-3xl md:text-4xl text-center mb-3 text-[#f6efe3] font-semibold">
//           Simple pricing
//         </h2>
//         <p className="text-[#8a8378] text-center mb-14 font-mono text-sm tracking-wide">
//           4-DAY FREE TRIAL · NO CARD REQUIRED
//         </p>
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//           {PLANS.map((plan) => (
//             <div
//               key={plan.id}
//               className={`rounded-2xl border p-8 relative bg-[#f6efe3]/3 ${
//                 plan.badge ? "border-[#e8a33d]/50" : "border-[#f6efe3]/10"
//               }`}
//             >
//               {plan.badge && (
//                 <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#e8a33d] text-[#1d1a17] text-xs font-bold px-3 py-1 rounded-full">
//                   {plan.badge}
//                 </div>
//               )}
//               <div className="font-display text-[#f6efe3] font-semibold text-xl mb-1">{plan.name}</div>
//               <div className="font-display text-[#f6efe3] font-bold text-4xl mb-6">
//                 ₹{plan.price}
//                 <span className="text-[#8a8378] text-base font-body font-normal">/month</span>
//               </div>
//               <div className="space-y-2.5 mb-8">
//                 {plan.features.map((f) => (
//                   <div key={f} className="flex items-start gap-2 text-[#c9c2b4] text-sm">
//                     <span className="text-[#6ea684] shrink-0">✓</span>{f}
//                   </div>
//                 ))}
//               </div>
//               <button
//                 onClick={() => navigate("/register")}
//                 className="w-full py-3.5 bg-[#c1440e] hover:bg-[#a83a0c] text-white rounded-xl font-bold text-sm transition-all"
//               >
//                 Start Free Trial
//               </button>
//             </div>
//           ))}
//         </div>
//       </div>

//       {/* Footer */}
//       <div className="border-t border-[#f6efe3]/10 py-8 text-center">
//         <span className="text-[#8a8378] text-sm font-mono">© {new Date().getFullYear()} TABLETURN</span>
//       </div>
//     </div>
//   );
// }