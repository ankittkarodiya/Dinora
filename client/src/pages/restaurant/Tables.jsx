// after kiosk
import { useState, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query"; // ← fixed: useQueryClient added here
import {
  getTablesApi,
  createTableApi,
  deleteTableApi,
  // setTableKioskApi,
  generateKioskApi,
} from "../../api/tableApi";
import { getMyRestaurantApi } from "../../api/restaurantApi";
import { useSubscription } from "../../hooks/useSubscription";
import toast from "react-hot-toast";
import { QrCode, Trash2 } from "lucide-react";

export default function Tables() {
  // ── Fetch tables ──────────────────────────────────────────────────
  // Cached under ["tables"]. Revisiting this page within 30s (React
  // Query's default staleTime, set once in main.jsx) shows this data
  // INSTANTLY from cache — no loading spinner, no refetch.
  const { data: tablesData, isLoading: tablesLoading } = useQuery({
    queryKey: ["tables"],
    queryFn: async () => {
      const res = await getTablesApi();
      return res.tables || [];
    },
  });
  const tables = tablesData || []; // ← always a safe array, even before the first fetch resolves

  // new for genrating a one kiosk
  const kioskTable = tables.find((t) => t.isKioskTable) || null;
  const regularTables = tables.filter((t) => !t.isKioskTable);

  // ── Fetch restaurant profile ────────────────────────────────────────
  // Cached under ["restaurant"] — a SHARED key. Settings.jsx and
  // RestaurantLayout.jsx will use this exact same key too, so all three
  // places read from one single cached copy instead of each fetching
  // their own separately. Updating the profile in Settings will
  // automatically be reflected here too, with no extra fetch.
  const { data: restaurant, isLoading: restaurantLoading } = useQuery({
    queryKey: ["restaurant"],
    queryFn: async () => {
      const res = await getMyRestaurantApi();
      return res.restaurant;
    },
    retry: false, // matches the original behavior: a failed fetch just shows the "missing profile" screen below, no automatic retry loop
  });

  // combined loading state — page waits for BOTH fetches before rendering real content
  const loading = tablesLoading || restaurantLoading;

  // ── Local UI-only state (not fetched data — stays as normal useState) ─
  // const [form, setForm] = useState({ name: "", capacity: "" });
  const [form, setForm] = useState({ name: "" });
  const [qrTable, setQrTable] = useState(null); // which table's QR modal is currently open, if any
  const [adding, setAdding] = useState(false); // true while "Add Table" request is in flight
  const [deleteModal, setDeleteModal] = useState(null); // which table's delete-confirmation modal is open, if any
  const [deleting, setDeleting] = useState(false); // true while a delete request is in flight
  const printIframeRef = useRef(null); // ← for the isolated QR print job (invisible iframe technique)

  // needed so our mutation handlers below can update the cached ["tables"]
  // list directly, instead of calling a local setTables that no longer exists
  const queryClient = useQueryClient(); // ← fixed: was incorrectly named useQueryClientRef()
  const { isPro } = useSubscription();

  // ── Add a new table ──────────────────────────────────────────────────
  const handleAdd = async () => {
    // if (!form.name.trim() || !form.capacity) return;
    if ( !form.name.trim() ) return;
    if (adding) return; // guard against double-clicks while a request is already in flight
    setAdding(true);
    try {
      const data = await createTableApi({
        name: form.name,
        // capacity: Number(form.capacity),
      });
      // ← patches the cached ["tables"] list directly — every component
      // reading this query (just this page, for now) sees the new table
      // immediately, without needing a fresh fetch from the server
      queryClient.setQueryData(["tables"], (old) => [
        ...(old || []),
        data.table,
      ]);
      // setForm({ name: "", capacity: "" });
      setForm({ name: "" });
      toast.success("Table added");
    } catch (error) {
      // special-cased error: hitting the plan's table limit gets its own message
      if (error.response?.data?.code === "TABLE_LIMIT_REACHED") {
        toast.error(
          error.response.data.message + " Go to Settings to upgrade.",
        );
      } else {
        toast.error(error.response?.data?.message || "Failed to add table");
      }
    } finally {
      setAdding(false);
    }
  };

  // ── Kiosk toggle ─────────────────────────────────────────────────────
  // A "kiosk" table is a self-ordering counter screen: no name/phone, no
  // login, online payment only, shows a token and resets for the next
  // customer. The server refuses to enable it unless online payments
  // actually work (Razorpay linked on a paid plan).

  // const [togglingKioskId, setTogglingKioskId] = useState(null);
  // const handleToggleKiosk = async (table) => {
  //   if (togglingKioskId) return;
  //   setTogglingKioskId(table._id);
  //   try {
  //     const data = await setTableKioskApi(table._id, !table.isKiosk);
  //     queryClient.setQueryData(["tables"], (old) => (old || []).map((t) => (t._id === table._id ? data.table : t)));
  //     toast.success(data.table.isKiosk ? "Self-ordering kiosk mode ON" : "Back to normal table QR");
  //   } catch (error) {
  //     toast.error(error.response?.data?.message || "Could not change mode");
  //   } finally {
  //     setTogglingKioskId(null);
  //   }
  // };


  // new for one kiosk
  // ── Self kiosk: one per restaurant, created/re-enabled from its own card ──
  const [generatingKiosk, setGeneratingKiosk] = useState(false);
  const handleGenerateKiosk = async () => {
    if (generatingKiosk) return;
    setGeneratingKiosk(true);
    try {
      const data = await generateKioskApi();
      queryClient.setQueryData(["tables"], (old) => [
        ...(old || []).filter((t) => t._id !== data.table._id),
        data.table,
      ]);
      toast.success("Self kiosk is ready");
      setQrTable(data.table); // open its QR right away
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not set up the kiosk");
    } finally {
      setGeneratingKiosk(false);
    }
  };


  // ── Delete flow — click opens confirmation modal, confirm actually deletes ─
  const handleDeleteClick = (table) => {
    setDeleteModal(table);
  };

  const handleConfirmDelete = async () => {
    if (deleting) return; // guard against double-clicks
    setDeleting(true);
    try {
      await deleteTableApi(deleteModal._id);
      // ← removes the deleted table from the cached list directly
      queryClient.setQueryData(["tables"], (old) =>
        (old || []).filter((t) => t._id !== deleteModal._id),
      );
      toast.success("Table deleted");
      setDeleteModal(null);
    } catch (error) {
      toast.error("Failed to delete table");
    } finally {
      setDeleting(false);
    }
  };

  // ── QR code + menu link helpers ──────────────────────────────────────
  // builds the actual scannable QR image URL for a given table, via a free third-party QR generation API
  const qrUrl = (tableId) =>
    `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
      // `${window.location.origin}/menu/${restaurant?.slug}/${tableId}`,

      // new
      `${window.location.origin}/${restaurant?.slug}/menu/${tableId}`,

    )}&bgcolor=ffffff&color=1d1a17&margin=10`;

  // the actual customer-facing menu URL that QR code points to
  const menuUrl = (tableId) =>
    // `${window.location.origin}/menu/${restaurant?.slug}/${tableId}`;
    // new
    `${window.location.origin}/${restaurant?.slug}/menu/${tableId}`;

  // ── QR printing ──────────────────────────────────────────────────────
  // Same invisible-iframe technique used for the kitchen slip elsewhere in
  // this app. Prints ONLY the QR + restaurant name + table name, on one
  // clean page — no popup window (which mobile browsers often block),
  // works reliably on both desktop and mobile.
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

            .link {
              font-size: 12px;
              color: #666;
              word-break: break-all;
              margin-top: 8px;
            }

            .footer { font-size: 15px; color: #888; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="restaurant-name">${restaurant?.name || "Restaurant"}</div>
          <div class="table-name">${qrTable.name}</div>
          <div class="subtitle">Scan to open menu</div>
          <img src="${qrUrl(qrTable._id)}" alt="QR Code" />

          <p class="link">${menuUrl(qrTable._id)}</p>
          <div class="footer">Powered by Dinora · dinora.in</div>
        </body>
      </html>
    `;

    doc.open();
    doc.write(printHTML);
    doc.close();

    // waits for the iframe's own load event before printing, so the QR
    // image has actually finished rendering inside it first
    iframe.onload = () => {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    };
  };

  // ── Loading state — shown while either tables or restaurant is still fetching ─
  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-gray-600 text-sm">Loading tables...</div>
        </div>
      </div>
    );

  // ── Missing-profile guard — can't manage tables without a restaurant profile first ─
  if (!restaurant)
    return (
      <div className="rounded-2xl border border-amber-500/30 bg-amber-50 p-8 text-center">
        <div className="text-4xl mb-3">⚠️</div>
        <div className="text-gray-900 font-bold text-lg mb-2">
          Restaurant Profile Missing
        </div>
        <div className="text-gray-600 text-sm">
          You need to create your restaurant profile first before adding tables.
        </div>
      </div>
    );

  // ── Main page content ────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* invisible iframe used purely for isolated QR printing — never visible to the user */}
      <iframe
        ref={printIframeRef}
        style={{ position: "absolute", width: 0, height: 0, border: 0 }}
        title="qr-print-frame"
      />

      {/* delete confirmation modal — only rendered when a table is pending deletion */}
      {deleteModal && (
        <div
          onClick={() => !deleting && setDeleteModal(null)}
          className="fixed inset-0 bg-black/50 z-100 flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-3xl border border-gray-200 bg-white shadow-2xl p-6"
          >
            <div className="text-center mb-5">
              <div className="text-4xl mb-3">⚠️</div>
              <h3 className="text-gray-900 font-bold text-lg">Delete Table?</h3>
              <p className="text-gray-600 text-xs mt-1">
                Are you sure you want to delete{" "}
                <span className="text-gray-900 font-semibold">
                  "{deleteModal.name}"
                </span>
                ? This will also invalidate its QR code.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteModal(null)}
                disabled={deleting}
                className="flex-1 py-3 border border-gray-200 bg-white text-gray-900 rounded-xl font-bold text-sm disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="flex-1 py-3 bg-red-500 hover:opacity-90 text-white rounded-xl font-bold text-sm disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* page header */}
      <div>
        <h2 className="font-display text-gray-900 font-semibold text-3xl">Tables & QR Codes</h2>
        <p className="text-gray-600 text-sm mt-1">
          Add tables and generate QR codes for customers to scan ·{" "}
          {/* {tables.length} tables */}

          {/* new for one kiosk other than tables */}
          {regularTables.length} tables
        </p>
      </div>

      {/* add-table form */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6">
        <h3 className="text-gray-900 font-bold text-base mb-4">Add New Table</h3>
        <div className="flex gap-3 flex-wrap">
          <div className="flex-1 min-w-40">
            <label className="block text-gray-600 text-xs font-bold uppercase tracking-wide mb-2">
              Table Name
            </label>
            <input
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="e.g. Table 5, Window Seat"
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              disabled={adding}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 placeholder-gray-400 outline-none focus:border-blue-600 disabled:opacity-50"
            />
          </div>

          {/* <div className="w-32">
            <label className="block text-gray-600 text-xs font-bold uppercase tracking-wide mb-2">
              Capacity
            </label>
            <input
              type="number"
              value={form.capacity}
              onChange={(e) =>
                setForm((p) => ({ ...p, capacity: e.target.value }))
              }
              placeholder="e.g. 4"
              disabled={adding}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 placeholder-gray-400 outline-none focus:border-blue-600 disabled:opacity-50"
            />
          </div> */}

          <button
            onClick={handleAdd}
            disabled={adding}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm transition-all hover:-translate-y-0.5 self-end disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
          >
            {adding ? "Adding..." : "Add Table"}
          </button>
        </div>
      </div>

      {/* new for one kiosk */}
      {/* self-ordering kiosk — one per restaurant, can't be deleted */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="text-4xl">🖥️</div>
        <div className="flex-1">
          <h3 className="text-gray-900 font-bold text-base">Self-ordering Kiosk</h3>
          <p className="text-gray-600 text-sm mt-1">
            One QR for your counter or entrance. Customers order and pay online on their own, no table needed.
          </p>
          {!isPro && (
            <p className="text-gray-400 text-xs mt-1">Pro feature. Upgrade in Settings to use it.</p>
          )}
        </div>
        {isPro &&
          (kioskTable?.isKiosk ? (
            <button
              onClick={() => setQrTable(kioskTable)}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl font-bold text-sm transition-all duration-150 cursor-pointer active:scale-[0.98]"
            >
              <QrCode className="w-4 h-4" />
              <span>View Kiosk QR</span>
            </button>
          ) : (
            <button
              onClick={handleGenerateKiosk}
              disabled={generatingKiosk}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl font-bold text-sm transition-all duration-150 cursor-pointer active:scale-[0.98] disabled:opacity-50"
            >
              {generatingKiosk
                ? "Please wait..."
                : kioskTable
                  ? "Turn kiosk back on"
                  : "Generate Self Kiosk"}
            </button>
          ))}
      </div>




      {/* tables grid — empty state, or a card per table */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* {tables.length === 0 ? ( */}
        {regularTables.length === 0 ? (
          <div className="col-span-3 rounded-2xl border border-gray-200 bg-white p-10 text-center text-gray-600">
            <div className="font-semibold">No tables yet</div>
            <div className="text-sm mt-1">Add your first table above</div>
          </div>
        ) : (
          // tables.map((table) => (
          regularTables.map((table) => (
            <div
              key={table._id}
              className="rounded-2xl border border-gray-200 bg-white p-5 text-center"
            >
              <div className="text-4xl mb-3">🪑</div>
              <div className="text-gray-900 font-bold text-lg">{table.name}</div>

              <div className="text-gray-600 text-sm mt-1 mb-4">
                {/* Capacity: {table.capacity} people */}
              </div>

              {/* {isPro && table.isKiosk && (
                <div className="inline-block mb-3 text-[11px] font-bold uppercase tracking-wide text-blue-600 bg-blue-50 rounded-full px-3 py-1">
                  Self-ordering kiosk
                </div>
              )} */}

              <div className="text-gray-400 text-xs mb-4 break-all bg-gray-50 rounded-lg px-3 py-2">
                {/* /menu/{restaurant?.slug}/{table._id} */}

                {/* new */}
                /{restaurant?.slug}/menu/{table._id}
              </div>

              {/* kiosk toggle — Pro only */}
              {/* {isPro && (
                <button
                  onClick={() => handleToggleKiosk(table)}
                  disabled={togglingKioskId === table._id}
                  className="w-full mb-2 py-2 border border-gray-200 bg-white hover:bg-gray-100 text-gray-900 rounded-xl text-xs font-semibold transition-all disabled:opacity-50"
                >
                  {togglingKioskId === table._id
                    ? "Updating..."
                    : table.isKiosk
                      ? "Switch back to table QR"
                      : "Use as self-ordering kiosk"}
                </button>
              )} */}

              <div className="flex gap-2">

                <button
                  onClick={() => setQrTable(table)}
                  className="flex flex-1 items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-all hover:-translate-y-0.5"
                >
                  <QrCode className="w-4 h-4" />
                  <span>View QR</span>
                </button>

                <button
                  onClick={() => handleDeleteClick(table)}
                  className="p-2.5 border border-red-500/30 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition-all"
                  title="Delete"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* QR view modal — only rendered when a table's QR is being viewed */}
      {qrTable && (
        <div
          onClick={() => setQrTable(null)}
          className="fixed inset-0 bg-black/50 z-100 flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-3xl border border-gray-200 bg-white shadow-2xl p-8 text-center"
          >
            <h3 className="text-gray-900 font-bold text-xl mb-1">
              {qrTable.name}
            </h3>
            <p className="text-gray-600 text-sm mb-6">
              {/* Capacity: {qrTable.capacity} people · Scan to open menu */}
              Scan to open menu
            </p>
            <div className="bg-white rounded-2xl p-4 inline-block mb-6">
              <img
                src={qrUrl(qrTable._id)}
                alt={`QR for ${qrTable.name}`}
                width={200}
                height={200}
                className="rounded-xl"
                onError={(e) => {
                  // graceful fallback if the third-party QR service is unreachable (e.g. no internet)
                  e.target.style.display = "none";
                  e.target.nextSibling.style.display = "flex";
                }}
              />
              <div
                style={{ display: "none" }}
                className="w-50 h-50 items-center justify-center bg-gray-50 rounded-xl text-gray-400 text-sm"
              >
                QR needs internet connection
              </div>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-600 text-xs mb-4 break-all">
              {menuUrl(qrTable._id)}
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(menuUrl(qrTable._id));
                toast.success("Link copied!");
              }}
              className="w-full mb-4 py-2.5 border border-gray-200 bg-white hover:bg-gray-100 text-gray-900 rounded-xl font-semibold text-sm transition-all"
            >
              🔗 Copy Link
            </button>
            
            <div className="bg-blue-50 rounded-xl px-4 py-3 text-blue-600 text-xs text-left mb-6">
              💡 Print this QR and place it on {qrTable.name}. Customers scan to
              open the menu directly — no app needed.
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={handlePrintQr}
                className="flex flex-1 items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm hover:-translate-y-0.5 transition-all"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-4 h-4 shrink-0"
                >
                  <path d="M6 9V3h12v6M6 18h12v4H6zM4 9h16a2 2 0 012 2v6h-4M2 17v-6a2 2 0 012-2" />
                </svg>

                <span className="whitespace-nowrap">Print QR</span>
              </button>

              <button
                onClick={() => setQrTable(null)}
                className="flex-1 py-3 border border-gray-200 bg-white hover:bg-gray-100 text-gray-900 rounded-xl font-bold text-sm transition-all"
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
