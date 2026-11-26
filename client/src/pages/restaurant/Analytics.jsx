// after kiosk
// with lucid icons and with one loading

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getAnalyticsApi } from "../../api/analyticsApi";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  TrendingUp,
  ClipboardList,
  Calculator,
  Loader2,
  CreditCard,
  RefreshCw,
} from "lucide-react";

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

const TONES = {
  ok: "bg-green-50 text-green-600",
  warn: "bg-amber-50 text-amber-600",
  info: "bg-blue-50 text-blue-600",
  accent: "bg-blue-50 text-blue-600",
  danger: "bg-red-50 text-red-600",
};

function StatCard({ label, value, sub, tone = "accent", icon }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4">
      <div
        className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${
          TONES[tone] || TONES.accent
        }`}
      >
        {icon}
      </div>

      <div className="text-gray-900 font-bold text-md leading-tight wrap-break-word">
        {value}
      </div>

      <div className="text-gray-600 text-sm mt-0.5">{label}</div>

      {sub && (
        <div className="text-gray-400 text-xs mt-1">{sub}</div>
      )}
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;

  return (
    <div className="bg-white border border-gray-200 rounded-xl px-3 py-2 shadow-lg">
      <div className="text-gray-600 text-xs mb-1">{label}</div>

      {payload.map((p, i) => (
        <div key={i} className="text-gray-900 font-bold text-sm">
          {p.name === "revenue"
            ? `₹${Number(p.value).toLocaleString("en-IN")}`
            : `${p.value} orders`}
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
    queryKey: [
      "analytics",
      period,
      useCustom,
      customFrom,
      customTo,
      isPro,
    ],
    queryFn: () =>
      getAnalyticsApi(
        useCustom ? 0 : period,
        useCustom ? customFrom : null,
        useCustom ? customTo : null
      ),
    enabled: isPro && !subLoading && (!useCustom || (!!customFrom && !!customTo)),
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
    if (!customFrom || !customTo || customFrom > customTo) return;
    refetch();
  };

  const paymentData = data
    ? [
        { name: "Paid before dining", value: data.paymentSplit.online },
        { name: "Paid after dining", value: data.paymentSplit.cash },
        { name: "Awaiting payment", value: data.paymentSplit.unpaid },
      ].filter((d) => d.value > 0)
    : [];

  if (subLoading || (isPro && loading)) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="w-6 h-6 animate-spin text-blue-500 mx-auto mb-3" />
          <div className="text-gray-600 text-sm">
            Loading analytics...
          </div>
        </div>
      </div>
    );
  }

  if (!isPro) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="font-display text-gray-900 font-semibold text-3xl">
            Analytics
          </h2>
          <p className="text-gray-600 text-sm mt-1">
            Revenue and order insights
          </p>
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
          <h2 className="font-display text-gray-900 font-semibold text-3xl">
            Analytics
          </h2>
          <p className="text-gray-600 text-sm mt-1">
            Revenue and order insights
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={useCustom ? 0 : period}
            onChange={handlePeriodChange}
            className="rounded-xl border border-gray-200 bg-white text-gray-900 px-4 py-2 text-sm outline-none focus:border-blue-600"
          >
            {PERIOD_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <button
            onClick={() => refetch()}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl
              border border-gray-200 bg-white
              hover:bg-gray-50
              active:scale-95
              disabled:opacity-50
              transition-all duration-150 ease-out
              text-gray-900 text-sm font-semibold cursor-pointer"
          >
            <RefreshCw
              size={15}
              strokeWidth={2.5}
              className={loading ? "animate-spin" : ""}
            />
            Refresh
          </button>
        </div>
      </div>

      {/* Custom Date Range */}
      {useCustom && (
        <div className="rounded-2xl border border-gray-200 bg-white p-4">
          <div className="text-gray-900 font-semibold text-sm mb-3">
            Custom Date Range
          </div>

          <div className="flex gap-3 flex-wrap items-end">
            <div>
              <label className="block text-gray-600 text-xs mb-1">
                From
              </label>
              <input
                type="date"
                value={customFrom}
                max={customTo || undefined}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-gray-900 text-sm outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-gray-600 text-xs mb-1">
                To
              </label>
              <input
                type="date"
                value={customTo}
                min={customFrom || undefined}
                onChange={(e) => setCustomTo(e.target.value)}
                className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-gray-900 text-sm outline-none focus:border-blue-600"
              />
            </div>

            <button
              onClick={handleCustomApply}
              disabled={
                !customFrom ||
                !customTo ||
                customFrom > customTo ||
                loading
              }
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700
                active:scale-95 transition-all text-white text-sm font-semibold
                disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Apply →
            </button>
          </div>
        </div>
      )}

      {!data ? (
        <div className="text-center py-20 text-gray-600">
          No data available
        </div>
      ) : (
        <>
          {/* Stat Cards — matching Dashboard */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard
              icon={<TrendingUp className="w-5 h-5" />}
              label="Revenue"
              value={`₹${Number(data.totalRevenue).toLocaleString("en-IN")}`}
              sub="Paid orders only"
              tone="ok"
            />

            <StatCard
              icon={<ClipboardList className="w-5 h-5" />}
              label="Orders"
              value={data.totalOrders}
              sub="Excl. cancelled"
              tone="accent"
            />

            <StatCard
              icon={<Calculator className="w-5 h-5" />}
              label="Avg. Order Value"
              value={`₹${Number(data.avgOrderValue).toLocaleString("en-IN")}`}
              sub="Per order"
              tone="info"
            />

            <StatCard
              icon={<CreditCard className="w-5 h-5" />}
              label="Paid before dining"
              value={data.paymentSplit.online}
              sub={`${data.paymentSplit.cash} paid after dining`}
              tone="warn"
            />
          </div>

          {/* Revenue Chart */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <div className="text-gray-900 font-bold text-base mb-5">
              Daily Revenue
            </div>

            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={data.dailyRevenue}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(0,0,0,0.06)"
                />
                <XAxis
                  dataKey="date"
                  tick={{ fill: "#6b7280", fontSize: 11 }}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fill: "#6b7280", fontSize: 11 }}
                  axisLine={false}
                  tickFormatter={(v) =>
                    `₹${v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}`
                  }
                />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#3B82F6"
                  strokeWidth={2.5}
                  dot={{ fill: "#3B82F6", r: 3 }}
                  activeDot={{ r: 5 }}
                  name="revenue"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Orders Per Day */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <div className="text-gray-900 font-bold text-base mb-5">
              Orders Per Day
            </div>

            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={data.dailyRevenue}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(0,0,0,0.06)"
                />
                <XAxis
                  dataKey="date"
                  tick={{ fill: "#6b7280", fontSize: 11 }}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fill: "#6b7280", fontSize: 11 }}
                  axisLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="orders"
                  fill="#8B5CF6"
                  radius={[4, 4, 0, 0]}
                  name="orders"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Bottom Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Top Items */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5">
              <div className="text-gray-900 font-bold text-base mb-4">
                🏆 Most Ordered
              </div>

              {data.topItems.length === 0 ? (
                <div className="text-center py-6 text-gray-600 text-sm">
                  No orders yet
                </div>
              ) : (
                <div className="space-y-3">
                  {data.topItems.map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                          i === 0
                            ? "bg-amber-500 text-black"
                            : i === 1
                              ? "bg-gray-400 text-black"
                              : i === 2
                                ? "bg-amber-700 text-white"
                                : "bg-gray-50 text-gray-400"
                        }`}
                      >
                        {i + 1}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="text-gray-900 text-sm font-semibold truncate">
                          {item.name}
                        </div>

                        <div className="flex gap-2">
                          <span className="text-gray-600 text-xs">
                            {item.count} orders
                          </span>
                          <span className="text-green-600 text-xs">
                            ₹{Number(item.revenue).toLocaleString("en-IN")}
                          </span>
                        </div>
                      </div>

                      <div className="w-16 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full"
                          style={{
                            width: `${
                              (item.count / data.topItems[0].count) * 100
                            }%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Payment Split */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5">
              <div className="text-gray-900 font-bold text-base mb-4">
                {/* Payment Methods */}
                How guests paid
              </div>

              {paymentData.length === 0 ? (
                <div className="text-center py-6 text-gray-600 text-sm">
                  No payments yet
                </div>
              ) : (
                <div className="flex items-center gap-6">
                  <ResponsiveContainer width={100} height={100}>
                    <PieChart>
                      <Pie
                        data={paymentData}
                        dataKey="value"
                        cx="50%"
                        cy="50%"
                        innerRadius={25}
                        outerRadius={45}
                      >
                        {paymentData.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i]} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>

                  <div className="space-y-3">
                    {paymentData.map((item, i) => (
                      <div key={item.name} className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ background: PIE_COLORS[i] }}
                        />
                        <span className="text-gray-600 text-sm">
                          {item.name}
                        </span>
                        <span className="text-gray-900 font-bold text-sm">
                          {item.value}
                        </span>
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
