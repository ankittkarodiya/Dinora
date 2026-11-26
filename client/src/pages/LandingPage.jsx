import { useState, useLayoutEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  QrCode,
  Store,
  MonitorSmartphone,
  Receipt,
  Zap,
  Check,
  X,
  Menu,
  ChevronDown,
  ArrowRight,
  Mail,
  Phone,
  CreditCard,
  BarChart3,
  UtensilsCrossed,
  Link2,
  Smartphone,
  Gift,
} from "lucide-react";

import DemoModal from "../components/landing/DemoModal";
import { PLAN_NAMES, PLAN_FEATURES, FOUNDING_OFFER } from "../config/plans";
import { LEGAL } from "../config/legal";

const HEAD = { fontFamily: "'Outfit', sans-serif" };

// ─────────────────────────── content ───────────────────────────
const WAYS = [
  {
    icon: QrCode,
    title: "Table QR",
    desc: "Guests scan the QR on their table, browse your menu with photos, order and pay. Nothing to download.",
  },
  {
    icon: Store,
    title: "Counter order",
    desc: "Staff tap items for walk-in customers and print the bill in one go. It lands in your orders and revenue.",
  },
  {
    icon: MonitorSmartphone,
    title: "Self-order kiosk",
    desc: "One QR at your entrance. Guests order and pay online on their own and get a token number.",
    // desc: "One QR at your entrance. Guests order and 'Pay Now' on their own and get a token number",
    pro: true,
  },
];

const FEATURES = [
  { icon: UtensilsCrossed, title: "Menu with real photos", desc: "Categories, veg / non-veg tags, half and full portions and bestseller marks." },

  { icon: Zap, title: "Live kitchen tracking", desc: "New orders appear instantly with an alert. Guests watch their order move along." },

  { icon: Receipt, title: "GST-ready bills", desc: "Print bills with CGST and SGST. Don't charge GST? Set it to 0% and the bill drops every tax line." },

  { icon: CreditCard, title: "Your money, your account", desc: "Link your own Razorpay. Online payments settle straight to you. Or they Pay Later after dining." },

  { icon: Link2, title: "A link of your own", desc: "Your restaurant gets its own address, like dinora.in/your-restaurant, to share anywhere." },

  { icon: Smartphone, title: "Install it like an app", desc: "Add Dinora to your phone's home screen and get push alerts for every new order." },

  { icon: BarChart3, title: "Reviews and analytics", desc: "See what sells, what guests rate highly and how revenue trends day by day.", pro: true },
];

const STEPS = [
  { n: "1", title: "Build your menu", desc: "Add categories and dishes with photos and prices. It takes minutes, not days." },
  { n: "2", title: "Print your QR codes", desc: "Generate a QR for every table, plus one for the kiosk if you use it." },
  { n: "3", title: "Orders come in live", desc: "Your kitchen sees every order the moment it's placed, from any phone or screen." },
];

// feature lists come from config/plans.js, so landing, setup and settings always match
const PLANS = [
  {
    id: "basic",
    monthly: 699,
    yearly: 6999,
    tagline: "Everything one restaurant needs to go digital.",
    features: PLAN_FEATURES.basic,
  },
  {
    id: "pro",
    monthly: 1299,
    yearly: 12999,
    featured: true,
    tagline: "For restaurants that want self-service and clear numbers.",
    features: PLAN_FEATURES.pro,
  },
];

const FAQS = [
  { q: "Do my guests need to download an app?", a: "No. They scan the QR with their phone camera and the menu opens in the browser." },

  { q: "Can I take orders at the counter too?", a: "Yes. The Counter Order screen lets your staff add items for a walk-in customer and print the bill. These orders count in your revenue like any other." },

  { q: "How do payments work?", a: "You link your own Razorpay account. Guests pay online and the money goes straight to you or Pay Later (they pay at the counter after their meal). Your dashboard keeps the two separate." },

  { q: "I don't charge GST. Can I turn it off?", a: "Yes. Set GST to 0% in Settings and your bills will show no GST, CGST or SGST lines at all." },

  {
    q: `What is the founding offer?`,
    a: `The first ${FOUNDING_OFFER.spots} restaurants to join get the ${PLAN_NAMES.pro} plan free. It is not unlocked by signing up alone: book a demo and we will confirm the details and activate it for you.`,
  },

  { q: "Is there a free trial?", a: "Yes, you can start with a free trial before choosing a plan. No card is needed to start." },
];

const fmt = (n) => "₹" + n.toLocaleString("en-IN");

// new to showcase product
// Product screenshot in a browser frame, with four callouts underneath
function ProductShowcase() {
  const points = [
    { t: "Search and categories stay put", d: "Only the items scroll, so your staff never lose their place." },
    { t: "Tap Add, then - 1 +", d: "Photo cards with half and full portions and the quantity right on the card." },
    { t: "Pay now or Pay later", d: "Settle at the counter now, or serve first and confirm the payment later." },
    { t: "Bill prints in one tap", d: "GST-ready, or no tax lines at 0%. It lands in your orders and revenue." },
  ];
  return (
    <section id="product" className="scroll-mt-16 py-20 bg-white">
      <div className="max-w-6xl mx-auto px-5">
        <div className="max-w-2xl">
          <h2 className="text-4xl font-extrabold tracking-tight" style={HEAD}>Your whole counter, on one screen.</h2>
          <p className="mt-3 text-gray-600 text-lg">
            Photo menu on the left, the current order on the right. Built so a busy cashier can take an order in seconds.
          </p>
        </div>

        <div className="mt-10 rounded-2xl border border-gray-200 bg-gray-50 shadow-[0_30px_80px_-30px_rgba(15,23,42,0.35)] overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-200 bg-white">
            <span className="w-3 h-3 rounded-full bg-red-400" />
            <span className="w-3 h-3 rounded-full bg-amber-400" />
            <span className="w-3 h-3 rounded-full bg-green-400" />
            <div className="ml-3 flex-1 max-w-md rounded-md bg-gray-100 text-xs text-gray-500 px-3 py-1.5 truncate">
              dinora.in/your-restaurant/counter
            </div>
          </div>
          <img
            src="/landing/counter-order.webp"
            alt="Dinora Counter Order screen: photo menu, categories, search and the current order"
            width="2000"
            height="1098"
            loading="lazy"
            className="w-full block"
          />
        </div>

        <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {points.map((p) => (
            <div key={p.t} className="flex gap-3">
              <span className="mt-0.5 w-5 h-5 rounded-full bg-blue-600 shrink-0 flex items-center justify-center">
                <Check className="w-3 h-3 text-white" strokeWidth={3} />
              </span>
              <div>
                <div className="font-bold text-sm">{p.t}</div>
                <p className="mt-1 text-sm text-gray-600 leading-relaxed">{p.d}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────── small pieces ───────────────────────────
function Logo({ size = "text-3xl" }) {
  return (
    <span className={`${size} font-extrabold tracking-tight`} style={HEAD}>
      <span className="text-[#171717]">Din</span>
      <span className="text-[#E34F36]">ora</span>
    </span>
  );
}

function Veg({ veg = true }) {
  const c = veg ? "border-green-600 text-green-600" : "border-red-600 text-red-600";
  return (
    <span className={`inline-flex items-center justify-center w-3.5 h-3.5 border-[1.5px] rounded-[3px] ${c}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
    </span>
  );
}

// A phone showing the guest menu + a bill card, built from plain markup.
// Photos live in client/public/landing/ ; if one is missing the soft gradient shows instead.
function HeroVisual() {
  const items = [
    { n: "Paneer Tikka", p: 240, veg: true, q: 2, img: "/landing/paneer-tikka.jpeg" },
    { n: "Butter Chicken", p: 380, veg: false, q: 0, img: "/landing/butter-chicken.jpg" },
    { n: "Garlic Naan", p: 60, veg: true, q: 1, img: "/landing/garlic-naan.webp" },
  ];
  return (
    <div className="relative mx-auto w-full max-w-md h-115 sm:h-130">
      <div className="absolute inset-x-8 top-10 bottom-0 rounded-[3rem] bg-blue-600/10 blur-3xl" />

      {/* phone */}
      <div className="absolute left-2 sm:left-6 top-0 w-60 sm:w-64 rounded-[2.2rem] border-[7px] border-[#171717] bg-white shadow-2xl overflow-hidden">
        <div className="h-5 bg-[#171717] flex justify-center">
          <div className="w-16 h-3 rounded-b-xl bg-[#171717]" />
        </div>
        <div className="px-4 pt-3 pb-4">
          <div className="text-[10px] text-gray-400 font-medium">Table 5</div>
          <div className="text-base font-extrabold text-gray-900" style={HEAD}>Your Restaurant</div>
          <div className="mt-3 flex gap-1.5">
            {["All", "Starters", "Mains"].map((c, i) => (
              <span key={c} className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ${i === 0 ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600"}`}>
                {c}
              </span>
            ))}
          </div>
          <div className="mt-3 space-y-2.5">
            {items.map((it) => (
              <div key={it.n} className="flex items-center gap-2.5 rounded-xl border border-gray-100 p-2">
                <div className="relative w-11 h-11 rounded-lg overflow-hidden bg-linear-to-br from-orange-100 to-amber-200 shrink-0">
                  <img
                    src={it.img}
                    alt={it.n}
                    loading="lazy"
                    className="absolute inset-0 w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <Veg veg={it.veg} />
                    <span className="text-[11px] font-semibold text-gray-900 truncate">{it.n}</span>
                  </div>
                  <div className="text-[11px] text-gray-500">₹{it.p}</div>
                </div>
                {it.q ? (
                  <span className="text-[10px] font-bold text-white bg-blue-600 rounded-md px-2 py-1">- {it.q} +</span>
                ) : (
                  <span className="text-[10px] font-bold text-blue-600 border border-blue-600 rounded-md px-2 py-1">ADD</span>
                )}
              </div>
            ))}
          </div>
          <div className="mt-3 rounded-xl bg-blue-600 text-white text-[11px] font-semibold px-3 py-2.5 flex justify-between">
            <span>3 items · ₹540</span>
            <span>View cart</span>
          </div>
        </div>
      </div>

      {/* bill */}
      <div className="absolute right-0 sm:right-2 bottom-4 w-52 -rotate-3 rounded-xl bg-white border border-gray-200 shadow-2xl p-4 font-mono text-[10px] text-gray-700">
        <div className="text-center font-bold text-xs text-gray-900">YOUR RESTAURANT</div>
        <div className="text-center text-gray-400 mb-2">Bill</div>
        <div className="border-t border-dashed border-gray-300 my-2" />
        <div className="flex justify-between"><span>Order Point:</span><span className="font-bold">Counter</span></div>
        <div className="border-t border-dashed border-gray-300 my-2" />
        <div className="flex justify-between"><span>2 x Paneer Tikka</span><span>₹480</span></div>
        <div className="flex justify-between"><span>1 x Garlic Naan</span><span>₹60</span></div>
        <div className="border-t border-dashed border-gray-300 my-2" />
        <div className="flex justify-between font-bold text-gray-900 text-xs"><span>TOTAL</span><span>₹540</span></div>
        <div className="mt-3 text-center rounded-lg bg-[#171717] text-white font-sans font-semibold py-1.5">Print bill</div>
      </div>

      {/* floating chip */}
      <div className="absolute right-4 top-10 rounded-2xl bg-white shadow-xl border border-gray-100 px-3.5 py-2.5 flex items-center gap-2.5">
        <span className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
          <Zap className="w-4 h-4 text-green-600" />
        </span>
        <div>
          <div className="text-[11px] font-bold text-gray-900">New order</div>
          <div className="text-[10px] text-gray-500">Table 5 · ₹540</div>
        </div>
      </div>
    </div>
  );
}

function PricingCard({ plan, yearly, onStart }) {
  const name = PLAN_NAMES[plan.id];
  const price = yearly ? plan.yearly : plan.monthly;
  const per = yearly ? "year" : "month";
  const saved = plan.monthly * 12 - plan.yearly;
  const dark = plan.featured;

  const text = dark ? "text-white" : "text-gray-900";
  const sub = dark ? "text-blue-100/80" : "text-gray-600";
  const line = dark ? "border-white/25" : "border-gray-300";

  return (
    <div className="relative">
      {dark && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5 whitespace-nowrap rounded-full bg-[#E34F36] text-white text-xs font-bold px-4 py-2 shadow-lg">
          <Gift className="w-3.5 h-3.5" /> FREE for our first {FOUNDING_OFFER.spots} restaurants
        </div>
      )}
      <div
        className={`relative rounded-3xl p-8 h-full flex flex-col ${
          dark
            ? "bg-linear-to-b from-[#1e3a8a] to-[#0f172a] shadow-[0_30px_80px_-20px_rgba(37,99,235,0.55)]"
            : "bg-white border border-gray-200 shadow-sm"
        }`}
      >
        <div className={`text-sm font-bold tracking-wide ${dark ? "text-blue-200" : "text-blue-600"}`}>{name}</div>
        <p className={`mt-1 text-sm ${sub}`}>{plan.tagline}</p>

        <div className="mt-6">
          {dark ? (
            <>
              <div className="flex items-end gap-2">
                <span className="text-5xl font-extrabold text-white" style={HEAD}>Free</span>
                <span className="text-blue-100/80 text-sm mb-2">founding restaurants</span>
              </div>
              <div className="mt-1 text-sm text-blue-100/70">
                Regular price <span className="line-through">{fmt(price)}</span> / {per}
              </div>
            </>
          ) : (
            <>
              <div className="flex items-end gap-1.5">
                <span className="text-5xl font-extrabold text-gray-900" style={HEAD}>{fmt(price)}</span>
                <span className="text-gray-600 text-sm mb-2">/ {per}</span>
              </div>
              <div className={`mt-1 text-sm ${yearly ? "text-green-600 font-semibold" : "text-gray-400"}`}>
                {yearly ? `You save ${fmt(saved)} a year` : "Billed monthly"}
              </div>
            </>
          )}
        </div>

        {/* receipt perforation */}
        <div className={`relative my-7 border-t-2 border-dashed ${line}`}>
          <span className={`absolute -left-11 -top-3 w-6 h-6 rounded-full ${dark ? "bg-[#f6f8fc]" : "bg-[#f6f8fc] border-r border-gray-200"}`} />
          <span className={`absolute -right-11 -top-3 w-6 h-6 rounded-full ${dark ? "bg-[#f6f8fc]" : "bg-[#f6f8fc] border-l border-gray-200"}`} />
        </div>

        <ul className="space-y-3 flex-1">
          {plan.features.map((f) => (
            <li key={f} className={`flex gap-3 text-sm ${dark ? "text-blue-50" : "text-gray-700"}`}>
              <span className={`mt-0.5 w-5 h-5 rounded-full shrink-0 flex items-center justify-center ${dark ? "bg-white/15" : "bg-blue-50"}`}>
                <Check className={`w-3 h-3 ${dark ? "text-white" : "text-blue-600"}`} strokeWidth={3} />
              </span>
              {f}
            </li>
          ))}
        </ul>

        <button
          onClick={onStart}
          className={`mt-8 w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 cursor-pointer transition-all duration-150 active:scale-[0.98] ${
            dark ? "bg-white text-[#0f172a] hover:bg-blue-50" : "bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800"
          }`}
        >
          {dark ? `Book a demo to claim free ${name}` : "Start free trial"} <ArrowRight className="w-4 h-4" />
        </button>
        <div className={`mt-3 text-center text-xs ${text} opacity-60`}>
          {dark ? "Free Prime is unlocked after a demo call" : "No card needed to start"}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────── page ───────────────────────────
export default function LandingPage() {
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [demoOpen, setDemoOpen] = useState(false);
  const [yearly, setYearly] = useState(false);

  // Coming back from a policy page: jump straight to where you were. No scrolling
  // animation, and it happens before the first paint so you never see the top.
  useLayoutEffect(() => {
    const saved = sessionStorage.getItem("landing_scroll");
    if (saved !== null) {
      sessionStorage.removeItem("landing_scroll");
      window.scrollTo({ top: Number(saved), behavior: "instant" });
    }
  }, []);

  // open a policy page, remembering exactly where on the landing page we were
  const openPolicy = (to) => {
    sessionStorage.setItem("landing_scroll", String(window.scrollY));
    navigate(to);
  };

  const goTo = (id) => {
    setMobileOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };
  const openDemo = () => {
    setMobileOpen(false);
    setDemoOpen(true);
  };

  const NAV = [
    { id: "product", label: "Product" },
    { id: "ways", label: "How you sell" },
    { id: "features", label: "Features" },
    { id: "pricing", label: "Pricing" },
    { id: "faq", label: "FAQ" },
  ];

  return (
    <div className="bg-white text-gray-900" style={{ fontFamily: "'Inter', sans-serif" }}>
      <DemoModal open={demoOpen} onClose={() => setDemoOpen(false)} />

      {/* ───────── nav ───────── */}
      <header className="sticky top-0 z-50 bg-white/85 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
          <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="cursor-pointer">
            <Logo />
          </button>
          <nav className="hidden md:flex items-center gap-8">
            {NAV.map((n) => (
              <button key={n.id} onClick={() => goTo(n.id)} className="text-sm font-medium text-gray-600 hover:text-gray-900 cursor-pointer transition-colors">
                {n.label}
              </button>
            ))}
          </nav>
          <div className="hidden md:flex items-center gap-2">
            <button onClick={() => navigate("/login")} className="px-4 py-2 text-sm font-semibold text-gray-700 hover:text-gray-900 cursor-pointer">
              Log in
            </button>
            <button onClick={openDemo} className="px-4 py-2 text-sm font-semibold rounded-xl border border-gray-200 hover:bg-gray-50 active:bg-gray-100 cursor-pointer transition-all">
              Book a demo
            </button>
            <button onClick={() => navigate("/register")} className="px-4 py-2 text-sm font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white cursor-pointer transition-all">
              Get started
            </button>
          </div>
          <button onClick={() => setMobileOpen((o) => !o)} className="md:hidden p-2 cursor-pointer" aria-label="Menu">
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
        {mobileOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white px-5 py-4 space-y-1">
            {NAV.map((n) => (
              <button key={n.id} onClick={() => goTo(n.id)} className="block w-full text-left py-2.5 text-sm font-medium text-gray-700 cursor-pointer">
                {n.label}
              </button>
            ))}
            <div className="pt-3 grid gap-2">
              <button onClick={openDemo} className="py-3 rounded-xl border border-gray-200 text-sm font-semibold cursor-pointer">Book a demo</button>
              <button onClick={() => navigate("/register")} className="py-3 rounded-xl bg-blue-600 text-white text-sm font-semibold cursor-pointer">Get started</button>
              <button onClick={() => navigate("/login")} className="py-2 text-sm font-semibold text-gray-600 cursor-pointer">Log in</button>
            </div>
          </div>
        )}
      </header>

      {/* ───────── hero ───────── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-linear-to-b from-blue-50 via-white to-white" />
        <div className="max-w-6xl mx-auto px-5 pt-14 pb-20 lg:pt-20 grid lg:grid-cols-2 gap-14 items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-[#E34F36]/10 text-[#E34F36] text-xs font-bold px-3.5 py-2">
              <Gift className="w-3.5 h-3.5 shrink-0" />
              {FOUNDING_OFFER.label}: {PLAN_NAMES.pro} plan free for the first {FOUNDING_OFFER.spots} restaurants · book a demo to claim
            </div>
            <h1 className="mt-5 text-5xl sm:text-6xl font-extrabold tracking-tight leading-[1.02]" style={HEAD}>
              Every order,<br />from every door,<br />
              <span className="text-blue-600">in one place.</span>
            </h1>
            <p className="mt-6 text-lg text-gray-600 max-w-lg leading-relaxed">
              Dinora gives your restaurant table QR ordering, a counter screen with instant bills and a self-order
              kiosk, with live kitchen tracking and GST-ready billing. Your guests download nothing.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <button onClick={openDemo} className="px-7 py-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-sm flex items-center gap-2 cursor-pointer transition-all duration-150 active:scale-[0.98] shadow-lg shadow-blue-600/25">
                Book a demo to claim free {PLAN_NAMES.pro} <ArrowRight className="w-4 h-4" />
              </button>
              <button onClick={() => navigate("/register")} className="px-7 py-4 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 active:bg-gray-100 font-bold text-sm cursor-pointer transition-all duration-150 active:scale-[0.98]">
                Start free trial
              </button>
            </div>
            <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-600">
              {["Free trial, no card needed", "Set up in minutes", "Works on any phone or screen"].map((t) => (
                <span key={t} className="flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-green-600" strokeWidth={3} /> {t}
                </span>
              ))}
            </div>
          </div>
          <HeroVisual />
        </div>
      </section>

      {/* new for product showcase */}
            <ProductShowcase />



      {/* ───────── three ways ───────── */}
      <section id="ways" className="scroll-mt-16 py-20 bg-[#f6f8fc]">
        <div className="max-w-6xl mx-auto px-5">
          <div className="max-w-2xl">
            <h2 className="text-4xl font-extrabold tracking-tight" style={HEAD}>Three ways to take an order. One dashboard.</h2>
            <p className="mt-3 text-gray-600 text-lg">Whether a guest is seated, standing at the counter or walking in off the street, the order ends up in the same place.</p>
          </div>
          <div className="mt-10 grid md:grid-cols-3 gap-5">
            {WAYS.map((w, i) => {
              const Icon = w.icon;
              return (
                <div key={w.title} className="rounded-3xl bg-white border border-gray-200 p-7">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center">
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-5xl font-extrabold text-gray-100" style={HEAD}>0{i + 1}</span>
                  </div>
                  <h3 className="mt-5 text-xl font-bold flex items-center gap-2">
                    {w.title}
                    {w.pro && <span className="text-[10px] font-bold uppercase tracking-wide bg-blue-50 text-blue-600 rounded-full px-2 py-1">{PLAN_NAMES.pro}</span>}
                  </h3>
                  <p className="mt-2 text-gray-600 leading-relaxed">{w.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ───────── features ───────── */}
      <section id="features" className="scroll-mt-16 py-20">
        <div className="max-w-6xl mx-auto px-5">
          <div className="max-w-2xl">
            <h2 className="text-4xl font-extrabold tracking-tight" style={HEAD}>Built for how restaurants really run.</h2>
          </div>
          <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-9">
            {FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.title} className="flex gap-4">
                  <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-bold flex items-center gap-2">
                      {f.title}
                      {f.pro && <span className="text-[10px] font-bold uppercase tracking-wide bg-blue-50 text-blue-600 rounded-full px-2 py-0.5">{PLAN_NAMES.pro}</span>}
                    </h3>
                    <p className="mt-1 text-sm text-gray-600 leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ───────── how it works ───────── */}
      <section className="py-20 bg-[#171717] text-white">
        <div className="max-w-6xl mx-auto px-5">
          <h2 className="text-4xl font-extrabold tracking-tight max-w-xl" style={HEAD}>Live in an afternoon.</h2>
          <div className="mt-10 grid md:grid-cols-3 gap-8">
            {STEPS.map((s) => (
              <div key={s.n} className="border-t-2 border-white/20 pt-6">
                <div className="text-6xl font-extrabold text-blue-500" style={HEAD}>{s.n}</div>
                <h3 className="mt-3 text-xl font-bold">{s.title}</h3>
                <p className="mt-2 text-gray-400 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── pricing ───────── */}
      <section id="pricing" className="scroll-mt-16 py-24 bg-[#f6f8fc]">
        <div className="max-w-5xl mx-auto px-5">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-4xl font-extrabold tracking-tight" style={HEAD}>Simple pricing. No per-order fees.</h2>
            <p className="mt-3 text-gray-600 text-lg">Pay one flat price for your plan. Dinora never takes a cut of your sales.</p>
            <div className="mt-8 inline-flex rounded-full bg-white border border-gray-200 p-1">
              {[
                { v: false, l: "Monthly" },
                { v: true, l: "Yearly · save 2 months" },
              ].map((o) => (
                <button
                  key={o.l}
                  onClick={() => setYearly(o.v)}
                  className={`px-5 py-2 rounded-full text-sm font-semibold cursor-pointer transition-all duration-150 ${
                    yearly === o.v ? "bg-blue-600 text-white" : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  {o.l}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-14 grid md:grid-cols-2 gap-8 items-stretch">
            {PLANS.map((p) => (
              <PricingCard
                key={p.id}
                plan={p}
                yearly={yearly}
                onStart={p.featured ? openDemo : () => navigate("/register")}
              />
            ))}
          </div>

          <p className="mt-8 text-center text-sm text-gray-600">
            Not sure which plan fits?{" "}
            <button onClick={openDemo} className="font-semibold text-blue-600 hover:text-blue-700 cursor-pointer">
              Book a free demo
            </button>{" "}
            and we will walk you through it.
          </p>
        </div>
      </section>

      {/* ───────── faq ───────── */}
      <section id="faq" className="scroll-mt-16 py-20">
        <div className="max-w-3xl mx-auto px-5">
          <h2 className="text-4xl font-extrabold tracking-tight text-center" style={HEAD}>Questions, answered.</h2>
          <div className="mt-10 divide-y divide-gray-200 border-y border-gray-200">
            {FAQS.map((f) => (
              <details key={f.q} className="group py-5">
                <summary className="flex items-center justify-between gap-4 cursor-pointer list-none font-semibold">
                  {f.q}
                  <ChevronDown className="w-5 h-5 text-gray-400 shrink-0 transition-transform group-open:rotate-180" />
                </summary>
                <p className="mt-3 text-gray-600 leading-relaxed">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── final cta ───────── */}
      <section className="px-5 pb-20">
        <div className="max-w-6xl mx-auto rounded-4xl bg-linear-to-br from-blue-600 to-blue-800 px-8 py-14 sm:py-16 text-center text-white">
          <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight" style={HEAD}>Ready for your first QR order?</h2>
          <p className="mt-4 text-blue-100 text-lg max-w-xl mx-auto">
            Join the first {FOUNDING_OFFER.spots} restaurants. Book a demo to claim {PLAN_NAMES.pro} free.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <button onClick={openDemo} className="px-8 py-4 rounded-xl bg-white text-blue-700 font-bold text-sm hover:bg-blue-50 active:bg-blue-100 cursor-pointer transition-all duration-150 active:scale-[0.98]">
              Book a demo
            </button>
            <button onClick={() => navigate("/register")} className="px-8 py-4 rounded-xl border border-white/40 text-white font-bold text-sm hover:bg-white/10 active:bg-white/20 cursor-pointer transition-all duration-150 active:scale-[0.98]">
              Start free trial
            </button>
          </div>
        </div>
      </section>

      {/* ───────── footer ───────── */}
      <footer id="footer" className="border-t border-gray-200 bg-gray-50">
        <div className="max-w-6xl mx-auto px-5 py-12 grid gap-10 md:grid-cols-4">
          <div className="md:col-span-2">
            <Logo size="text-2xl" />
            <p className="mt-3 text-sm text-gray-600 max-w-xs">QR ordering, counter billing and self-order kiosks for restaurants and cafés.</p>
          </div>
          <div>
            <div className="text-sm font-bold mb-3">Company</div>
            <div className="space-y-2 text-sm text-gray-600">
              {[
                { l: "Privacy Policy", to: "/privacy-policy" },
                { l: "Terms & Conditions", to: "/terms-and-conditions" },
                { l: "Cancellation & Refund", to: "/refund-policy" },
                { l: "Contact Us", to: "/contact" },
              ].map((x) => (
                <button key={x.to} onClick={() => openPolicy(x.to)} className="block hover:text-blue-600 cursor-pointer">
                  {x.l}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="text-sm font-bold mb-3">Get in touch</div>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="text-gray-600">
                {/* <span className="text-gray-400 text-xs">Founder</span> */}
                {/* <br /> */}
                Ankit Saini
                <span className="text-gray-400 text-xs ml-1.5">IIT Bombay</span>
              </div>
              <a href={`mailto:${LEGAL.supportEmail}`} className="flex items-center gap-2 hover:text-blue-600 break-all">
                <Mail className="w-4 h-4 shrink-0" /> {LEGAL.supportEmail}
              </a>
              <a href={`tel:${LEGAL.supportPhone.replace(/\s/g, "")}`} className="flex items-center gap-2 hover:text-blue-600">
                <Phone className="w-4 h-4 shrink-0" /> {LEGAL.supportPhone}
              </a>
            </div>
          </div>
        </div>
        <div className="border-t border-gray-200 py-5 text-center text-xs text-gray-400">
          © {new Date().getFullYear()} {LEGAL.brand}. All rights reserved.
        </div>
      </footer>
    </div>
  );
}















































// import { useNavigate } from "react-router-dom";
// import { useEffect, useState } from "react";

// import {
//   QrCode,
//   UtensilsCrossed,
//   ClipboardList,
//   Receipt,
//   CreditCard,
//   BarChart3,
//   Menu,
//   X,
//   ChevronRight,
//   Mail,
//   Phone,
// } from "lucide-react";

// const FEATURES = [
//   {
//     icon: QrCode,
//     title: "QR Ordering",
//     desc: "Customers scan a table QR and order directly from their phone — no app to download.",
//   },
//   {
//     icon: UtensilsCrossed,
//     title: "Menu with Real Photos",
//     desc: "Organise dishes into categories, upload real photos, mark veg/non-veg and bestsellers.",
//   },
//   {
//     icon: ClipboardList,
//     title: "Live Order Tracking",
//     desc: "Orders flow through Pending → Accepted → Preparing → Ready → Served, visible to your kitchen in real time.",
//   },
//   {
//     icon: Receipt,
//     title: "Kitchen Slips with GST",
//     desc: "One-click printable bills with CGST/SGST breakdown, ready for your kitchen and your customer.",
//   },
//   {
//     icon: CreditCard,
//     title: "Cash & Online Payments",
//     desc: "Accept cash always. Link your own Razorpay account on Basic and Pro to accept UPI, cards, and netbanking.",
//   },
//   {
//     icon: BarChart3,
//     title: "Reviews & Analytics",
//     desc: "On Pro: customers rate dishes after their order is served, and you get a full revenue dashboard.",
//   },
// ];

// const PLANS = [
//   {
//     id: "basic",
//     name: "Basic",
//     monthlyPrice: 699,
//     yearlyPrice: 6999,
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
//       "Up to 15 tables",
//     ],
//   },
//   {
//     id: "pro",
//     name: "Pro",
//     monthlyPrice: 1299,
//     yearlyPrice: 12999,
//     badge: "Most Popular",
//     features: [
//       "Everything in Basic",
//       "Customer reviews and dish ratings",
//       "Top-rated dishes ranking",
//       "Revenue and order trend charts for 7/14/30 days or custom range",
//       "Payment method breakdown (cash vs online)",
//       "Overall rating summary with star distribution",
//       "Up to 30 tables",
//     ],
//   },
// ];

// const getYearlySavings = (plan) => {
//   const fullYearAtMonthlyRate = plan.monthlyPrice * 12;
//   const savings = fullYearAtMonthlyRate - plan.yearlyPrice;
//   const percentSaved = Math.round((savings / fullYearAtMonthlyRate) * 100);
//   return { savings, percentSaved };
// };

// const STATUSES = [
//   { label: "Pending", color: "#6b7280", bg: "#f3f4f6" },
//   { label: "Accepted", color: "#2563eb", bg: "#eff6ff" },
//   { label: "Preparing", color: "#d97706", bg: "#fffbeb" },
//   { label: "Ready", color: "#16a34a", bg: "#f0fdf4" },
//   { label: "Served", color: "#1e293b", bg: "#f1f5f9" },
// ];

// function LiveTicket() {
//   const [step, setStep] = useState(0);
//   useEffect(() => {
//     const id = setInterval(
//       () => setStep((s) => (s + 1) % STATUSES.length),
//       1800,
//     );
//     return () => clearInterval(id);
//   }, []);
//   const current = STATUSES[step];
//   return (
//     <div className="relative w-full max-w-72 mx-auto">
//       <div className="absolute -inset-4 rounded-3xl bg-blue-500/8 blur-2xl" />
//       <div className="relative rounded-xl bg-white shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)] border border-gray-200/60 px-6 pt-6 pb-8">
//         {/* Torn edge top */}
//         <div className="absolute top-0 left-0 right-0 h-3 overflow-hidden rounded-t-xl">
//           <div
//             className="w-full h-full"
//             style={{
//               background:
//                 "repeating-linear-gradient(90deg, transparent, transparent 6px, white 6px, white 12px)",
//               opacity: 0.5,
//             }}
//           />
//         </div>

//         <div className="flex items-center justify-between mb-4 pt-1">
//           <span className="font-mono text-[11px] tracking-widest uppercase text-gray-400">
//             Order Slip
//           </span>
//           <span className="font-mono text-[11px] tracking-widest text-gray-400">
//             Table 07
//           </span>
//         </div>

//         <div className="border-t border-dashed border-gray-200 pt-4 space-y-2.5 mb-5 font-mono text-[13px] text-gray-700">
//           <div className="flex justify-between">
//             <span>1× Paneer Tikka</span>
//             <span>₹280</span>
//           </div>
//           <div className="flex justify-between">
//             <span>2× Butter Naan</span>
//             <span>₹120</span>
//           </div>
//           <div className="flex justify-between">
//             <span>1× Masala Chai</span>
//             <span>₹60</span>
//           </div>
//         </div>

//         <div className="border-t border-dashed border-gray-200 pt-4 flex items-center justify-between">
//           <span className="font-mono text-[11px] uppercase tracking-widest text-gray-400">
//             Status
//           </span>
//           <span
//             key={step}
//             className="ticket-stamp inline-flex items-center gap-2 font-mono text-[12px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-md"
//             style={{
//               color: current.color,
//               background: current.bg,
//             }}
//           >
//             <span
//               className="w-1.5 h-1.5 rounded-full pulse-dot"
//               style={{ background: current.color }}
//             />
//             {current.label}
//           </span>
//         </div>
//       </div>
//     </div>
//   );
// }

// export default function LandingPage() {
//   const navigate = useNavigate();
//   const [billingCycle, setBillingCycle] = useState("monthly");
//   const [hoveredFeature, setHoveredFeature] = useState(null);
//   const [mobileNavOpen, setMobileNavOpen] = useState(false);

//   const scrollToSection = (id) => {
//     setMobileNavOpen(false);
//     const el = document.getElementById(id);
//     if (el) el.scrollIntoView({ behavior: "smooth" });
//   };

//   return (
//     <div className="min-h-screen bg-white font-body text-gray-800 overflow-x-hidden">
//       <style>{`
//         @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap');

//         .font-display { font-family: 'Inter', sans-serif; font-weight: 800; }
//         .font-body { font-family: 'Inter', sans-serif; }
//         .font-mono { font-family: 'JetBrains Mono', monospace; }

//         @keyframes stampIn {
//           0% { opacity: 0; transform: scale(1.4) rotate(-4deg); }
//           60% { opacity: 1; transform: scale(0.96) rotate(-4deg); }
//           100% { opacity: 1; transform: scale(1) rotate(-4deg); }
//         }
//         .ticket-stamp { animation: stampIn 0.35s ease-out; }

//         @keyframes pulseDot {
//           0%, 100% { opacity: 1; transform: scale(1); }
//           50% { opacity: 0.3; transform: scale(0.6); }
//         }
//         .pulse-dot { animation: pulseDot 1.4s ease-in-out infinite; }

//         @keyframes floatSlow {
//           0%, 100% { transform: translateY(0px); }
//           50% { transform: translateY(-8px); }
//         }
//         .float-slow { animation: floatSlow 5s ease-in-out infinite; }

//         @keyframes steam {
//           0% { opacity: 0; transform: translateY(0) scaleX(1); }
//           30% { opacity: 0.4; }
//           100% { opacity: 0; transform: translateY(-20px) scaleX(1.3); }
//         }
//         .steam-1 { animation: steam 3s ease-in infinite; }
//         .steam-2 { animation: steam 3s ease-in infinite 1s; }
//         .steam-3 { animation: steam 3s ease-in infinite 2s; }

//         @keyframes fadeUp {
//           from { opacity: 0; transform: translateY(20px); }
//           to { opacity: 1; transform: translateY(0); }
//         }
//         .fade-up { animation: fadeUp 0.7s ease-out both; }

//         @keyframes wobbleIn {
//           0% { opacity: 0; transform: scale(0.9) rotate(-2deg); }
//           100% { opacity: 1; transform: scale(1) rotate(0deg); }
//         }
//         .price-swap { animation: wobbleIn 0.35s ease-out; }

//         @keyframes slideDown {
//           from { opacity: 0; transform: translateY(-8px); }
//           to { opacity: 1; transform: translateY(0); }
//         }
//         .mobile-nav-in { animation: slideDown 0.25s ease-out; }

//         @media (prefers-reduced-motion: reduce) {
//           .float-slow, .steam-1, .steam-2, .steam-3, .pulse-dot,
//           .ticket-stamp, .fade-up, .price-swap, .mobile-nav-in {
//             animation: none !important;
//           }
//         }
//       `}</style>

//       {/* ───── Nav ───── */}
//       <nav className="sticky top-0 z-50 bg-white/85 backdrop-blur-lg border-b border-gray-200/60">
//         <div className="flex items-center justify-between px-4 sm:px-6 py-4 max-w-6xl mx-auto">
//           <div className="flex items-center gap-2">
//             <span className="font-display text-2xl sm:text-[1.7rem] text-gray-800">
//               Din<span className="text-accent">ora</span>
//             </span>
//           </div>

//           {/* Desktop links */}
//           <div className="hidden md:flex items-center gap-8">
//             {["features", "how-it-works", "pricing"].map((id) => (
//               <button
//                 key={id}
//                 onClick={() => scrollToSection(id)}
//                 className="text-gray-500 hover:text-[#2563eb] text-sm font-medium transition-colors capitalize"
//               >
//                 {id === "how-it-works"
//                   ? "How It Works"
//                   : id.charAt(0).toUpperCase() + id.slice(1)}
//               </button>
//             ))}
//           </div>

//           <div className="hidden sm:flex items-center gap-3">
//             <button
//               onClick={() => navigate("/login")}
//               className="px-5 py-2.5 rounded-full border border-gray-300 text-gray-700 text-sm font-semibold hover:border-gray-400 hover:bg-gray-50 transition-all"
//             >
//               Login
//             </button>
//             <button
//               onClick={() => navigate("/register")}
//               className="px-5 py-2.5 rounded-full bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-sm font-semibold transition-all shadow-[0_4px_14px_-4px_rgba(37,99,235,0.5)]"
//             >
//               Start Free Trial
//             </button>
//           </div>

//           {/* Mobile hamburger */}
//           <button
//             onClick={() => setMobileNavOpen((o) => !o)}
//             className="sm:hidden text-gray-700 p-1"
//             aria-label="Toggle menu"
//           >
//             {mobileNavOpen ? (
//               <X className="w-6 h-6" />
//             ) : (
//               <Menu className="w-6 h-6" />
//             )}
//           </button>
//         </div>

//         {/* Mobile panel */}
//         {mobileNavOpen && (
//           <div className="sm:hidden mobile-nav-in border-t border-gray-100 bg-white px-4 py-4 flex flex-col gap-1">
//             {["features", "how-it-works", "pricing"].map((id) => (
//               <button
//                 key={id}
//                 onClick={() => scrollToSection(id)}
//                 className="text-left text-gray-600 hover:text-[#2563eb] text-sm font-medium py-2.5 transition-colors"
//               >
//                 {id === "how-it-works"
//                   ? "How It Works"
//                   : id.charAt(0).toUpperCase() + id.slice(1)}
//               </button>
//             ))}
//             <div className="flex items-center gap-2 pt-3 mt-1 border-t border-gray-100">
//               <button
//                 onClick={() => navigate("/login")}
//                 className="flex-1 px-4 py-2.5 rounded-full border border-gray-300 text-gray-700 text-sm font-semibold transition-all"
//               >
//                 Login
//               </button>
//               <button
//                 onClick={() => navigate("/register")}
//                 className="flex-1 px-4 py-2.5 rounded-full bg-[#2563eb] text-white text-sm font-semibold transition-all"
//               >
//                 Start Free Trial
//               </button>
//             </div>
//           </div>
//         )}
//       </nav>

//       {/* ───── Hero ───── */}
//       <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-12 sm:pt-16 pb-16 sm:pb-24 grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-10 lg:gap-14 items-center">
//         <div className="fade-up">
//           <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200/70 rounded-full px-4 py-1.5 mb-6">
//             <span className="w-1.5 h-1.5 rounded-full bg-blue-500 pulse-dot" />
//             <span className="text-blue-700 text-[10px] sm:text-xs font-mono tracking-wide">
//               10-DAY FREE TRIAL · UP TO 10 TABLES · NO CARD REQUIRED
//             </span>
//           </div>

//           <p className="text-gray-400 text-xs font-mono tracking-wide mb-6">
//             BUILT BY AN IIT BOMBAY UNDERGRADUATE
//           </p>

//           <h1 className="font-display text-3xl sm:text-4xl md:text-[3.4rem] leading-[1.12] font-extrabold text-gray-900 mb-5 sm:mb-6">
//             Every table,
//             <br />
//             <span className="text-[#2563eb]">ordered, tracked,</span>
//             <br />
//             served on time.
//           </h1>

//           <p className="text-gray-500 text-base sm:text-lg mb-8 sm:mb-10 max-w-xl leading-relaxed">
//             Dinora turns any table into a digital counter — customers scan and
//             order, your kitchen sees it the second it's placed, and the bill
//             prints itself with GST done.
//           </p>

//           <div className="flex flex-col sm:flex-row sm:items-center gap-4">
//             <button
//               onClick={() => navigate("/register")}
//               className="group px-8 py-4 bg-[#2563eb] hover:bg-[#1d4ed8] text-white rounded-full font-bold text-base transition-all hover:-translate-y-0.5 shadow-[0_8px_24px_-8px_rgba(37,99,235,0.5)] w-full sm:w-auto inline-flex items-center justify-center gap-2"
//             >
//               Start Free Trial
//               <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
//             </button>
//             <button
//               onClick={() => navigate("/login")}
//               className="text-gray-500 hover:text-[#2563eb] text-sm font-semibold underline decoration-gray-300 underline-offset-4 transition-colors text-left"
//             >
//               Already have an account? Login
//             </button>
//           </div>
//         </div>

//         {/* Live kitchen ticket */}
//         <div className="relative float-slow">
//           <div className="absolute -top-6 right-8 text-2xl text-gray-300 steam-1">
//             〜
//           </div>
//           <div className="absolute -top-8 right-16 text-2xl text-gray-200 steam-2">
//             〜
//           </div>
//           <div className="absolute -top-6 right-24 text-2xl text-gray-200 steam-3">
//             〜
//           </div>
//           <LiveTicket />
//         </div>
//       </div>

//       {/* ───── Features ───── */}
//       <div
//         id="features"
//         className="bg-slate-50 border-y border-gray-200/60 scroll-mt-20"
//       >
//         <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
//           <h2 className="font-display text-2xl sm:text-3xl md:text-4xl text-center mb-3 text-gray-900">
//             Everything your restaurant needs
//           </h2>
//           <p className="text-gray-400 text-center mb-12 sm:mb-16 font-mono text-xs tracking-wide">
//             BUILT FOR HOW INDIAN RESTAURANTS ACTUALLY RUN
//           </p>

//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
//             {FEATURES.map((f, i) => {
//               const Icon = f.icon;
//               return (
//                 <div
//                   key={f.title}
//                   onMouseEnter={() => setHoveredFeature(i)}
//                   onMouseLeave={() => setHoveredFeature(null)}
//                   className={`rounded-2xl border p-5 sm:p-6 transition-all duration-300 cursor-default ${
//                     hoveredFeature === i
//                       ? "border-[#2563eb]/30 bg-blue-50/50 -translate-y-1 shadow-[0_12px_30px_-12px_rgba(37,99,235,0.15)]"
//                       : "border-gray-200/80 bg-white"
//                   }`}
//                 >
//                   <div
//                     className={`mb-4 transition-transform duration-300 ${
//                       hoveredFeature === i ? "scale-110" : ""
//                     }`}
//                   >
//                     <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center">
//                       <Icon className="w-6 h-6 text-[#2563eb]" strokeWidth={2} />
//                     </div>
//                   </div>
//                   <div className="font-display text-gray-900 text-lg mb-2">
//                     {f.title}
//                   </div>
//                   <div className="text-gray-500 text-sm leading-relaxed">
//                     {f.desc}
//                   </div>
//                 </div>
//               );
//             })}
//           </div>
//         </div>
//       </div>

//       {/* ───── How it works ───── */}
//       <div id="how-it-works" className="scroll-mt-20">
//         <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
//           <h2 className="font-display text-2xl sm:text-3xl md:text-4xl text-center mb-12 sm:mb-16 text-gray-900">
//             How it works
//           </h2>

//           <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
//             {[
//               {
//                 step: "01",
//                 title: "Sign up & set up",
//                 desc: "Create your account, add your restaurant name, address, and GST details.",
//               },
//               {
//                 step: "02",
//                 title: "Add menu & tables",
//                 desc: "Add categories, dishes with photos, and generate a QR code for every table.",
//               },
//               {
//                 step: "03",
//                 title: "Customers scan & order",
//                 desc: "They scan, browse, order, and pay — you manage everything from your dashboard.",
//               },
//             ].map((s, i) => (
//               <div
//                 key={s.step}
//                 className="relative rounded-2xl border border-dashed border-gray-300 p-5 sm:p-6 text-center bg-white"
//               >
//                 {i < 2 && (
//                   <div className="hidden md:block absolute top-1/2 -right-3 w-6 h-px bg-gray-300" />
//                 )}
//                 <div className="font-mono text-[#2563eb] text-sm mb-4 tracking-widest font-medium">
//                   {s.step}
//                 </div>
//                 <div className="font-display text-gray-900 text-lg mb-2">
//                   {s.title}
//                 </div>
//                 <div className="text-gray-500 text-sm leading-relaxed">
//                   {s.desc}
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>
//       </div>

//       {/* ───── Pricing ───── */}
//       <div
//         id="pricing"
//         className="bg-slate-50 border-y border-gray-200/60 scroll-mt-20"
//       >
//         <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
//           <h2 className="font-display text-2xl sm:text-3xl md:text-4xl text-center mb-3 text-gray-900">
//             Simple pricing
//           </h2>
//           <p className="text-gray-400 text-center mb-8 font-mono text-xs tracking-wide">
//             10-DAY FREE TRIAL · NO CARD REQUIRED
//           </p>

//           {/* Toggle */}
//           <div className="flex justify-center mb-10 sm:mb-12">
//             <div className="inline-flex items-center gap-1 bg-gray-100 border border-gray-200 rounded-full p-1">
//               <button
//                 onClick={() => setBillingCycle("monthly")}
//                 className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${
//                   billingCycle === "monthly"
//                     ? "bg-[#2563eb] text-white shadow-sm"
//                     : "text-gray-500 hover:text-gray-700"
//                 }`}
//               >
//                 Monthly
//               </button>
//               <button
//                 onClick={() => setBillingCycle("yearly")}
//                 className={`relative px-5 py-2 rounded-full text-sm font-semibold transition-all ${
//                   billingCycle === "yearly"
//                     ? "bg-[#2563eb] text-white shadow-sm"
//                     : "text-gray-500 hover:text-gray-700"
//                 }`}
//               >
//                 Yearly
//                 <span className="absolute -top-2.5 -right-2.5 bg-emerald-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
//                   SAVE
//                 </span>
//               </button>
//             </div>
//           </div>

//           <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
//             {PLANS.map((plan) => {
//               const price =
//                 billingCycle === "yearly" ? plan.yearlyPrice : plan.monthlyPrice;
//               const period = billingCycle === "yearly" ? "year" : "month";
//               const { savings, percentSaved } = getYearlySavings(plan);

//               return (
//                 <div
//                   key={plan.id}
//                   className={`rounded-2xl border p-6 sm:p-8 relative bg-white flex flex-col ${
//                     plan.badge
//                       ? "border-[#2563eb]/40 shadow-[0_4px_20px_-6px_rgba(37,99,235,0.12)]"
//                       : "border-gray-200"
//                   }`}
//                 >
//                   {plan.badge && (
//                     <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#2563eb] text-white text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap">
//                       {plan.badge}
//                     </div>
//                   )}

//                   <div className="font-display text-gray-900 text-xl mb-1">
//                     {plan.name}
//                   </div>

//                   <div key={billingCycle} className="price-swap">
//                     <div className="font-display text-gray-900 text-3xl sm:text-4xl mb-1">
//                       ₹{price.toLocaleString()}
//                       <span className="text-gray-400 text-sm sm:text-base font-body font-normal">
//                         /{period}
//                       </span>
//                     </div>
//                     {billingCycle === "yearly" && (
//                       <div className="text-emerald-600 text-xs font-semibold mb-4">
//                         You save ₹{savings.toLocaleString()} ({percentSaved}%) a
//                         year
//                       </div>
//                     )}
//                     {billingCycle === "monthly" && <div className="mb-4" />}
//                   </div>

//                   <div className="space-y-2.5 mb-8 flex-1">
//                     {plan.features.map((f) => (
//                       <div
//                         key={f}
//                         className="flex items-start gap-2 text-gray-600 text-sm"
//                       >
//                         <span className="text-[#2563eb] shrink-0 mt-0.5">
//                           ✓
//                         </span>
//                         {f}
//                       </div>
//                     ))}
//                   </div>

//                   <button
//                     onClick={() => navigate("/register")}
//                     className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all ${
//                       plan.badge
//                         ? "bg-[#2563eb] hover:bg-[#1d4ed8] text-white shadow-[0_4px_12px_-4px_rgba(37,99,235,0.4)]"
//                         : "bg-gray-800 hover:bg-gray-900 text-white"
//                     }`}
//                   >
//                     Get Started
//                   </button>
//                 </div>
//               );
//             })}
//           </div>

//           <p className="text-center text-gray-400 text-xs mt-8">
//             Register to start your free trial — no plan selection needed until
//             you're ready.
//           </p>
//         </div>
//       </div>

//       {/* ───── Footer ───── */}
//       <footer className="bg-gray-900 text-gray-300">
//         <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-14 pb-8">
//           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
//             {/* Brand */}
//             <div>
//               <span className="font-display text-xl text-white">
//                 Din<span className="text-[#60a5fa]">ora</span>
//               </span>
//               <p className="text-gray-400 text-sm mt-3 leading-relaxed max-w-xs">
//                 QR ordering and restaurant management, built for how Indian
//                 restaurants actually run.
//               </p>
//             </div>

//             {/* Product */}
//             <div>
//               <h4 className="text-white font-semibold text-sm mb-4 font-mono tracking-wide uppercase">
//                 Product
//               </h4>
//               <div className="space-y-2.5 text-sm">
//                 <button
//                   onClick={() => scrollToSection("features")}
//                   className="block text-gray-400 hover:text-[#60a5fa] transition-colors text-left"
//                 >
//                   Features
//                 </button>
//                 <button
//                   onClick={() => scrollToSection("pricing")}
//                   className="block text-gray-400 hover:text-[#60a5fa] transition-colors text-left"
//                 >
//                   Pricing
//                 </button>
//                 <button
//                   onClick={() => navigate("/login")}
//                   className="block text-gray-400 hover:text-[#60a5fa] transition-colors text-left"
//                 >
//                   Login
//                 </button>
//                 <button
//                   onClick={() => navigate("/register")}
//                   className="block text-gray-400 hover:text-[#60a5fa] transition-colors text-left"
//                 >
//                   Register
//                 </button>
//               </div>
//             </div>

//             {/* Legal */}
//             {/* <div>
//               <h4 className="text-white font-semibold text-sm mb-4 font-mono tracking-wide uppercase">
//                 Legal
//               </h4>
//               <div className="space-y-2.5 text-sm">
//                 <button
//                   onClick={() => navigate("/privacy-policy")}
//                   className="block text-gray-400 hover:text-[#60a5fa] transition-colors text-left"
//                 >
//                   Privacy Policy
//                 </button>
//                 <button
//                   onClick={() => navigate("/terms-and-conditions")}
//                   className="block text-gray-400 hover:text-[#60a5fa] transition-colors text-left"
//                 >
//                   Terms &amp; Conditions
//                 </button>
//                 <button
//                   onClick={() => navigate("/refund-policy")}
//                   className="block text-gray-400 hover:text-[#60a5fa] transition-colors text-left"
//                 >
//                   Cancellation &amp; Refund
//                 </button>
//                 <button
//                   onClick={() => navigate("/contact")}
//                   className="block text-gray-400 hover:text-[#60a5fa] transition-colors text-left"
//                 >
//                   Contact Us
//                 </button>
//               </div>
//             </div> */}






//             {/* Contact */}
//             <div>
//               <h4 className="text-white font-semibold text-sm mb-4 font-mono tracking-wide uppercase">
//                 Get in touch
//               </h4>
//               <div className="space-y-3 text-sm">
//                 <div className="text-gray-400">
//                   <span className="text-gray-500 text-xs">Founder</span>
//                   <br />
//                   Ankit Saini
//                   <span className="text-gray-500 text-xs ml-1.5">
//                     IIT Bombay
//                   </span>
//                 </div>
//                 <a
//                   href="mailto:ankittkarodiya@gmail.com"
//                   className="flex items-center gap-2 text-gray-400 hover:text-[#60a5fa] transition-colors"
//                 >
//                   <Mail className="w-3.5 h-3.5 shrink-0" />
//                   ankittkarodiya@gmail.com
//                 </a>
//                 <a
//                   href="tel:+918306762768"
//                   className="flex items-center gap-2 text-gray-400 hover:text-[#60a5fa] transition-colors"
//                 >
//                   <Phone className="w-3.5 h-3.5 shrink-0" />
//                   +91 8306762768
//                 </a>
//               </div>
//             </div>
//           </div>

//           {/* Bottom bar */}
//           <div className="border-t border-gray-700/50 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
//             <span className="text-gray-500 text-xs font-mono">
//               © {new Date().getFullYear()} DINORA. All rights reserved.
//             </span>
//             <span className="text-gray-500 text-xs font-mono">
//               Made in India 🇮🇳
//             </span>
//           </div>
//         </div>
//       </footer>
//     </div>
//   );
// }
