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
  const [adding, setAdding] = useState(false);
  const [deleteModal, setDeleteModal] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const printIframeRef = useRef(null); // ← new: for the isolated QR print job

  const hasFetchedRef = useRef(false);
useEffect(() => {
  if (hasFetchedRef.current) return;
  hasFetchedRef.current = true;
  fetchData();
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
  if (adding) return;
  setAdding(true);
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
  } finally {
    setAdding(false);
  }
};
  const handleDeleteClick = (table) => {
    setDeleteModal(table);
  };
  const handleConfirmDelete = async () => {
    if (deleting) return;
    setDeleting(true);
    try {
      await deleteTableApi(deleteModal._id);
      setTables((p) => p.filter((t) => t._id !== deleteModal._id));
      toast.success("Table deleted");
      setDeleteModal(null);
    } catch (error) {
      toast.error("Failed to delete table");
    } finally {
      setDeleting(false);
    }
  };
  const qrUrl = (tableId) =>
    `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
      `${window.location.origin}/menu/${restaurant?.slug}/${tableId}`
    )}&bgcolor=0f172a&color=ffffff&margin=10`;
  const menuUrl = (tableId) =>
    `${window.location.origin}/menu/${restaurant?.slug}/${tableId}`;

  // ← THE FIX: same invisible-iframe technique used for the kitchen slip.
  // Prints ONLY the QR + restaurant name + table name, on one clean page,
  // no popup window, works reliably on both desktop and mobile.
  const handlePrintQr = () => {
    const iframe = printIframeRef.current;
    const doc = iframe.contentDocument || iframe.contentWindow.document;

    const printHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: Arial, sans-serif;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              padding: 24px;
              text-align: center;
            }
            .restaurant-name { font-size: 24px; font-weight: bold; margin-bottom: 2px; }
            .table-name { font-size: 27px; font-weight: bold; margin-bottom: 4px; }
            .subtitle { font-size: 16px; color: #555; margin-bottom: 20px; }

            // size of qr
            // img { width: 220px; height: 220px; }
            img { width: 300px; height: 300px; }

            .footer { font-size: 15px; color: #888; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="restaurant-name">${restaurant?.name || "Restaurant"}</div>
          <div class="table-name">${qrTable.name}</div>
          <div class="subtitle">Scan to open menu</div>
          <img src="${qrUrl(qrTable._id)}" alt="QR Code" />
          <div class="footer">Powered by Dinora · dinora.in</div>
        </body>
      </html>
    `;

    doc.open();
    doc.write(printHTML);
    doc.close();

    iframe.onload = () => {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    };
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <div className="text-4xl mb-4 animate-pulse">🪑</div>
        <div className="text-slate-400 text-sm">Loading tables...</div>
      </div>
    </div>
  );
  if (!restaurant) return (
    <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-8 text-center">
      <div className="text-4xl mb-3">⚠️</div>
      <div className="text-white font-bold text-lg mb-2">Restaurant Profile Missing</div>
      <div className="text-slate-300 text-sm">
        You need to create your restaurant profile first before adding tables.
      </div>
    </div>
  );
  return (
    <div className="space-y-6">
      {/* ← invisible iframe used purely for isolated QR printing */}
      <iframe
        ref={printIframeRef}
        style={{ position: "absolute", width: 0, height: 0, border: 0 }}
        title="qr-print-frame"
      />

      {deleteModal && (
        <div
          onClick={() => !deleting && setDeleteModal(null)}
          className="fixed inset-0 bg-black/80 z-100 flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-3xl border border-red-500/20 bg-slate-800/95 p-6"
          >
            <div className="text-center mb-5">
              <div className="text-4xl mb-3">⚠️</div>
              <h3 className="text-white font-bold text-lg">Delete Table?</h3>
              <p className="text-slate-400 text-xs mt-1">
                Are you sure you want to delete <span className="text-white font-semibold">"{deleteModal.name}"</span>? This will also invalidate its QR code.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteModal(null)}
                disabled={deleting}
                className="flex-1 py-3 border border-white/20 bg-white/10 text-slate-300 rounded-xl font-bold text-sm disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-sm disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
      <div>
        <h2 className="text-white font-bold text-2xl">Tables & QR Codes</h2>
        <p className="text-slate-400 text-sm mt-1">
          Add tables and generate QR codes for customers to scan · {tables.length} tables
        </p>
      </div>
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
              disabled={adding}
              className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-slate-400 outline-none focus:border-blue-500 focus:ring-0 focus:ring-blue-500 disabled:opacity-50"
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
              disabled={adding}
              className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-slate-400 outline-none focus:border-blue-500 focus:ring-0 focus:ring-blue-500 disabled:opacity-50"
            />
          </div>
          <button
            onClick={handleAdd}
            disabled={adding}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm transition-all hover:-translate-y-0.5 self-end disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
          >
            {adding ? "Adding..." : "Add Table"}
          </button>
        </div>
      </div>
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
                  onClick={() => handleDeleteClick(table)}
                  className="py-2.5 px-3 border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl text-sm font-bold transition-all"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))
        )}
      </div>
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
            <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-slate-400 text-xs mb-4 break-all">
              {menuUrl(qrTable._id)}
            </div>
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
                onClick={handlePrintQr}
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

























// import { useState, useEffect, useRef } from "react";
// import { getTablesApi, createTableApi, deleteTableApi } from "../../api/tableApi";
// import { getMyRestaurantApi } from "../../api/restaurantApi";
// import toast from "react-hot-toast";
// export default function Tables() {
//   const [tables, setTables] = useState([]);
//   const [restaurant, setRestaurant] = useState(null);
//   const [form, setForm] = useState({ name: "", capacity: "" });
//   const [qrTable, setQrTable] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [adding, setAdding] = useState(false); // ← new: loading state for Add Table
//   const [deleteModal, setDeleteModal] = useState(null); // ← new: table pending delete confirmation
//   const [deleting, setDeleting] = useState(false); // ← new: loading state for confirm-delete button


//   // useEffect(() => {
//   //   fetchData();
//   // }, []);

//   const hasFetchedRef = useRef(false);
// useEffect(() => {
//   if (hasFetchedRef.current) return;
//   hasFetchedRef.current = true;
//   fetchData(); // ← your actual function name
// }, []);
//   const fetchData = async () => {
//     try {
//       const [tablesData, restaurantData] = await Promise.all([
//         getTablesApi(),
//         getMyRestaurantApi(),
//       ]);
//       setTables(tablesData.tables || []);
//       setRestaurant(restaurantData.restaurant);
//     } catch (error) {
//       toast.error("Failed to load tables");
//     } finally {
//       setLoading(false);
//     }
//   };
//   const handleAdd = async () => {
//   if (!form.name.trim() || !form.capacity) return;
//   if (adding) return; // ← guard against double-clicks
//   setAdding(true);
//   try {
//     const data = await createTableApi({ name: form.name, capacity: Number(form.capacity) });
//     setTables((p) => [...p, data.table]);
//     setForm({ name: "", capacity: "" });
//     toast.success("Table added");
//   } catch (error) {
//     if (error.response?.data?.code === "TABLE_LIMIT_REACHED") {
//       toast.error(error.response.data.message + " Go to Settings to upgrade.");
//     } else {
//       toast.error(error.response?.data?.message || "Failed to add table");
//     }
//   } finally {
//     setAdding(false);
//   }
// };
//   // ← replaces the direct call — this just opens the confirmation modal
//   const handleDeleteClick = (table) => {
//     setDeleteModal(table);
//   };
//   // ← the actual delete, only runs after confirming in the modal
//   const handleConfirmDelete = async () => {
//     if (deleting) return;
//     setDeleting(true);
//     try {
//       await deleteTableApi(deleteModal._id);
//       setTables((p) => p.filter((t) => t._id !== deleteModal._id));
//       toast.success("Table deleted");
//       setDeleteModal(null);
//     } catch (error) {
//       toast.error("Failed to delete table");
//     } finally {
//       setDeleting(false);
//     }
//   };
//   const qrUrl = (tableId) =>
//     `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
//       `${window.location.origin}/menu/${restaurant?.slug}/${tableId}`
//     )}&bgcolor=0f172a&color=ffffff&margin=10`;
//   const menuUrl = (tableId) =>
//     `${window.location.origin}/menu/${restaurant?.slug}/${tableId}`;
//   if (loading) return (
//     <div className="flex items-center justify-center h-64">
//       <div className="text-center">
//         <div className="text-4xl mb-4 animate-pulse">🪑</div>
//         <div className="text-slate-400 text-sm">Loading tables...</div>
//       </div>
//     </div>
//   );
//   // no restaurant profile yet
//   if (!restaurant) return (
//     <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-8 text-center">
//       <div className="text-4xl mb-3">⚠️</div>
//       <div className="text-white font-bold text-lg mb-2">Restaurant Profile Missing</div>
//       <div className="text-slate-300 text-sm">
//         You need to create your restaurant profile first before adding tables.
//         {/* Use Postman to hit POST /api/restaurant with your details. */}
//       </div>
//     </div>
//   ); 
//   return (
//     <div className="space-y-6">

//       {/* Delete confirmation modal */}
//       {deleteModal && (
//         <div
//           onClick={() => !deleting && setDeleteModal(null)}
//           className="fixed inset-0 bg-black/80 z-100 flex items-center justify-center p-4"
//         >
//           <div
//             onClick={(e) => e.stopPropagation()}
//             className="w-full max-w-md rounded-3xl border border-red-500/20 bg-slate-800/95 p-6"
//           >
//             <div className="text-center mb-5">
//               <div className="text-4xl mb-3">⚠️</div>
//               <h3 className="text-white font-bold text-lg">Delete Table?</h3>
//               <p className="text-slate-400 text-xs mt-1">
//                 Are you sure you want to delete <span className="text-white font-semibold">"{deleteModal.name}"</span>? This will also invalidate its QR code.
//               </p>
//             </div>
//             <div className="flex gap-3">
//               <button
//                 onClick={() => setDeleteModal(null)}
//                 disabled={deleting}
//                 className="flex-1 py-3 border border-white/20 bg-white/10 text-slate-300 rounded-xl font-bold text-sm disabled:opacity-50"
//               >
//                 Cancel
//               </button>
//               <button
//                 onClick={handleConfirmDelete}
//                 disabled={deleting}
//                 className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-sm disabled:opacity-50"
//               >
//                 {deleting ? "Deleting..." : "Delete"}
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       <div>
//         <h2 className="text-white font-bold text-2xl">Tables & QR Codes</h2>
//         <p className="text-slate-400 text-sm mt-1">
//           Add tables and generate QR codes for customers to scan · {tables.length} tables
//         </p>
//       </div>
//       {/* Add table form */}
//       <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6">
//         <h3 className="text-white font-bold text-base mb-4">Add New Table</h3>
//         <div className="flex gap-3 flex-wrap">
//           <div className="flex-1 min-w-40">
//             <label className="block text-slate-300 text-xs font-bold uppercase tracking-wide mb-2">
//               Table Name
//             </label>
//             <input
//               value={form.name}
//               onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
//               placeholder="e.g. Table 5, Window Seat"
//               onKeyDown={(e) => e.key === "Enter" && handleAdd()}
//               disabled={adding}
//               className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-slate-400 outline-none focus:border-blue-500 focus:ring-0 focus:ring-blue-500 disabled:opacity-50"
//             />
//           </div>
//           <div className="w-32">
//             <label className="block text-slate-300 text-xs font-bold uppercase tracking-wide mb-2">
//               Capacity
//             </label>
//             <input
//               type="number"
//               value={form.capacity}
//               onChange={(e) => setForm((p) => ({ ...p, capacity: e.target.value }))}
//               placeholder="4"
//               disabled={adding}
//               className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-slate-400 outline-none focus:border-blue-500 focus:ring-0 focus:ring-blue-500 disabled:opacity-50"
//             />
//           </div>
//           <button
//             onClick={handleAdd}
//             disabled={adding}
//             className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm transition-all hover:-translate-y-0.5 self-end disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
//           >
//             {adding ? "Adding..." : "Add Table"}
//           </button>
//         </div>
//       </div>
//       {/* Tables grid */}
//       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
//         {tables.length === 0 ? (
//           <div className="col-span-3 rounded-2xl border border-white/10 bg-white/5 p-10 text-center text-slate-400">
//             <div className="text-4xl mb-3">🪑</div>
//             <div className="font-semibold">No tables yet</div>
//             <div className="text-sm mt-1">Add your first table above</div>
//           </div>
//         ) : (
//           tables.map((table) => (
//             <div
//               key={table._id}
//               className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-5 text-center hover:bg-white/10 transition-all"
//             >
//               <div className="text-4xl mb-3">🪑</div>
//               <div className="text-white font-bold text-lg">{table.name}</div>
//               <div className="text-slate-400 text-sm mt-1 mb-4">
//                 Capacity: {table.capacity} people
//               </div>
//               <div className="text-slate-500 text-xs mb-4 break-all bg-white/5 rounded-lg px-3 py-2">
//                 /menu/{restaurant?.slug}/{table._id}
//               </div>
//               <div className="flex gap-2">
//                 <button
//                   onClick={() => setQrTable(table)}
//                   className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-all hover:-translate-y-0.5"
//                 >
//                   📱 View QR
//                 </button>
//                 <button
//                   onClick={() => handleDeleteClick(table)}
//                   className="py-2.5 px-3 border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl text-sm font-bold transition-all"
//                 >
//                   🗑️
//                 </button>
//               </div>
//             </div>
//           ))
//         )}
//       </div>



//       {/* QR Modal */}
//       {qrTable && (
//         <div
//           onClick={() => setQrTable(null)}
//           className="fixed inset-0 bg-black/80 z-100 flex items-center justify-center p-4"
//         >
//           <div
//             onClick={(e) => e.stopPropagation()}
//             className="w-full max-w-sm rounded-3xl border border-white/10 bg-slate-800/90 backdrop-blur-xl p-8 text-center"
//           >
//             <h3 className="text-white font-bold text-xl mb-1">{qrTable.name}</h3>
//             <p className="text-slate-400 text-sm mb-6">
//               Capacity: {qrTable.capacity} people · Scan to open menu
//             </p>
//             {/* QR image */}
//             <div className="bg-white rounded-2xl p-4 inline-block mb-6">
//               <img
//                 src={qrUrl(qrTable._id)}
//                 alt={`QR for ${qrTable.name}`}
//                 width={200}
//                 height={200}
//                 className="rounded-xl"
//                 onError={(e) => {
//                   e.target.style.display = "none";
//                   e.target.nextSibling.style.display = "flex";
//                 }}
//               />
//               <div
//                 style={{ display: "none" }}
//                 className="w-50 h-50 items-center justify-center bg-slate-200 rounded-xl text-slate-500 text-sm"
//               >
//                 QR needs internet connection
//               </div>
//             </div>
//             {/* URL display */}
//             <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-slate-400 text-xs mb-4 break-all">
//               {menuUrl(qrTable._id)}
//             </div>
//             {/* Copy link button */}
//             <button
//               onClick={() => {
//                 navigator.clipboard.writeText(menuUrl(qrTable._id));
//                 toast.success("Link copied!");
//               }}
//               className="w-full mb-4 py-2.5 border border-white/20 bg-white/10 hover:bg-white/20 text-slate-300 rounded-xl font-semibold text-sm transition-all"
//             >
//               📋 Copy Link
//             </button>
//             <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl px-4 py-3 text-blue-300 text-xs text-left mb-6">
//               💡 Print this QR and place it on {qrTable.name}. Customers scan to open the menu directly — no app needed.
//             </div>
//             <div className="flex gap-3">
//               <button
//                 onClick={() => window.print()}
//                 className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm transition-all hover:-translate-y-0.5"
//               >
//                 🖨️ Print QR
//               </button>
//               <button
//                 onClick={() => setQrTable(null)}
//                 className="flex-1 py-3 border border-white/20 bg-white/10 hover:bg-white/20 text-slate-300 rounded-xl font-bold text-sm transition-all"
//               >
//                 Close
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

      
//     </div>
//   );
// }