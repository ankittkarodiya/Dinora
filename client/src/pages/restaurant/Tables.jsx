import { useState, useEffect, useRef } from "react";
import { getTablesApi, createTableApi, deleteTableApi } from "../../api/tableApi";
import { getMyRestaurantApi } from "../../api/restaurantApi";
import toast from "react-hot-toast";

export default function Tables() {
  const [tables, setTables] = useState([]);
  const [restaurant, setRestaurant] = useState(null);
  const [form, setForm] = useState({ name: "", capacity: "" });
  const [qrTable, setQrTable] = useState(null);
  const [loading, setLoading] = useState(true);

  // useEffect(() => {
  //   fetchData();
  // }, []);

  const hasFetchedRef = useRef(false);

useEffect(() => {
  if (hasFetchedRef.current) return;
  hasFetchedRef.current = true;
  fetchData(); // ← your actual function name
}, []);

  const fetchData = async () => {
    try {
      const [tablesData, restaurantData] = await Promise.all([
        getTablesApi(),
        getMyRestaurantApi(),
      ]);
      setTables(tablesData.tables || []);
      setRestaurant(restaurantData.restaurant);
    } catch (error) {
      toast.error("Failed to load tables");
    } finally {
      setLoading(false);
    }
  };


  const handleAdd = async () => {
  if (!form.name.trim() || !form.capacity) return;
  try {
    const data = await createTableApi({ name: form.name, capacity: Number(form.capacity) });
    setTables((p) => [...p, data.table]);
    setForm({ name: "", capacity: "" });
    toast.success("Table added");
  } catch (error) {
    if (error.response?.data?.code === "TABLE_LIMIT_REACHED") {
      toast.error(error.response.data.message + " Go to Settings to upgrade.");
    } else {
      toast.error(error.response?.data?.message || "Failed to add table");
    }
  }
};

  const handleDelete = async (id) => {
    try {
      await deleteTableApi(id);
      setTables((p) => p.filter((t) => t._id !== id));
      toast.success("Table deleted");
    } catch (error) {
      toast.error("Failed to delete table");
    }
  };

  const qrUrl = (tableId) =>
    `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
      `${window.location.origin}/menu/${restaurant?.slug}/${tableId}`
    )}&bgcolor=0f172a&color=ffffff&margin=10`;

  const menuUrl = (tableId) =>
    `${window.location.origin}/menu/${restaurant?.slug}/${tableId}`;

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <div className="text-4xl mb-4 animate-pulse">🪑</div>
        <div className="text-slate-400 text-sm">Loading tables...</div>
      </div>
    </div>
  );

  // no restaurant profile yet
  if (!restaurant) return (
    <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-8 text-center">
      <div className="text-4xl mb-3">⚠️</div>
      <div className="text-white font-bold text-lg mb-2">Restaurant Profile Missing</div>
      <div className="text-slate-300 text-sm">
        You need to create your restaurant profile first before adding tables.
        {/* Use Postman to hit POST /api/restaurant with your details. */}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-white font-bold text-2xl">Tables & QR Codes</h2>
        <p className="text-slate-400 text-sm mt-1">
          Add tables and generate QR codes for customers to scan · {tables.length} tables
        </p>
      </div>

      {/* Add table form */}
      <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6">
        <h3 className="text-white font-bold text-base mb-4">Add New Table</h3>
        <div className="flex gap-3 flex-wrap">
          <div className="flex-1 min-w-40">
            <label className="block text-slate-300 text-xs font-bold uppercase tracking-wide mb-2">
              Table Name
            </label>
            <input
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="e.g. Table 5, Window Seat"
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-slate-400 outline-none focus:border-blue-500 focus:ring-0 focus:ring-blue-500"
            />
          </div>
          <div className="w-32">
            <label className="block text-slate-300 text-xs font-bold uppercase tracking-wide mb-2">
              Capacity
            </label>
            <input
              type="number"
              value={form.capacity}
              onChange={(e) => setForm((p) => ({ ...p, capacity: e.target.value }))}
              placeholder="4"
              className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-slate-400 outline-none focus:border-blue-500 focus:ring-0 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={handleAdd}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm transition-all hover:-translate-y-0.5 self-end"
          >
            Add Table
          </button>
        </div>
      </div>

      {/* Tables grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {tables.length === 0 ? (
          <div className="col-span-3 rounded-2xl border border-white/10 bg-white/5 p-10 text-center text-slate-400">
            <div className="text-4xl mb-3">🪑</div>
            <div className="font-semibold">No tables yet</div>
            <div className="text-sm mt-1">Add your first table above</div>
          </div>
        ) : (
          tables.map((table) => (
            <div
              key={table._id}
              className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-5 text-center hover:bg-white/10 transition-all"
            >
              <div className="text-4xl mb-3">🪑</div>
              <div className="text-white font-bold text-lg">{table.name}</div>
              <div className="text-slate-400 text-sm mt-1 mb-4">
                Capacity: {table.capacity} people
              </div>
              <div className="text-slate-500 text-xs mb-4 break-all bg-white/5 rounded-lg px-3 py-2">
                /menu/{restaurant?.slug}/{table._id}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setQrTable(table)}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-all hover:-translate-y-0.5"
                >
                  📱 View QR
                </button>
                <button
                  onClick={() => handleDelete(table._id)}
                  className="py-2.5 px-3 border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl text-sm font-bold transition-all"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* QR Modal */}
      {qrTable && (
        <div
          onClick={() => setQrTable(null)}
          className="fixed inset-0 bg-black/80 z-100 flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-3xl border border-white/10 bg-slate-800/90 backdrop-blur-xl p-8 text-center"
          >
            <h3 className="text-white font-bold text-xl mb-1">{qrTable.name}</h3>
            <p className="text-slate-400 text-sm mb-6">
              Capacity: {qrTable.capacity} people · Scan to open menu
            </p>

            {/* QR image */}
            <div className="bg-white rounded-2xl p-4 inline-block mb-6">
              <img
                src={qrUrl(qrTable._id)}
                alt={`QR for ${qrTable.name}`}
                width={200}
                height={200}
                className="rounded-xl"
                onError={(e) => {
                  e.target.style.display = "none";
                  e.target.nextSibling.style.display = "flex";
                }}
              />
              <div
                style={{ display: "none" }}
                className="w-50 h-50 items-center justify-center bg-slate-200 rounded-xl text-slate-500 text-sm"
              >
                QR needs internet connection
              </div>
            </div>

            {/* URL display */}
            <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-slate-400 text-xs mb-4 break-all">
              {menuUrl(qrTable._id)}
            </div>

            {/* Copy link button */}
            <button
              onClick={() => {
                navigator.clipboard.writeText(menuUrl(qrTable._id));
                toast.success("Link copied!");
              }}
              className="w-full mb-4 py-2.5 border border-white/20 bg-white/10 hover:bg-white/20 text-slate-300 rounded-xl font-semibold text-sm transition-all"
            >
              📋 Copy Link
            </button>

            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl px-4 py-3 text-blue-300 text-xs text-left mb-6">
              💡 Print this QR and place it on {qrTable.name}. Customers scan to open the menu directly — no app needed.
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => window.print()}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm transition-all hover:-translate-y-0.5"
              >
                🖨️ Print QR
              </button>
              <button
                onClick={() => setQrTable(null)}
                className="flex-1 py-3 border border-white/20 bg-white/10 hover:bg-white/20 text-slate-300 rounded-xl font-bold text-sm transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}