import { useNavigate } from "react-router-dom";

export default function UpgradeToProCard({ featureName = "This feature" }) {
  const navigate = useNavigate();
  return (
    <div className="rounded-2xl border border-purple-500/20 bg-purple-500/5 p-10 text-center">
      <div className="text-4xl mb-3">🔒</div>
      <div className="text-white font-bold text-lg mb-2">Pro Feature</div>
      <p className="text-slate-400 text-sm mb-6 max-w-sm mx-auto">
        {featureName} is available on the Pro plan. Upgrade to unlock it.
      </p>
      <button
        onClick={() => navigate("/restaurant/settings")}
        className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold text-sm transition-all hover:-translate-y-0.5"
      >
        Upgrade to Pro →
      </button>
    </div>
  );
}