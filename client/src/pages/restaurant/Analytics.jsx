// with lucid icons and with one loading
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getAnalyticsApi } from "../../api/analyticsApi";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { TrendingUp, ClipboardList, ChartColumnIncreasing, Calculator, Loader2, ChartColumn, RefreshCw } from "lucide-react"; // ← new icon imports

import { useSubscription } from "../../hooks/useSubscription";
import UpgradeToProCard from "../../components/restaurant/UpgradeToProCard";


const PERIOD_OPTIONS = [
  { value: 7, label: "Last 7 Days" },
  { value: 14, label: "Last 14 Days" },
  { value: 30, label: "Last 30 Days" },
  { value: 90, label: "Last 3 Months" },
  { value: 0, label: "Custom Range" },
];

const PIE_COLORS = ["#3B82F6", "#10B981", "#F59E0B"];

// function StatCard({ label, value, sub, color = "blue", icon }) {
//   const colors = {
//     blue:   "from-blue-600/20 to-blue-600/5 border-blue-500/20",
//     green:  "from-green-600/20 to-green-600/5 border-green-500/20",
//     amber:  "from-amber-600/20 to-amber-600/5 border-amber-500/20",
//     purple: "from-purple-600/20 to-purple-600/5 border-purple-500/20",
//   };

//   return (
//     <div className={`rounded-2xl border bg-linear-to-br ${colors[color]} p-5`}>
//       <div className="text-2xl mb-2">{icon}</div>
//       <div className="text-white font-bold text-2xl">{value}</div>
//       <div className="text-slate-300 text-sm mt-0.5">{label}</div>
//       {sub && <div className="text-slate-500 text-xs mt-1">{sub}</div>}
//     </div>
//   );
// }

// new
// function StatCard({ label, value, sub, color = "blue", icon }) {
//   const badgeColors = {
//     blue:   "bg-blue-500/10 text-blue-400",
//     green:  "bg-emerald-500/10 text-emerald-400",
//     amber:  "bg-amber-500/10 text-amber-400",
//     purple: "bg-purple-500/10 text-purple-400",
//   };
//   return (
//     <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
//       <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${badgeColors[color]}`}>
//         {icon}
//       </div>
//       <div className="text-white font-bold text-2xl">{value}</div>
//       <div className="text-slate-300 text-sm mt-0.5">{label}</div>
//       {sub && <div className="text-slate-500 text-xs mt-1">{sub}</div>}
//     </div>
//   );
// }

// new new
function StatCard({ label, value, sub, color = "blue", icon }) {
  const themes = {
    blue:   { bg: "from-indigo-500/20 via-indigo-500/5 to-transparent border-indigo-400/25", badge: "bg-indigo-500 text-white" },
    green:  { bg: "from-emerald-500/20 via-teal-500/5 to-transparent border-emerald-400/25", badge: "bg-emerald-500 text-white" },
    amber:  { bg: "from-amber-500/20 via-orange-500/5 to-transparent border-amber-400/25", badge: "bg-amber-500 text-white" },
    purple: { bg: "from-violet-500/20 via-purple-500/5 to-transparent border-violet-400/25", badge: "bg-violet-500 text-white" },
  };
  const theme = themes[color];
  return (
    <div className={`rounded-2xl border bg-linear-to-br ${theme.bg} p-5`}>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 shadow-lg ${theme.badge}`}>
        {icon}
      </div>
      <div className="text-white font-bold text-2xl">{value}</div>
      <div className="text-slate-300 text-sm mt-0.5">{label}</div>
      {sub && <div className="text-slate-500 text-xs mt-1">{sub}</div>}
    </div>
  );
}




const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-800 border border-white/20 rounded-xl px-3 py-2 shadow-xl">
      <div className="text-slate-300 text-xs mb-1">{label}</div>
      {payload.map((p, i) => (
        <div key={i} className="text-white font-bold text-sm">
          {p.name === "revenue" ? `₹${p.value.toLocaleString()}` : `${p.value} orders`}
        </div>
      ))}
    </div>
  );
};

export default function Analytics() {
  const [period, setPeriod] = useState(7);
  const [useCustom, setUseCustom] = useState(false);
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  const { isPro, loading: subLoading } = useSubscription();

  const { data, isLoading: loading, refetch } = useQuery({
    queryKey: ["analytics", period, useCustom, isPro],
    queryFn: () =>
      getAnalyticsApi(
        useCustom ? 0 : period,
        useCustom ? customFrom : null,
        useCustom ? customTo : null
      ),
    enabled: isPro && !subLoading,
  });

  const handlePeriodChange = (e) => {
    const val = Number(e.target.value);
    if (val === 0) {
      setUseCustom(true);
    } else {
      setUseCustom(false);
      setPeriod(val);
    }
  };

  const handleCustomApply = () => {
    if (!customFrom || !customTo) return;
    refetch();
  };

  const paymentData = data ? [
    { name: "Online", value: data.paymentSplit.online },
    { name: "Cash", value: data.paymentSplit.cash },
    { name: "Unpaid", value: data.paymentSplit.unpaid },
  ].filter((d) => d.value > 0) : [];


  // ← combined into ONE loading check, so only a single loading screen ever
  // shows, regardless of plan — previously subLoading and the analytics
  // query rendered two separate, sequential loading screens for Pro users
  if (subLoading || (isPro && loading)) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          {/* <div className="text-4xl mb-4 animate-pulse">📊</div> */}
          <div className="flex flex-col items-center gap-3">
          {/* <ChartColumn className="w-12 h-12 text-white" /> */}
          <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
          </div>
          <div className="text-slate-400 text-sm">Loading analytics...</div>
        </div>
      </div>
    );
  }

  if (!isPro) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-white font-bold text-2xl">Analytics</h2>
          <p className="text-slate-400 text-sm mt-1">Revenue and order insights</p>
        </div>
        <UpgradeToProCard featureName="Analytics dashboard" />
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-white font-bold text-2xl">Analytics</h2>
          <p className="text-slate-400 text-sm mt-1">Revenue and order insights</p>
        </div>

        {/* Period dropdown */}
        <div className="flex items-center gap-3">
          <select
            value={useCustom ? 0 : period}
            onChange={handlePeriodChange}
            className="rounded-xl border border-white/20 bg-slate-800 text-white px-4 py-2 text-sm outline-none focus:border-blue-500"
          >
            {PERIOD_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          {/* <button onClick={() => refetch()}
            // className="px-4 py-2 rounded-xl border border-white/20 bg-white/10 hover:bg-white/20 text-slate-300 text-sm font-semibold"
            className="px-4 py-2 rounded-xl border border-white/20 bg-white/10 hover:bg-white/20 active:bg-white/30 active:scale-95 text-slate-300 text-sm font-semibold transition-all"
            >
            🔄 Refresh
          </button> */}

            {/* new */}
            <button
  onClick={() => refetch()}
  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl
             border border-white/20 bg-white/10
             hover:bg-white/20
             active:bg-white/30 active:scale-95
             transition-all duration-150 ease-out
             text-slate-300 text-sm font-semibold cursor-pointer"
>
  <RefreshCw size={15} strokeWidth={2.5} />
  Refresh
</button>



        </div>
      </div>

      {/* Custom date range */}
      {useCustom && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="text-white font-semibold text-sm mb-3">Custom Date Range</div>
          <div className="flex gap-3 flex-wrap items-end">
            <div>
              <label className="block text-slate-400 text-xs mb-1">From</label>
              <input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)}
                className="rounded-xl border border-white/20 bg-slate-800 px-3 py-2 text-white text-sm outline-none" />
            </div>
            <div>
              <label className="block text-slate-400 text-xs mb-1">To</label>
              <input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)}
                className="rounded-xl border border-white/20 bg-slate-800 px-3 py-2 text-white text-sm outline-none" />
            </div>
            <button onClick={handleCustomApply} disabled={!customFrom || !customTo}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold disabled:opacity-50">
              Apply →
            </button>
          </div>
        </div>
      )}

      {!data ? (
        <div className="text-center py-20 text-slate-400">No data available</div>
      ) : (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard
              // icon={<TrendingUp className="w-6 h-6 text-emerald-400" 
              icon={<TrendingUp className="w-6 h-6 text-white" 
              />}
              label="Revenue"
              value={`₹${Number(data.totalRevenue).toLocaleString()}`}
              sub="Paid orders only"
              color="green"
            />
            <StatCard
              // icon={<ClipboardList className="w-6 h-6 text-blue-400" />}
              icon={<ClipboardList className="w-6 h-6 text-white" />}
              label="Orders"
              value={data.totalOrders}
              sub="Excl. cancelled"
              color="blue"
            />
            <StatCard
              // icon={<ChartColumnIncreasing className="w-6 h-6 text-amber-400" />}
              // icon={<Calculator className="w-6 h-6 text-amber-400" />}
              icon={<Calculator className="w-6 h-6 text-white" />}
              label="Avg Order"
              value={`₹${data.avgOrderValue}`}
              color="amber"
            />
            <StatCard
              icon={
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  // className="w-6 h-6 shrink-0 text-purple-400"
                  className="w-6 h-6 shrink-0 text-white"
                >
                  <rect x="2" y="5" width="20" height="14" rx="2" />
                  <path d="M2 10h20" />
                </svg>
              }
              label="Online Paid"
              value={data.paymentSplit.online}
              sub={`${data.paymentSplit.cash} cash`}
              color="purple"
            />
          </div>

          {/* Revenue chart */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="text-white font-bold text-base mb-5">Daily Revenue</div>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={data.dailyRevenue}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" tick={{ fill: "#94A3B8", fontSize: 11 }} axisLine={false} />
                <YAxis tick={{ fill: "#94A3B8", fontSize: 11 }} axisLine={false}
                  tickFormatter={(v) => `₹${v >= 1000 ? `${(v/1000).toFixed(1)}k` : v}`} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="revenue" stroke="#3B82F6" strokeWidth={2.5}
                  dot={{ fill: "#3B82F6", r: 3 }} activeDot={{ r: 5 }} name="revenue" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Orders per day */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="text-white font-bold text-base mb-5">Orders Per Day</div>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={data.dailyRevenue}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" tick={{ fill: "#94A3B8", fontSize: 11 }} axisLine={false} />
                <YAxis tick={{ fill: "#94A3B8", fontSize: 11 }} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="orders" fill="#8B5CF6" radius={[4,4,0,0]} name="orders" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Bottom row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

            {/* Top items */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="text-white font-bold text-base mb-4">🏆 Most Ordered</div>
              {data.topItems.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-sm">No orders yet</div>
              ) : (
                <div className="space-y-3">
                  {data.topItems.map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0
                        ${i===0?"bg-amber-500 text-black":i===1?"bg-slate-400 text-black":i===2?"bg-amber-700 text-white":"bg-white/10 text-slate-400"}`}>
                        {i+1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-white text-sm font-semibold truncate">{item.name}</div>
                        <div className="flex gap-2">
                          <span className="text-slate-400 text-xs">{item.count} orders</span>
                          <span className="text-green-400 text-xs">₹{item.revenue.toLocaleString()}</span>
                        </div>
                      </div>
                      <div className="w-16 bg-white/10 rounded-full h-1.5 overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full"
                          style={{ width: `${(item.count/data.topItems[0].count)*100}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Payment split */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="text-white font-bold text-base mb-4">Payment Methods</div>
              {paymentData.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-sm">No payments yet</div>
              ) : (
                <div className="flex items-center gap-6">
                  <ResponsiveContainer width={100} height={100}>
                    <PieChart>
                      <Pie data={paymentData} dataKey="value" cx="50%" cy="50%" innerRadius={25} outerRadius={45}>
                        {paymentData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-3">
                    {paymentData.map((item, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ background: PIE_COLORS[i] }} />
                        <span className="text-slate-300 text-sm">{item.name}</span>
                        <span className="text-white font-bold text-sm">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}









































// without lucid icons and with two loadings
// import { useState } from "react";
// import { useQuery } from "@tanstack/react-query";
// import { getAnalyticsApi } from "../../api/analyticsApi";
// import {
//   LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
//   XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
// } from "recharts";

// import { useSubscription } from "../../hooks/useSubscription";
// import UpgradeToProCard from "../../components/restaurant/UpgradeToProCard";


// const PERIOD_OPTIONS = [
//   { value: 7, label: "Last 7 Days" },
//   { value: 14, label: "Last 14 Days" },
//   { value: 30, label: "Last 30 Days" },
//   { value: 90, label: "Last 3 Months" },
//   { value: 0, label: "Custom Range" },
// ];

// const PIE_COLORS = ["#3B82F6", "#10B981", "#F59E0B"];

// function StatCard({ label, value, sub, color = "blue", icon }) {
//   const colors = {
//     blue:   "from-blue-600/20 to-blue-600/5 border-blue-500/20",
//     green:  "from-green-600/20 to-green-600/5 border-green-500/20",
//     amber:  "from-amber-600/20 to-amber-600/5 border-amber-500/20",
//     purple: "from-purple-600/20 to-purple-600/5 border-purple-500/20",
//   };
//   return (
//     <div className={`rounded-2xl border bg-linear-to-br ${colors[color]} p-5`}>
//       <div className="text-2xl mb-2">{icon}</div>
//       <div className="text-white font-bold text-2xl">{value}</div>
//       <div className="text-slate-300 text-sm mt-0.5">{label}</div>
//       {sub && <div className="text-slate-500 text-xs mt-1">{sub}</div>}
//     </div>
//   );
// }

// const CustomTooltip = ({ active, payload, label }) => {
//   if (!active || !payload?.length) return null;
//   return (
//     <div className="bg-slate-800 border border-white/20 rounded-xl px-3 py-2 shadow-xl">
//       <div className="text-slate-300 text-xs mb-1">{label}</div>
//       {payload.map((p, i) => (
//         <div key={i} className="text-white font-bold text-sm">
//           {p.name === "revenue" ? `₹${p.value.toLocaleString()}` : `${p.value} orders`}
//         </div>
//       ))}
//     </div>
//   );
// };

// export default function Analytics() {
//   const [period, setPeriod] = useState(7);
//   const [useCustom, setUseCustom] = useState(false);
//   const [customFrom, setCustomFrom] = useState("");
//   const [customTo, setCustomTo] = useState("");

//   const { isPro, loading: subLoading } = useSubscription();

//   // ← THE CHANGE: replaces the `data` useState, `loading` useState,
//   // lastFetchKeyRef, its useEffect, and the fetchData function with one
//   // useQuery. The query key includes period/useCustom (so switching those
//   // auto-refetches, exactly like the old effect did) but deliberately
//   // does NOT include customFrom/customTo — typing dates should never
//   // auto-fetch, only clicking "Apply" or "Refresh" should, matching the
//   // original behavior exactly. Those two buttons now call refetch(),
//   // which always uses the freshest customFrom/customTo from this render.
//   const { data, isLoading: loading, refetch } = useQuery({
//     queryKey: ["analytics", period, useCustom, isPro],
//     queryFn: () =>
//       getAnalyticsApi(
//         useCustom ? 0 : period,
//         useCustom ? customFrom : null,
//         useCustom ? customTo : null
//       ),
//     enabled: isPro && !subLoading,
//   });

//   const handlePeriodChange = (e) => {
//     const val = Number(e.target.value);
//     if (val === 0) {
//       setUseCustom(true);
//     } else {
//       setUseCustom(false);
//       setPeriod(val);
//     }
//   };

//   const handleCustomApply = () => {
//     if (!customFrom || !customTo) return;
//     refetch();
//   };

//   const paymentData = data ? [
//     { name: "Online", value: data.paymentSplit.online },
//     { name: "Cash", value: data.paymentSplit.cash },
//     { name: "Unpaid", value: data.paymentSplit.unpaid },
//   ].filter((d) => d.value > 0) : [];


//   // Then right before your existing return (...) with the charts, add:
//   if (subLoading) {
//   return (
//     <div className="flex items-center justify-center h-64">
//       <div className="text-slate-400 text-sm animate-pulse">Loading...</div>
//     </div>
//   );
// }

// if (!isPro) {
//   return (
//     <div className="space-y-6">
//       <div>
//         <h2 className="text-white font-bold text-2xl">Analytics</h2>
//         <p className="text-slate-400 text-sm mt-1">Revenue and order insights</p>
//       </div>
//       <UpgradeToProCard featureName="Analytics dashboard" />
//     </div>
//   );
// }

//   return (
//     <div className="space-y-6">

//       {/* Header */}
//       <div className="flex items-center justify-between flex-wrap gap-3">
//         <div>
//           <h2 className="text-white font-bold text-2xl">Analytics</h2>
//           <p className="text-slate-400 text-sm mt-1">Revenue and order insights</p>
//         </div>

//         {/* Period dropdown */}
//         <div className="flex items-center gap-3">
//           <select
//             value={useCustom ? 0 : period}
//             onChange={handlePeriodChange}
//             className="rounded-xl border border-white/20 bg-slate-800 text-white px-4 py-2 text-sm outline-none focus:border-blue-500"
//           >
//             {PERIOD_OPTIONS.map((opt) => (
//               <option key={opt.value} value={opt.value}>{opt.label}</option>
//             ))}
//           </select>
//           <button onClick={() => refetch()}
//             className="px-4 py-2 rounded-xl border border-white/20 bg-white/10 hover:bg-white/20 text-slate-300 text-sm font-semibold">
//             🔄 Refresh
//           </button>
//         </div>
//       </div>

//       {/* Custom date range */}
//       {useCustom && (
//         <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
//           <div className="text-white font-semibold text-sm mb-3">Custom Date Range</div>
//           <div className="flex gap-3 flex-wrap items-end">
//             <div>
//               <label className="block text-slate-400 text-xs mb-1">From</label>
//               <input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)}
//                 className="rounded-xl border border-white/20 bg-slate-800 px-3 py-2 text-white text-sm outline-none" />
//             </div>
//             <div>
//               <label className="block text-slate-400 text-xs mb-1">To</label>
//               <input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)}
//                 className="rounded-xl border border-white/20 bg-slate-800 px-3 py-2 text-white text-sm outline-none" />
//             </div>
//             <button onClick={handleCustomApply} disabled={!customFrom || !customTo}
//               className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold disabled:opacity-50">
//               Apply →
//             </button>
//           </div>
//         </div>
//       )}

//       {loading ? (
//         <div className="flex items-center justify-center h-48">
//           <div className="text-center">
//             <div className="text-4xl mb-4 animate-pulse">📊</div>
//             <div className="text-slate-400 text-sm">Loading analytics...</div>
//           </div>
//         </div>
//       ) : !data ? (
//         <div className="text-center py-20 text-slate-400">No data available</div>
//       ) : (
//         <>
//           {/* Stat cards */}
//           <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
//             <StatCard icon="💰" label="Revenue" value={`₹${Number(data.totalRevenue).toLocaleString()}`} sub="Paid orders only" color="green" />
//             {/* <StatCard icon="📋" label="Orders" value={data.totalOrders} sub="Excl. cancelled" color="blue" /> */}
//             <StatCard icon="📋" label="Orders" value={data.totalOrders} sub="Excl. cancelled" color="blue" />
            
//             <StatCard icon="📊" label="Avg Order" value={`₹${data.avgOrderValue}`} color="amber" />
//             <StatCard icon="💳" label="Online Paid" value={data.paymentSplit.online} sub={`${data.paymentSplit.cash} cash`} color="purple" />
//           </div>

//           {/* Revenue chart */}
//           <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
//             <div className="text-white font-bold text-base mb-5">Daily Revenue</div>
//             <ResponsiveContainer width="100%" height={220}>
//               <LineChart data={data.dailyRevenue}>
//                 <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
//                 <XAxis dataKey="date" tick={{ fill: "#94A3B8", fontSize: 11 }} axisLine={false} />
//                 <YAxis tick={{ fill: "#94A3B8", fontSize: 11 }} axisLine={false}
//                   tickFormatter={(v) => `₹${v >= 1000 ? `${(v/1000).toFixed(1)}k` : v}`} />
//                 <Tooltip content={<CustomTooltip />} />
//                 <Line type="monotone" dataKey="revenue" stroke="#3B82F6" strokeWidth={2.5}
//                   dot={{ fill: "#3B82F6", r: 3 }} activeDot={{ r: 5 }} name="revenue" />
//               </LineChart>
//             </ResponsiveContainer>
//           </div>

//           {/* Orders per day */}
//           <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
//             <div className="text-white font-bold text-base mb-5">Orders Per Day</div>
//             <ResponsiveContainer width="100%" height={180}>
//               <BarChart data={data.dailyRevenue}>
//                 <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
//                 <XAxis dataKey="date" tick={{ fill: "#94A3B8", fontSize: 11 }} axisLine={false} />
//                 <YAxis tick={{ fill: "#94A3B8", fontSize: 11 }} axisLine={false} />
//                 <Tooltip content={<CustomTooltip />} />
//                 <Bar dataKey="orders" fill="#8B5CF6" radius={[4,4,0,0]} name="orders" />
//               </BarChart>
//             </ResponsiveContainer>
//           </div>

//           {/* Bottom row */}
//           <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

//             {/* Top items */}
//             <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
//               <div className="text-white font-bold text-base mb-4">🏆 Most Ordered</div>
//               {data.topItems.length === 0 ? (
//                 <div className="text-center py-6 text-slate-400 text-sm">No orders yet</div>
//               ) : (
//                 <div className="space-y-3">
//                   {data.topItems.map((item, i) => (
//                     <div key={i} className="flex items-center gap-3">
//                       <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0
//                         ${i===0?"bg-amber-500 text-black":i===1?"bg-slate-400 text-black":i===2?"bg-amber-700 text-white":"bg-white/10 text-slate-400"}`}>
//                         {i+1}
//                       </div>
//                       <div className="flex-1 min-w-0">
//                         <div className="text-white text-sm font-semibold truncate">{item.name}</div>
//                         <div className="flex gap-2">
//                           <span className="text-slate-400 text-xs">{item.count} orders</span>
//                           <span className="text-green-400 text-xs">₹{item.revenue.toLocaleString()}</span>
//                         </div>
//                       </div>
//                       <div className="w-16 bg-white/10 rounded-full h-1.5 overflow-hidden">
//                         <div className="h-full bg-blue-500 rounded-full"
//                           style={{ width: `${(item.count/data.topItems[0].count)*100}%` }} />
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//               )}
//             </div>

//             {/* Payment split */}
//             <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
//               <div className="text-white font-bold text-base mb-4">Payment Methods</div>
//               {paymentData.length === 0 ? (
//                 <div className="text-center py-6 text-slate-400 text-sm">No payments yet</div>
//               ) : (
//                 <div className="flex items-center gap-6">
//                   <ResponsiveContainer width={100} height={100}>
//                     <PieChart>
//                       <Pie data={paymentData} dataKey="value" cx="50%" cy="50%" innerRadius={25} outerRadius={45}>
//                         {paymentData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
//                       </Pie>
//                     </PieChart>
//                   </ResponsiveContainer>
//                   <div className="space-y-3">
//                     {paymentData.map((item, i) => (
//                       <div key={i} className="flex items-center gap-2">
//                         <div className="w-3 h-3 rounded-full" style={{ background: PIE_COLORS[i] }} />
//                         <span className="text-slate-300 text-sm">{item.name}</span>
//                         <span className="text-white font-bold text-sm">{item.value}</span>
//                       </div>
//                     ))}
//                   </div>
//                 </div>
//               )}
//             </div>
//           </div>
//         </>
//       )}
//     </div>
//   );
// }

























// import { useState, useEffect, useRef } from "react";
// import { getAnalyticsApi } from "../../api/analyticsApi";
// import {
//   LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
//   XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
// } from "recharts";

// import { useSubscription } from "../../hooks/useSubscription";
// import UpgradeToProCard from "../../components/restaurant/UpgradeToProCard";


// const PERIOD_OPTIONS = [
//   { value: 7, label: "Last 7 Days" },
//   { value: 14, label: "Last 14 Days" },
//   { value: 30, label: "Last 30 Days" },
//   { value: 90, label: "Last 3 Months" },
//   { value: 0, label: "Custom Range" },
// ];

// const PIE_COLORS = ["#3B82F6", "#10B981", "#F59E0B"];

// function StatCard({ label, value, sub, color = "blue", icon }) {
//   const colors = {
//     blue:   "from-blue-600/20 to-blue-600/5 border-blue-500/20",
//     green:  "from-green-600/20 to-green-600/5 border-green-500/20",
//     amber:  "from-amber-600/20 to-amber-600/5 border-amber-500/20",
//     purple: "from-purple-600/20 to-purple-600/5 border-purple-500/20",
//   };
//   return (
//     <div className={`rounded-2xl border bg-linear-to-br ${colors[color]} p-5`}>
//       <div className="text-2xl mb-2">{icon}</div>
//       <div className="text-white font-bold text-2xl">{value}</div>
//       <div className="text-slate-300 text-sm mt-0.5">{label}</div>
//       {sub && <div className="text-slate-500 text-xs mt-1">{sub}</div>}
//     </div>
//   );
// }

// const CustomTooltip = ({ active, payload, label }) => {
//   if (!active || !payload?.length) return null;
//   return (
//     <div className="bg-slate-800 border border-white/20 rounded-xl px-3 py-2 shadow-xl">
//       <div className="text-slate-300 text-xs mb-1">{label}</div>
//       {payload.map((p, i) => (
//         <div key={i} className="text-white font-bold text-sm">
//           {p.name === "revenue" ? `₹${p.value.toLocaleString()}` : `${p.value} orders`}
//         </div>
//       ))}
//     </div>
//   );
// };

// export default function Analytics() {
//   const [data, setData] = useState(null);
//   const [period, setPeriod] = useState(7);
//   const [useCustom, setUseCustom] = useState(false);
//   const [customFrom, setCustomFrom] = useState("");
//   const [customTo, setCustomTo] = useState("");
//   const [loading, setLoading] = useState(true);

//   // inside the component, before your existing fetch logic:
// const { isPro, loading: subLoading } = useSubscription();

// // useEffect(() => {
// //   if (subLoading || !isPro) return; // don't call getAnalyticsApi at all if not pro
// //   fetchData();
// // }, [period, useCustom, subLoading, isPro]);

// // useEffect(() => {
// //   if (subLoading) return;
// //   if (!isPro) { setLoading(false); return; } // never call getAnalyticsApi if not pro
// //   fetchData();
// //   // eslint-disable-next-line react-hooks/exhaustive-deps
// // }, [period, useCustom, subLoading, isPro]);


// const lastFetchKeyRef = useRef(null);

// useEffect(() => {
//   if (subLoading) return;

//   if (!isPro) {
//     setLoading(false);
//     return;
//   }

//   const currentKey = `${period}-${useCustom}-${subLoading}-${isPro}`;
//   if (lastFetchKeyRef.current === currentKey) return;
//   lastFetchKeyRef.current = currentKey;

//   fetchData();
//   // eslint-disable-next-line react-hooks/exhaustive-deps
// }, [period, useCustom, subLoading, isPro]);

//   // useEffect(() => {
//   //   if (!useCustom) fetchData();
//   // }, [period, useCustom]);

//   const fetchData = async () => {
//     setLoading(true);
//     try {
//       const res = await getAnalyticsApi(
//         useCustom ? 0 : period,
//         useCustom ? customFrom : null,
//         useCustom ? customTo : null
//       );
//       setData(res);
//     } catch { }
//     finally { setLoading(false); }
//   };

//   const handlePeriodChange = (e) => {
//     const val = Number(e.target.value);
//     if (val === 0) {
//       setUseCustom(true);
//     } else {
//       setUseCustom(false);
//       setPeriod(val);
//     }
//   };

//   const handleCustomApply = () => {
//     if (!customFrom || !customTo) return;
//     fetchData();
//   };

//   const paymentData = data ? [
//     { name: "Online", value: data.paymentSplit.online },
//     { name: "Cash", value: data.paymentSplit.cash },
//     { name: "Unpaid", value: data.paymentSplit.unpaid },
//   ].filter((d) => d.value > 0) : [];


//   // Then right before your existing return (...) with the charts, add:
//   if (subLoading) {
//   return (
//     <div className="flex items-center justify-center h-64">
//       <div className="text-slate-400 text-sm animate-pulse">Loading...</div>
//     </div>
//   );
// }

// if (!isPro) {
//   return (
//     <div className="space-y-6">
//       <div>
//         <h2 className="text-white font-bold text-2xl">Analytics</h2>
//         <p className="text-slate-400 text-sm mt-1">Revenue and order insights</p>
//       </div>
//       <UpgradeToProCard featureName="Analytics dashboard" />
//     </div>
//   );
// }

//   return (
//     <div className="space-y-6">

//       {/* Header */}
//       <div className="flex items-center justify-between flex-wrap gap-3">
//         <div>
//           <h2 className="text-white font-bold text-2xl">Analytics</h2>
//           <p className="text-slate-400 text-sm mt-1">Revenue and order insights</p>
//         </div>

//         {/* Period dropdown */}
//         <div className="flex items-center gap-3">
//           <select
//             value={useCustom ? 0 : period}
//             onChange={handlePeriodChange}
//             className="rounded-xl border border-white/20 bg-slate-800 text-white px-4 py-2 text-sm outline-none focus:border-blue-500"
//           >
//             {PERIOD_OPTIONS.map((opt) => (
//               <option key={opt.value} value={opt.value}>{opt.label}</option>
//             ))}
//           </select>
//           <button onClick={fetchData}
//             className="px-4 py-2 rounded-xl border border-white/20 bg-white/10 hover:bg-white/20 text-slate-300 text-sm font-semibold">
//             🔄 Refresh
//           </button>
//         </div>
//       </div>

//       {/* Custom date range */}
//       {useCustom && (
//         <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
//           <div className="text-white font-semibold text-sm mb-3">Custom Date Range</div>
//           <div className="flex gap-3 flex-wrap items-end">
//             <div>
//               <label className="block text-slate-400 text-xs mb-1">From</label>
//               <input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)}
//                 className="rounded-xl border border-white/20 bg-slate-800 px-3 py-2 text-white text-sm outline-none" />
//             </div>
//             <div>
//               <label className="block text-slate-400 text-xs mb-1">To</label>
//               <input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)}
//                 className="rounded-xl border border-white/20 bg-slate-800 px-3 py-2 text-white text-sm outline-none" />
//             </div>
//             <button onClick={handleCustomApply} disabled={!customFrom || !customTo}
//               className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold disabled:opacity-50">
//               Apply →
//             </button>
//           </div>
//         </div>
//       )}

//       {loading ? (
//         <div className="flex items-center justify-center h-48">
//           <div className="text-center">
//             <div className="text-4xl mb-4 animate-pulse">📊</div>
//             <div className="text-slate-400 text-sm">Loading analytics...</div>
//           </div>
//         </div>
//       ) : !data ? (
//         <div className="text-center py-20 text-slate-400">No data available</div>
//       ) : (
//         <>
//           {/* Stat cards */}
//           <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
//             <StatCard icon="💰" label="Revenue" value={`₹${Number(data.totalRevenue).toLocaleString()}`} sub="Paid orders only" color="green" />
//             <StatCard icon="📋" label="Orders" value={data.totalOrders} sub="Excl. cancelled" color="blue" />
//             <StatCard icon="📊" label="Avg Order" value={`₹${data.avgOrderValue}`} color="amber" />
//             <StatCard icon="💳" label="Online Paid" value={data.paymentSplit.online} sub={`${data.paymentSplit.cash} cash`} color="purple" />
//           </div>

//           {/* Revenue chart */}
//           <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
//             <div className="text-white font-bold text-base mb-5">Daily Revenue</div>
//             <ResponsiveContainer width="100%" height={220}>
//               <LineChart data={data.dailyRevenue}>
//                 <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
//                 <XAxis dataKey="date" tick={{ fill: "#94A3B8", fontSize: 11 }} axisLine={false} />
//                 <YAxis tick={{ fill: "#94A3B8", fontSize: 11 }} axisLine={false}
//                   tickFormatter={(v) => `₹${v >= 1000 ? `${(v/1000).toFixed(1)}k` : v}`} />
//                 <Tooltip content={<CustomTooltip />} />
//                 <Line type="monotone" dataKey="revenue" stroke="#3B82F6" strokeWidth={2.5}
//                   dot={{ fill: "#3B82F6", r: 3 }} activeDot={{ r: 5 }} name="revenue" />
//               </LineChart>
//             </ResponsiveContainer>
//           </div>

//           {/* Orders per day */}
//           <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
//             <div className="text-white font-bold text-base mb-5">Orders Per Day</div>
//             <ResponsiveContainer width="100%" height={180}>
//               <BarChart data={data.dailyRevenue}>
//                 <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
//                 <XAxis dataKey="date" tick={{ fill: "#94A3B8", fontSize: 11 }} axisLine={false} />
//                 <YAxis tick={{ fill: "#94A3B8", fontSize: 11 }} axisLine={false} />
//                 <Tooltip content={<CustomTooltip />} />
//                 <Bar dataKey="orders" fill="#8B5CF6" radius={[4,4,0,0]} name="orders" />
//               </BarChart>
//             </ResponsiveContainer>
//           </div>

//           {/* Bottom row */}
//           <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

//             {/* Top items */}
//             <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
//               <div className="text-white font-bold text-base mb-4">🏆 Most Ordered</div>
//               {data.topItems.length === 0 ? (
//                 <div className="text-center py-6 text-slate-400 text-sm">No orders yet</div>
//               ) : (
//                 <div className="space-y-3">
//                   {data.topItems.map((item, i) => (
//                     <div key={i} className="flex items-center gap-3">
//                       <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0
//                         ${i===0?"bg-amber-500 text-black":i===1?"bg-slate-400 text-black":i===2?"bg-amber-700 text-white":"bg-white/10 text-slate-400"}`}>
//                         {i+1}
//                       </div>
//                       <div className="flex-1 min-w-0">
//                         <div className="text-white text-sm font-semibold truncate">{item.name}</div>
//                         <div className="flex gap-2">
//                           <span className="text-slate-400 text-xs">{item.count} orders</span>
//                           <span className="text-green-400 text-xs">₹{item.revenue.toLocaleString()}</span>
//                         </div>
//                       </div>
//                       <div className="w-16 bg-white/10 rounded-full h-1.5 overflow-hidden">
//                         <div className="h-full bg-blue-500 rounded-full"
//                           style={{ width: `${(item.count/data.topItems[0].count)*100}%` }} />
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//               )}
//             </div>

//             {/* Payment split */}
//             <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
//               <div className="text-white font-bold text-base mb-4">Payment Methods</div>
//               {paymentData.length === 0 ? (
//                 <div className="text-center py-6 text-slate-400 text-sm">No payments yet</div>
//               ) : (
//                 <div className="flex items-center gap-6">
//                   <ResponsiveContainer width={100} height={100}>
//                     <PieChart>
//                       <Pie data={paymentData} dataKey="value" cx="50%" cy="50%" innerRadius={25} outerRadius={45}>
//                         {paymentData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
//                       </Pie>
//                     </PieChart>
//                   </ResponsiveContainer>
//                   <div className="space-y-3">
//                     {paymentData.map((item, i) => (
//                       <div key={i} className="flex items-center gap-2">
//                         <div className="w-3 h-3 rounded-full" style={{ background: PIE_COLORS[i] }} />
//                         <span className="text-slate-300 text-sm">{item.name}</span>
//                         <span className="text-white font-bold text-sm">{item.value}</span>
//                       </div>
//                     ))}
//                   </div>
//                 </div>
//               )}
//             </div>
//           </div>
//         </>
//       )}
//     </div>
//   );
// }