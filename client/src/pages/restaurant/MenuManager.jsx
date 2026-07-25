import { useState, useEffect, useRef } from "react";
import {
  getMenuItemsApi,
  createMenuItemApi,
  updateMenuItemApi,
  deleteMenuItemApi,
  toggleAvailabilityApi,
} from "../../api/menuItemApi";
import { getCategoriesApi } from "../../api/categoryApi";
import { uploadToCloudinary } from "../../utils/cloudinaryUpload";
import toast from "react-hot-toast";

import { optimizeImage } from "../../utils/imageOptimize";

const BLANK = {
  name: "",
  categoryId: "",
  price: "",
  isVeg: true,
  isAvailable: true,
  isBestseller: false,
  description: "",
  hasHalfFull: false, // ← new: local UI toggle, not sent to the backend directly
  halfPrice: "", // ← new: only meaningful when hasHalfFull is true
};

export default function MenuManager() {
  const fileInputRef = useRef(null);

  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(BLANK);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [removeExistingImage, setRemoveExistingImage] = useState(false);
  const [editing, setEditing] = useState(null);
  const [filterCat, setFilterCat] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false); // true only while the photo is going to Cloudinary
  const [saving, setSaving] = useState(false); // true while the item itself is being saved

  // for image upload
  const [openingPicker, setOpeningPicker] = useState(false);

  // delete alert
  // const [openingPicker, setOpeningPicker] = useState(false);
  const [deleteModal, setDeleteModal] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // useEffect(() => { fetchData(); }, []);

  const hasFetchedRef = useRef(false);

  useEffect(() => {
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [itemsData, catsData] = await Promise.all([
        getMenuItemsApi(),
        getCategoriesApi(),
      ]);
      setMenuItems(itemsData.items || []);
      setCategories(catsData.categories || []);
    } catch {
      toast.error("Failed to load menu");
    } finally {
      setLoading(false);
    }
  };

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  // ← new: toggling Half & Full pricing on pre-fills Half Price with roughly
  // half the current Full Price, purely as a starting point — it stays a
  // normal editable field, never auto-recalculated after this
  const toggleHalfFull = () => {
    setForm((p) => {
      const turningOn = !p.hasHalfFull;
      if (turningOn && !p.halfPrice && p.price) {
        const suggested = Math.round(Number(p.price) / 2);
        return { ...p, hasHalfFull: true, halfPrice: String(suggested) };
      }
      return { ...p, hasHalfFull: turningOn };
    });
  };

  // replace your existing upload box's onClick with this
  const handleUploadBoxClick = () => {
    if (openingPicker) return; // ← prevents rapid double-clicks from doing anything weird
    setOpeningPicker(true);
    fileInputRef.current?.click();
    // the native file dialog is a black box to JS — we can't know exactly when
    // it appears, so we just show the "opening" state briefly and then clear it,
    // which is enough to stop someone from clicking again in that first instant
    setTimeout(() => setOpeningPicker(false), 800);
  };

  const handleImageChange = (e) => {
    setOpeningPicker(false); // ← clear immediately once a file is actually selected

    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      toast.error("Image must be under 3MB");
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setRemoveExistingImage(false);
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setRemoveExistingImage(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.categoryId || !form.price) {
      toast.error("Name, category, and price are required");
      return;
    }
    if (form.hasHalfFull && !form.halfPrice) {
      toast.error("Enter a half price, or turn off Half & Full pricing");
      return;
    }

    const payload = {
      name: form.name,
      description: form.description,
      price: form.price,
      categoryId: form.categoryId,
      isVeg: form.isVeg,
      isAvailable: form.isAvailable,
      isBestseller: form.isBestseller,
      halfPrice: form.hasHalfFull ? form.halfPrice : null, // ← new
    };

    if (imageFile) {
      setUploading(true);
      try {
        payload.image = await uploadToCloudinary(
          imageFile,
          "tableturn/menu-items",
        );
      } catch {
        toast.error("Image upload failed. Try again.");
        setUploading(false);
        return;
      }
      setUploading(false);
    } else if (removeExistingImage) {
      payload.image = "";
    }

    setSaving(true);
    try {
      if (editing) {
        const data = await updateMenuItemApi(editing, payload);
        setMenuItems((p) => p.map((m) => (m._id === editing ? data.item : m)));
        toast.success("Item updated");
      } else {
        const data = await createMenuItemApi(payload);
        setMenuItems((p) => [...p, data.item]);
        toast.success("Item added");
      }
      handleCancel();
    } catch (error) {
      toast.error(error.response?.data?.message || "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (item) => {
    setEditing(item._id);
    setForm({
      name: item.name,
      description: item.description || "",
      price: String(item.price),
      categoryId: item.categoryId?._id || item.categoryId,
      isVeg: item.isVeg,
      isAvailable: item.isAvailable,
      isBestseller: item.isBestseller,
      hasHalfFull: !!item.halfPrice, // ← new
      halfPrice: item.halfPrice ? String(item.halfPrice) : "", // ← new
    });
    setImagePreview(item.image || null);
    setImageFile(null);
    setRemoveExistingImage(false);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancel = () => {
    setEditing(null);
    setForm(BLANK);
    setImageFile(null);
    setImagePreview(null);
    setRemoveExistingImage(false);
    setShowForm(false);
  };

  // const handleDelete = async (id) => {
  //   try {
  //     await deleteMenuItemApi(id);
  //     setMenuItems((p) => p.filter((m) => m._id !== id));
  //     toast.success("Item deleted");
  //   } catch {
  //     toast.error("Failed to delete");
  //   }
  // };

  // new handle deletes
  const handleDeleteClick = (item) => {
    setDeleteModal(item);
  };

  const handleConfirmDelete = async () => {
    if (deleting) return;
    setDeleting(true);
    try {
      await deleteMenuItemApi(deleteModal._id);
      setMenuItems((p) => p.filter((m) => m._id !== deleteModal._id));
      toast.success("Item deleted");
      setDeleteModal(null);
    } catch {
      toast.error("Failed to delete");
    } finally {
      setDeleting(false);
    }
  };

  const handleToggle = async (id) => {
    try {
      const data = await toggleAvailabilityApi(id);
      setMenuItems((p) => p.map((m) => (m._id === id ? data.item : m)));
    } catch {
      toast.error("Failed to toggle availability");
    }
  };

  const catName = (item) => {
    const catId = item.categoryId?._id || item.categoryId;
    return categories.find((c) => c._id === catId)?.name || "—";
  };

  const filtered =
    filterCat === "all"
      ? menuItems
      : menuItems.filter((m) => {
          const catId = m.categoryId?._id || m.categoryId;
          return catId === filterCat;
        });

  const busy = uploading || saving;
  const saveLabel = uploading
    ? "Uploading photo..."
    : saving
      ? editing
        ? "Updating item..."
        : "Adding item..."
      : editing
        ? "Update Item"
        : "Add Item";

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-400 text-sm animate-pulse">
          Loading menu...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">

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
            <h3 className="text-white font-bold text-lg">Delete Menu Item?</h3>
            <p className="text-slate-400 text-xs mt-1">
              Are you sure you want to delete <span className="text-white font-semibold">"{deleteModal.name}"</span>? This cannot be undone.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setDeleteModal(null)}
              disabled={deleting}
              className="flex-1 py-3 border border-white/20 bg-white/10 text-slate-300 rounded-xl font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmDelete}
              disabled={deleting}
              className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {deleting ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>
      </div>
    )}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-white font-bold text-2xl">Menu Items</h2>
          <p className="text-slate-400 text-sm mt-1">
            {menuItems.length} total items
          </p>
        </div>
        <button
          onClick={() => {
            setShowForm(!showForm);
            if (editing) handleCancel();
          }}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm transition-all hover:-translate-y-0.5"
        >
          {showForm && !editing ? "✕ Cancel" : "+ Add Item"}
        </button>
      </div>

      {showForm && (
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6 space-y-5">
          <h3 className="text-white font-bold text-base">
            {editing ? "Edit Item" : "New Menu Item"}
          </h3>

          <div className="flex items-center gap-4">
            {/* <div
              onClick={() => fileInputRef.current?.click()}
              className="relative w-32 h-32 rounded-xl border-2 border-dashed border-white/20 bg-white/5 hover:bg-white/10 hover:border-blue-500/50 transition-all cursor-pointer flex items-center justify-center overflow-hidden shrink-0"
            >
              {imagePreview ? (
                <>
                  <img src={imagePreview} alt="Preview" className="absolute inset-0 w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    <span className="text-white text-xs font-semibold">Change</span>
                  </div>
                </>
              ) : (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="1.5">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21,15 16,10 5,21" />
                </svg>
              )}
            </div> */}
            <div
              onClick={handleUploadBoxClick}
              className="relative w-32 h-32 rounded-xl border-2 border-dashed border-white/20 bg-white/5 hover:bg-white/10 hover:border-blue-500/50 transition-all cursor-pointer flex items-center justify-center overflow-hidden shrink-0"
            >
              {imagePreview ? (
                <>
                  <img
                    src={optimizeImage(imagePreview, 300)}
                    alt="Preview"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    <span className="text-white text-xs font-semibold">
                      {openingPicker ? "Opening..." : "Change"}
                    </span>
                  </div>
                </>
              ) : openingPicker ? (
                // ← brief loading state while the native file dialog is opening
                <div className="flex flex-col items-center gap-2">
                  <div className="w-5 h-5 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin" />
                  <span className="text-slate-400 text-[11px] font-medium">
                    Opening files...
                  </span>
                </div>
              ) : (
                // ← default resting state, now with clear call-to-action copy
                <div className="flex flex-col items-center gap-2 px-2 text-center">
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#64748B"
                    strokeWidth="1.5"
                  >
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21,15 16,10 5,21" />
                  </svg>
                  <span className="text-slate-400 text-[11px] font-semibold leading-tight">
                    Click to upload image
                  </span>
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
            <div className="text-slate-400 text-sm">
              <div className="font-semibold text-slate-300 mb-1">
                Upload a food photo
              </div>
              <div>JPG, PNG or WEBP</div>
              <div className="mt-2 text-xs text-slate-500">
                Recommended: 600×600 px, square, max 3MB
              </div>
              {imagePreview && (
                <button
                  onClick={handleRemoveImage}
                  className="mt-2 text-red-400 text-xs font-semibold hover:text-red-300"
                >
                  ✕ Remove photo
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 text-xs font-bold uppercase tracking-wide mb-2">
                Item Name *
              </label>
              <input
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="e.g. Butter Chicken"
                className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-slate-400 outline-none focus:border-blue-500 focus:ring-0 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-slate-300 text-xs font-bold uppercase tracking-wide mb-2">
                {form.hasHalfFull ? "Full Price (₹) *" : "Price (₹) *"}
              </label>
              <input
                type="number"
                value={form.price}
                onChange={(e) => set("price", e.target.value)}
                placeholder="e.g. 350"
                className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-slate-400 outline-none focus:border-blue-500 focus:ring-0 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* ← new: Half & Full pricing toggle, plus the conditional Half Price field */}
          <div>
            <label className="flex items-center gap-2 cursor-pointer mb-3">
              <div
                onClick={toggleHalfFull}
                className={`w-12 h-6 rounded-full relative transition-colors cursor-pointer ${form.hasHalfFull ? "bg-blue-500" : "bg-slate-600"}`}
              >
                <div
                  className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${form.hasHalfFull ? "translate-x-7" : "translate-x-1"}`}
                />
              </div>
              <span className="text-slate-300 text-sm font-semibold">
                This item has Half &amp; Full plate pricing
              </span>
            </label>

            {form.hasHalfFull && (
              <div>
                <label className="block text-slate-300 text-xs font-bold uppercase tracking-wide mb-2">
                  Half Price (₹) *
                </label>
                <input
                  type="number"
                  value={form.halfPrice}
                  onChange={(e) => set("halfPrice", e.target.value)}
                  placeholder="e.g. 200"
                  className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-slate-400 outline-none focus:border-blue-500 focus:ring-0 focus:ring-blue-500"
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-slate-300 text-xs font-bold uppercase tracking-wide mb-2">
              Category *
            </label>
            <select
              value={form.categoryId}
              onChange={(e) => set("categoryId", e.target.value)}
              className="w-full rounded-xl border border-white/20 bg-slate-800 px-4 py-3 text-white outline-none focus:border-blue-500 focus:ring-0 focus:ring-blue-500"
            >
              <option value="">Select a category</option>
              {categories.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-300 text-xs font-bold uppercase tracking-wide mb-2">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Short description of the dish"
              rows={2}
              className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-slate-400 outline-none focus:border-blue-500 focus:ring-0 focus:ring-blue-500 resize-none"
            />
          </div>

          <div className="flex flex-wrap gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <div
                onClick={() => set("isVeg", !form.isVeg)}
                className={`w-12 h-6 rounded-full relative transition-colors cursor-pointer ${form.isVeg ? "bg-green-500" : "bg-red-500"}`}
              >
                <div
                  className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${form.isVeg ? "translate-x-7" : "translate-x-1"}`}
                />
              </div>
              <span
                className={`text-sm font-semibold ${form.isVeg ? "text-green-400" : "text-red-400"}`}
              >
                {form.isVeg ? "Veg" : "Non-Veg"}
              </span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <div
                onClick={() => set("isAvailable", !form.isAvailable)}
                className={`w-12 h-6 rounded-full relative transition-colors cursor-pointer ${form.isAvailable ? "bg-blue-500" : "bg-slate-600"}`}
              >
                <div
                  className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${form.isAvailable ? "translate-x-7" : "translate-x-1"}`}
                />
              </div>
              <span className="text-slate-300 text-sm font-semibold">
                Available
              </span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <div
                onClick={() => set("isBestseller", !form.isBestseller)}
                className={`w-12 h-6 rounded-full relative transition-colors cursor-pointer ${form.isBestseller ? "bg-amber-500" : "bg-slate-600"}`}
              >
                <div
                  className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${form.isBestseller ? "translate-x-7" : "translate-x-1"}`}
                />
              </div>
              <span className="text-slate-300 text-sm font-semibold">
                Bestseller
              </span>
            </label>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={handleSave}
              disabled={busy}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saveLabel}
            </button>
            <button
              onClick={handleCancel}
              disabled={busy}
              className="px-6 py-3 border border-white/20 bg-white/10 hover:bg-white/20 text-slate-300 rounded-xl font-bold text-sm disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div
        className="flex gap-2 overflow-x-auto pb-1"
        style={{ scrollbarWidth: "none" }}
      >
        {[{ _id: "all", name: "All" }, ...categories].map((c) => (
          <button
            key={c._id}
            onClick={() => setFilterCat(c._id)}
            className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${filterCat === c._id ? "bg-blue-600 text-white" : "bg-white/10 text-slate-300 border border-white/10 hover:bg-white/20"}`}
          >
            {c.name}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-10 text-center text-slate-400">
            <div className="font-semibold">No items here</div>
            <div className="text-sm mt-1">Add your first menu item above</div>
          </div>
        ) : (
          filtered.map((item) => (
            <div
              key={item._id}
              className="flex items-center gap-4 p-4 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all"
            >
              <div className="w-16 h-16 rounded-xl overflow-hidden bg-white/10 shrink-0">
                {item.image ? (
                  <img
                    // src={item.image}
                    src={optimizeImage(item.image, 100)}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <svg
                      width="22"
                      height="22"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#64748B"
                      strokeWidth="1.5"
                    >
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <polyline points="21,15 16,10 5,21" />
                    </svg>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-white font-bold text-sm">
                    {item.name}
                  </span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-semibold ${item.isVeg ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}
                  >
                    {item.isVeg ? "Veg" : "Non-Veg"}
                  </span>
                  {item.isBestseller && (
                    <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-amber-500/20 text-amber-400">
                      Bestseller
                    </span>
                  )}
                </div>
                <div className="text-slate-400 text-xs mt-0.5">
                  {catName(item)} ·{" "}
                  {item.halfPrice ? (
                    <>₹{item.halfPrice} Half / ₹{item.price} Full</>
                  ) : (
                    <>₹{item.price}</>
                  )}
                </div>
                {item.description && (
                  <div className="text-slate-500 text-xs mt-0.5 truncate">
                    {item.description}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleToggle(item._id)}
                  className={`text-xs px-3 py-1.5 rounded-full font-bold border transition-all ${item.isAvailable ? "bg-green-500/20 border-green-500/30 text-green-400 hover:bg-green-500/30" : "bg-red-500/20 border-red-500/30 text-red-400 hover:bg-red-500/30"}`}
                >
                  {item.isAvailable ? "In Stock" : "Out of Stock"}
                </button>
                <button
                  onClick={() => handleEdit(item)}
                  className="px-3 py-1.5 rounded-xl border border-white/20 bg-white/10 hover:bg-white/20 text-slate-300 text-xs font-semibold"
                >
                  Edit
                </button>

                {/* <button
                  onClick={() => handleDelete(item._id)}
                  className="px-3 py-1.5 rounded-xl border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-semibold"
                >
                  Del
                </button> */}
                <button onClick={() => handleDeleteClick(item)} className="px-3 py-1.5 rounded-xl border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-semibold">Del</button>

              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}































// import { useState, useEffect, useRef } from "react";
// import {
//   getMenuItemsApi,
//   createMenuItemApi,
//   updateMenuItemApi,
//   deleteMenuItemApi,
//   toggleAvailabilityApi,
// } from "../../api/menuItemApi";
// import { getCategoriesApi } from "../../api/categoryApi";
// import { uploadToCloudinary } from "../../utils/cloudinaryUpload";
// import toast from "react-hot-toast";

// import { optimizeImage } from "../../utils/imageOptimize";

// const BLANK = {
//   name: "",
//   categoryId: "",
//   price: "",
//   isVeg: true,
//   isAvailable: true,
//   isBestseller: false,
//   description: "",
//   portionSize: "", // ← new: "", "half", or "full"
// };

// export default function MenuManager() {
//   const fileInputRef = useRef(null);

//   const [menuItems, setMenuItems] = useState([]);
//   const [categories, setCategories] = useState([]);
//   const [form, setForm] = useState(BLANK);
//   const [imageFile, setImageFile] = useState(null);
//   const [imagePreview, setImagePreview] = useState(null);
//   const [removeExistingImage, setRemoveExistingImage] = useState(false);
//   const [editing, setEditing] = useState(null);
//   const [filterCat, setFilterCat] = useState("all");
//   const [showForm, setShowForm] = useState(false);
//   const [loading, setLoading] = useState(true);
//   const [uploading, setUploading] = useState(false); // true only while the photo is going to Cloudinary
//   const [saving, setSaving] = useState(false); // true while the item itself is being saved

//   // for image upload
//   const [openingPicker, setOpeningPicker] = useState(false);

//   // delete alert
//   // const [openingPicker, setOpeningPicker] = useState(false);
//   const [deleteModal, setDeleteModal] = useState(null);
//   const [deleting, setDeleting] = useState(false);

//   // useEffect(() => { fetchData(); }, []);

//   const hasFetchedRef = useRef(false);

//   useEffect(() => {
//     if (hasFetchedRef.current) return;
//     hasFetchedRef.current = true;
//     fetchData();
//   }, []);

//   const fetchData = async () => {
//     try {
//       const [itemsData, catsData] = await Promise.all([
//         getMenuItemsApi(),
//         getCategoriesApi(),
//       ]);
//       setMenuItems(itemsData.items || []);
//       setCategories(catsData.categories || []);
//     } catch {
//       toast.error("Failed to load menu");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

//   // replace your existing upload box's onClick with this
//   const handleUploadBoxClick = () => {
//     if (openingPicker) return; // ← prevents rapid double-clicks from doing anything weird
//     setOpeningPicker(true);
//     fileInputRef.current?.click();
//     // the native file dialog is a black box to JS — we can't know exactly when
//     // it appears, so we just show the "opening" state briefly and then clear it,
//     // which is enough to stop someone from clicking again in that first instant
//     setTimeout(() => setOpeningPicker(false), 800);
//   };

//   const handleImageChange = (e) => {
//     setOpeningPicker(false); // ← clear immediately once a file is actually selected

//     const file = e.target.files[0];
//     if (!file) return;
//     if (file.size > 3 * 1024 * 1024) {
//       toast.error("Image must be under 3MB");
//       return;
//     }
//     setImageFile(file);
//     setImagePreview(URL.createObjectURL(file));
//     setRemoveExistingImage(false);
//   };

//   const handleRemoveImage = () => {
//     setImageFile(null);
//     setImagePreview(null);
//     setRemoveExistingImage(true);
//   };

//   const handleSave = async () => {
//     if (!form.name.trim() || !form.categoryId || !form.price) {
//       toast.error("Name, category, and price are required");
//       return;
//     }

//     const payload = {
//       name: form.name,
//       description: form.description,
//       price: form.price,
//       categoryId: form.categoryId,
//       isVeg: form.isVeg,
//       isAvailable: form.isAvailable,
//       isBestseller: form.isBestseller,
//       portionSize: form.portionSize, // ← new
//     };

//     if (imageFile) {
//       setUploading(true);
//       try {
//         payload.image = await uploadToCloudinary(
//           imageFile,
//           "tableturn/menu-items",
//         );
//       } catch {
//         toast.error("Image upload failed. Try again.");
//         setUploading(false);
//         return;
//       }
//       setUploading(false);
//     } else if (removeExistingImage) {
//       payload.image = "";
//     }

//     setSaving(true);
//     try {
//       if (editing) {
//         const data = await updateMenuItemApi(editing, payload);
//         setMenuItems((p) => p.map((m) => (m._id === editing ? data.item : m)));
//         toast.success("Item updated");
//       } else {
//         const data = await createMenuItemApi(payload);
//         setMenuItems((p) => [...p, data.item]);
//         toast.success("Item added");
//       }
//       handleCancel();
//     } catch (error) {
//       toast.error(error.response?.data?.message || "Something went wrong");
//     } finally {
//       setSaving(false);
//     }
//   };

//   const handleEdit = (item) => {
//     setEditing(item._id);
//     setForm({
//       name: item.name,
//       description: item.description || "",
//       price: String(item.price),
//       categoryId: item.categoryId?._id || item.categoryId,
//       isVeg: item.isVeg,
//       isAvailable: item.isAvailable,
//       isBestseller: item.isBestseller,
//       portionSize: item.portionSize || "", // ← new
//     });
//     setImagePreview(item.image || null);
//     setImageFile(null);
//     setRemoveExistingImage(false);
//     setShowForm(true);
//     window.scrollTo({ top: 0, behavior: "smooth" });
//   };

//   const handleCancel = () => {
//     setEditing(null);
//     setForm(BLANK);
//     setImageFile(null);
//     setImagePreview(null);
//     setRemoveExistingImage(false);
//     setShowForm(false);
//   };

//   // const handleDelete = async (id) => {
//   //   try {
//   //     await deleteMenuItemApi(id);
//   //     setMenuItems((p) => p.filter((m) => m._id !== id));
//   //     toast.success("Item deleted");
//   //   } catch {
//   //     toast.error("Failed to delete");
//   //   }
//   // };

//   // new handle deletes
//   const handleDeleteClick = (item) => {
//     setDeleteModal(item);
//   };

//   const handleConfirmDelete = async () => {
//     if (deleting) return;
//     setDeleting(true);
//     try {
//       await deleteMenuItemApi(deleteModal._id);
//       setMenuItems((p) => p.filter((m) => m._id !== deleteModal._id));
//       toast.success("Item deleted");
//       setDeleteModal(null);
//     } catch {
//       toast.error("Failed to delete");
//     } finally {
//       setDeleting(false);
//     }
//   };

//   const handleToggle = async (id) => {
//     try {
//       const data = await toggleAvailabilityApi(id);
//       setMenuItems((p) => p.map((m) => (m._id === id ? data.item : m)));
//     } catch {
//       toast.error("Failed to toggle availability");
//     }
//   };

//   const catName = (item) => {
//     const catId = item.categoryId?._id || item.categoryId;
//     return categories.find((c) => c._id === catId)?.name || "—";
//   };

//   const filtered =
//     filterCat === "all"
//       ? menuItems
//       : menuItems.filter((m) => {
//           const catId = m.categoryId?._id || m.categoryId;
//           return catId === filterCat;
//         });

//   const busy = uploading || saving;
//   const saveLabel = uploading
//     ? "Uploading photo..."
//     : saving
//       ? editing
//         ? "Updating item..."
//         : "Adding item..."
//       : editing
//         ? "Update Item"
//         : "Add Item";

//   if (loading) {
//     return (
//       <div className="flex items-center justify-center h-64">
//         <div className="text-slate-400 text-sm animate-pulse">
//           Loading menu...
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="space-y-6">

//       {deleteModal && (
//       <div
//         onClick={() => !deleting && setDeleteModal(null)}
//         className="fixed inset-0 bg-black/80 z-100 flex items-center justify-center p-4"
//       >
//         <div
//           onClick={(e) => e.stopPropagation()}
//           className="w-full max-w-md rounded-3xl border border-red-500/20 bg-slate-800/95 p-6"
//         >
//           <div className="text-center mb-5">
//             <div className="text-4xl mb-3">⚠️</div>
//             <h3 className="text-white font-bold text-lg">Delete Menu Item?</h3>
//             <p className="text-slate-400 text-xs mt-1">
//               Are you sure you want to delete <span className="text-white font-semibold">"{deleteModal.name}"</span>? This cannot be undone.
//             </p>
//           </div>
//           <div className="flex gap-3">
//             <button
//               onClick={() => setDeleteModal(null)}
//               disabled={deleting}
//               className="flex-1 py-3 border border-white/20 bg-white/10 text-slate-300 rounded-xl font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
//             >
//               Cancel
//             </button>
//             <button
//               onClick={handleConfirmDelete}
//               disabled={deleting}
//               className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
//             >
//               {deleting ? "Deleting..." : "Delete"}
//             </button>
//           </div>
//         </div>
//       </div>
//     )}

//       <div className="flex items-center justify-between">
//         <div>
//           <h2 className="text-white font-bold text-2xl">Menu Items</h2>
//           <p className="text-slate-400 text-sm mt-1">
//             {menuItems.length} total items
//           </p>
//         </div>
//         <button
//           onClick={() => {
//             setShowForm(!showForm);
//             if (editing) handleCancel();
//           }}
//           className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm transition-all hover:-translate-y-0.5"
//         >
//           {showForm && !editing ? "✕ Cancel" : "+ Add Item"}
//         </button>
//       </div>

//       {showForm && (
//         <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6 space-y-5">
//           <h3 className="text-white font-bold text-base">
//             {editing ? "Edit Item" : "New Menu Item"}
//           </h3>

//           <div className="flex items-center gap-4">
//             {/* <div
//               onClick={() => fileInputRef.current?.click()}
//               className="relative w-32 h-32 rounded-xl border-2 border-dashed border-white/20 bg-white/5 hover:bg-white/10 hover:border-blue-500/50 transition-all cursor-pointer flex items-center justify-center overflow-hidden shrink-0"
//             >
//               {imagePreview ? (
//                 <>
//                   <img src={imagePreview} alt="Preview" className="absolute inset-0 w-full h-full object-cover" />
//                   <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
//                     <span className="text-white text-xs font-semibold">Change</span>
//                   </div>
//                 </>
//               ) : (
//                 <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="1.5">
//                   <rect x="3" y="3" width="18" height="18" rx="2" />
//                   <circle cx="8.5" cy="8.5" r="1.5" />
//                   <polyline points="21,15 16,10 5,21" />
//                 </svg>
//               )}
//             </div> */}
//             <div
//               onClick={handleUploadBoxClick}
//               className="relative w-32 h-32 rounded-xl border-2 border-dashed border-white/20 bg-white/5 hover:bg-white/10 hover:border-blue-500/50 transition-all cursor-pointer flex items-center justify-center overflow-hidden shrink-0"
//             >
//               {imagePreview ? (
//                 <>
//                   <img
//                     // src={imagePreview}
//                     src={optimizeImage(imagePreview, 300)}
//                     alt="Preview"
//                     className="absolute inset-0 w-full h-full object-cover"
//                   />
//                   <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
//                     <span className="text-white text-xs font-semibold">
//                       {openingPicker ? "Opening..." : "Change"}
//                     </span>
//                   </div>
//                 </>
//               ) : openingPicker ? (
//                 // ← brief loading state while the native file dialog is opening
//                 <div className="flex flex-col items-center gap-2">
//                   <div className="w-5 h-5 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin" />
//                   <span className="text-slate-400 text-[11px] font-medium">
//                     Opening files...
//                   </span>
//                 </div>
//               ) : (
//                 // ← default resting state, now with clear call-to-action copy
//                 <div className="flex flex-col items-center gap-2 px-2 text-center">
//                   <svg
//                     width="24"
//                     height="24"
//                     viewBox="0 0 24 24"
//                     fill="none"
//                     stroke="#64748B"
//                     strokeWidth="1.5"
//                   >
//                     <rect x="3" y="3" width="18" height="18" rx="2" />
//                     <circle cx="8.5" cy="8.5" r="1.5" />
//                     <polyline points="21,15 16,10 5,21" />
//                   </svg>
//                   <span className="text-slate-400 text-[11px] font-semibold leading-tight">
//                     Click to upload image
//                   </span>
//                 </div>
//               )}
//             </div>
//             <input
//               ref={fileInputRef}
//               type="file"
//               accept="image/*"
//               onChange={handleImageChange}
//               className="hidden"
//             />

//             <input
//               ref={fileInputRef}
//               type="file"
//               accept="image/*"
//               onChange={handleImageChange}
//               className="hidden"
//             />
//             <div className="text-slate-400 text-sm">
//               <div className="font-semibold text-slate-300 mb-1">
//                 Upload a food photo
//               </div>
//               <div>JPG, PNG or WEBP</div>
//               <div className="mt-2 text-xs text-slate-500">
//                 Recommended: 600×600 px, square, max 3MB
//               </div>
//               {imagePreview && (
//                 <button
//                   onClick={handleRemoveImage}
//                   className="mt-2 text-red-400 text-xs font-semibold hover:text-red-300"
//                 >
//                   ✕ Remove photo
//                 </button>
//               )}
//             </div>
//           </div>

//           <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
//             <div>
//               <label className="block text-slate-300 text-xs font-bold uppercase tracking-wide mb-2">
//                 Item Name *
//               </label>
//               <input
//                 value={form.name}
//                 onChange={(e) => set("name", e.target.value)}
//                 placeholder="e.g. Butter Chicken"
//                 className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-slate-400 outline-none focus:border-blue-500 focus:ring-0 focus:ring-blue-500"
//               />
//             </div>
//             <div>
//               <label className="block text-slate-300 text-xs font-bold uppercase tracking-wide mb-2">
//                 Price (₹) *
//               </label>
//               <input
//                 type="number"
//                 value={form.price}
//                 onChange={(e) => set("price", e.target.value)}
//                 placeholder="e.g. 350"
//                 className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-slate-400 outline-none focus:border-blue-500 focus:ring-0 focus:ring-blue-500"
//               />
//             </div>
//           </div>

//           <div>
//             <label className="block text-slate-300 text-xs font-bold uppercase tracking-wide mb-2">
//               Category *
//             </label>
//             <select
//               value={form.categoryId}
//               onChange={(e) => set("categoryId", e.target.value)}
//               className="w-full rounded-xl border border-white/20 bg-slate-800 px-4 py-3 text-white outline-none focus:border-blue-500 focus:ring-0 focus:ring-blue-500"
//             >
//               <option value="">Select a category</option>
//               {categories.map((c) => (
//                 <option key={c._id} value={c._id}>
//                   {c.name}
//                 </option>
//               ))}
//             </select>
//           </div>

//           {/* new for portion size */}
//           {/* <div>
//   <label className="block text-slate-300 text-xs font-bold uppercase tracking-wide mb-2">
//     Portion Size <span className="text-slate-500 normal-case font-normal">(optional)</span>
//   </label>
//   <select
//     value={form.portionSize}
//     onChange={(e) => set("portionSize", e.target.value)}
//     className="w-full rounded-xl border border-white/20 bg-slate-800 px-4 py-3 text-white outline-none focus:border-blue-500 focus:ring-0 focus:ring-blue-500"
//   >
//     <option value="">Not applicable</option>
//     <option value="half">Half Plate</option>
//     <option value="full">Full Plate</option>
//   </select>
// </div> */}
//           <div>
//   <label className="flex items-center gap-2 cursor-pointer mb-2">
//     <div
//       onClick={() => set("hasHalfFull", !form.hasHalfFull)}
//       className={`w-12 h-6 rounded-full relative transition-colors cursor-pointer ${form.hasHalfFull ? "bg-blue-500" : "bg-slate-600"}`}
//     >
//       <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${form.hasHalfFull ? "translate-x-7" : "translate-x-1"}`} />
//     </div>
//     <span className="text-slate-300 text-sm font-semibold">This item has Half &amp; Full plate pricing</span>
//   </label>
// </div>

//           <div>
//             <label className="block text-slate-300 text-xs font-bold uppercase tracking-wide mb-2">
//               Description <span className="text-slate-500 normal-case font-normal">(optional)</span>
//             </label>
//             <textarea
//               value={form.description}
//               onChange={(e) => set("description", e.target.value)}
//               placeholder="Short description of the dish"
//               rows={2}
//               className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-slate-400 outline-none focus:border-blue-500 focus:ring-0 focus:ring-blue-500 resize-none"
//             />
//           </div>

//           <div className="flex flex-wrap gap-6">
//             <label className="flex items-center gap-2 cursor-pointer">
//               <div
//                 onClick={() => set("isVeg", !form.isVeg)}
//                 className={`w-12 h-6 rounded-full relative transition-colors cursor-pointer ${form.isVeg ? "bg-green-500" : "bg-red-500"}`}
//               >
//                 <div
//                   className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${form.isVeg ? "translate-x-7" : "translate-x-1"}`}
//                 />
//               </div>
//               <span
//                 className={`text-sm font-semibold ${form.isVeg ? "text-green-400" : "text-red-400"}`}
//               >
//                 {form.isVeg ? "Veg" : "Non-Veg"}
//               </span>
//             </label>
//             <label className="flex items-center gap-2 cursor-pointer">
//               <div
//                 onClick={() => set("isAvailable", !form.isAvailable)}
//                 className={`w-12 h-6 rounded-full relative transition-colors cursor-pointer ${form.isAvailable ? "bg-blue-500" : "bg-slate-600"}`}
//               >
//                 <div
//                   className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${form.isAvailable ? "translate-x-7" : "translate-x-1"}`}
//                 />
//               </div>
//               <span className="text-slate-300 text-sm font-semibold">
//                 Available
//               </span>
//             </label>
//             <label className="flex items-center gap-2 cursor-pointer">
//               <div
//                 onClick={() => set("isBestseller", !form.isBestseller)}
//                 className={`w-12 h-6 rounded-full relative transition-colors cursor-pointer ${form.isBestseller ? "bg-amber-500" : "bg-slate-600"}`}
//               >
//                 <div
//                   className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${form.isBestseller ? "translate-x-7" : "translate-x-1"}`}
//                 />
//               </div>
//               <span className="text-slate-300 text-sm font-semibold">
//                 Bestseller
//               </span>
//             </label>
//           </div>

//           <div className="flex gap-3 pt-2">
//             <button
//               onClick={handleSave}
//               disabled={busy}
//               className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
//             >
//               {saveLabel}
//             </button>
//             <button
//               onClick={handleCancel}
//               disabled={busy}
//               className="px-6 py-3 border border-white/20 bg-white/10 hover:bg-white/20 text-slate-300 rounded-xl font-bold text-sm disabled:opacity-50"
//             >
//               Cancel
//             </button>
//           </div>
//         </div>
//       )}

//       <div
//         className="flex gap-2 overflow-x-auto pb-1"
//         style={{ scrollbarWidth: "none" }}
//       >
//         {[{ _id: "all", name: "All" }, ...categories].map((c) => (
//           <button
//             key={c._id}
//             onClick={() => setFilterCat(c._id)}
//             className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${filterCat === c._id ? "bg-blue-600 text-white" : "bg-white/10 text-slate-300 border border-white/10 hover:bg-white/20"}`}
//           >
//             {c.name}
//           </button>
//         ))}
//       </div>

//       <div className="space-y-2">
//         {filtered.length === 0 ? (
//           <div className="rounded-2xl border border-white/10 bg-white/5 p-10 text-center text-slate-400">
//             <div className="font-semibold">No items here</div>
//             <div className="text-sm mt-1">Add your first menu item above</div>
//           </div>
//         ) : (
//           filtered.map((item) => (
//             <div
//               key={item._id}
//               className="flex items-center gap-4 p-4 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all"
//             >
//               <div className="w-16 h-16 rounded-xl overflow-hidden bg-white/10 shrink-0">
//                 {item.image ? (
//                   <img
//                     // src={item.image}
//                     src={optimizeImage(item.image, 100)}
//                     alt={item.name}
//                     className="w-full h-full object-cover"
//                   />
//                 ) : (
//                   <div className="w-full h-full flex items-center justify-center">
//                     <svg
//                       width="22"
//                       height="22"
//                       viewBox="0 0 24 24"
//                       fill="none"
//                       stroke="#64748B"
//                       strokeWidth="1.5"
//                     >
//                       <rect x="3" y="3" width="18" height="18" rx="2" />
//                       <circle cx="8.5" cy="8.5" r="1.5" />
//                       <polyline points="21,15 16,10 5,21" />
//                     </svg>
//                   </div>
//                 )}
//               </div>
//               <div className="flex-1 min-w-0">
//                 <div className="flex items-center gap-2 flex-wrap">
//                   <span className="text-white font-bold text-sm">
//                     {item.name}
//                   </span>
//                   <span
//                     className={`text-xs px-2 py-0.5 rounded-full font-semibold ${item.isVeg ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}
//                   >
//                     {item.isVeg ? "Veg" : "Non-Veg"}
//                   </span>
//                   {item.isBestseller && (
//                     <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-amber-500/20 text-amber-400">
//                       Bestseller
//                     </span>
//                   )}

//                   {/* new for portion size */}
//                   {item.portionSize && (
//   <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-blue-500/20 text-blue-400">
//     {item.portionSize === "half" ? "Half Plate" : "Full Plate"}
//   </span>
// )}


//                 </div>
//                 <div className="text-slate-400 text-xs mt-0.5">
//                   {catName(item)} · ₹{item.price}
//                 </div>
//                 {item.description && (
//                   <div className="text-slate-500 text-xs mt-0.5 truncate">
//                     {item.description}
//                   </div>
//                 )}
//               </div>
//               <div className="flex items-center gap-2 shrink-0">
//                 <button
//                   onClick={() => handleToggle(item._id)}
//                   className={`text-xs px-3 py-1.5 rounded-full font-bold border transition-all ${item.isAvailable ? "bg-green-500/20 border-green-500/30 text-green-400 hover:bg-green-500/30" : "bg-red-500/20 border-red-500/30 text-red-400 hover:bg-red-500/30"}`}
//                 >
//                   {item.isAvailable ? "In Stock" : "Out of Stock"}
//                 </button>
//                 <button
//                   onClick={() => handleEdit(item)}
//                   className="px-3 py-1.5 rounded-xl border border-white/20 bg-white/10 hover:bg-white/20 text-slate-300 text-xs font-semibold"
//                 >
//                   Edit
//                 </button>

//                 {/* <button
//                   onClick={() => handleDelete(item._id)}
//                   className="px-3 py-1.5 rounded-xl border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-semibold"
//                 >
//                   Del
//                 </button> */}
//                 <button onClick={() => handleDeleteClick(item)} className="px-3 py-1.5 rounded-xl border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-semibold">Del</button>

//               </div>
//             </div>
//           ))
//         )}
//       </div>
//     </div>
//   );
// }
