import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { LEGAL } from "../../config/legal";

import { useLayoutEffect } from "react";


const LINKS = [
  { to: "/privacy-policy", label: "Privacy Policy" },
  { to: "/terms-and-conditions", label: "Terms & Conditions" },
  { to: "/refund-policy", label: "Cancellation & Refund" },
  { to: "/contact", label: "Contact Us" },
];

export function Section({ title, children }) {

    useLayoutEffect(() => {
        window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    }, []);

  return (
    <section className="mt-9">
      <h2 className="text-xl font-bold text-gray-900 mb-3">{title}</h2>
      <div className="space-y-3 text-gray-600 leading-relaxed">{children}</div>
    </section>
  );
}

export function UL({ items }) {
  return (
    <ul className="list-disc pl-6 space-y-1.5">
      {items.map((t) => (
        <li key={t}>{t}</li>
      ))}
    </ul>
  );
}

export default function LegalLayout({ title, intro, children, showDate = true }) {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "'Inter', sans-serif" }}>
      <header className="border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-5 h-16 flex items-center justify-between">
          <button
            onClick={() => navigate("/")}
            className="text-2xl font-extrabold tracking-tight cursor-pointer"
            style={{ fontFamily: "'Outfit', sans-serif" }}
          >
            <span className="text-[#171717]">Din</span>
            <span className="text-[#E34F36]">ora</span>
          </button>
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Back to home
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-5 py-12">
        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight" style={{ fontFamily: "'Outfit', sans-serif" }}>
          {title}
        </h1>
        {showDate && <p className="text-sm text-gray-400 mt-2">Last updated: {LEGAL.lastUpdated}</p>}
        {intro && <p className="mt-6 text-gray-600 leading-relaxed">{intro}</p>}
        {children}
      </main>

      <footer className="border-t border-gray-200 bg-gray-50">
        <div className="max-w-3xl mx-auto px-5 py-8 flex flex-wrap gap-x-6 gap-y-2 text-sm">
          {LINKS.map((l) => (
            <Link key={l.to} to={l.to} className="text-gray-600 hover:text-blue-600">
              {l.label}
            </Link>
          ))}
          <span className="text-gray-400 sm:ml-auto">© {new Date().getFullYear()} {LEGAL.brand}</span>
        </div>
      </footer>
    </div>
  );
}