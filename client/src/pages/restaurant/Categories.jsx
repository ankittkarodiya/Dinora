// after kiosk
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getCategoriesApi, createCategoryApi, updateCategoryApi, deleteCategoryApi } from "../../api/categoryApi";
import toast from "react-hot-toast";
import { Pencil, Trash2 } from "lucide-react";

export default function Categories() {
  const queryClient = useQueryClient();

  const { data, isLoading: loading } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      try {
        const res = await getCategoriesApi();
        return res.categories || [];
      } catch {
        toast.error("Failed to load categories");
        throw new Error("Failed to load categories");
      }
    },
  });
  const categories = data || [];

  const [form, setForm] = useState({ name: "" });
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleteModal, setDeleteModal] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const handleSave = async () => {
    if (!form.name.trim()) return;
    if (saving) return;
    setSaving(true);
    const wasEditing = editing; // remember which category we were editing
    try {
      if (editing) {
        const data = await updateCategoryApi(editing, { name: form.name });
        queryClient.setQueryData(["categories"], (old) =>
          (old || []).map((c) => (c._id === editing ? data.category : c))
        );
        setEditing(null);
        toast.success("Category updated");
      } else {
        const data = await createCategoryApi({ name: form.name });
        queryClient.setQueryData(["categories"], (old) => [...(old || []), data.category]);
        toast.success("Category added");
      }
      setForm({ name: "" });
      // commenting out this to stop scrolling
      // Scroll back to the category that was just edited
      // if (wasEditing) {
      //   setTimeout(() => {
      //     const el = document.getElementById(`category-${wasEditing}`);
      //     if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
      //   }, 100);
      // }

    } catch (error) {
      toast.error(error.response?.data?.message || "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (cat) => {
    setEditing(cat._id);
    setForm({ name: cat.name });
  };

  const handleDeleteClick = (cat) => {
    setDeleteModal(cat);
  };

  const handleConfirmDelete = async () => {
    if (deleting) return;
    setDeleting(true);
    try {
      await deleteCategoryApi(deleteModal._id);
      queryClient.setQueryData(["categories"], (old) =>
        (old || []).filter((c) => c._id !== deleteModal._id)
      );
      toast.success("Category deleted");
      setDeleteModal(null);
    } catch (error) {
      toast.error(error.response?.data?.message || "Cannot delete");
    } finally {
      setDeleting(false);
    }
  };

  const handleCancel = () => {
    setEditing(null);
    setForm({ name: "" });
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <div className="text-gray-600 text-sm animate-pulse">Loading categories...</div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">

      {/* Delete confirmation modal */}
      {deleteModal && (
        <div className="fixed inset-0 bg-black/40 z-100 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-3xl border border-gray-200 bg-white shadow-2xl p-6">
            <div className="text-center mb-5">
              <div className="text-4xl mb-3">⚠️</div>
              <h3 className="text-gray-900 font-bold text-lg">Delete Category?</h3>
              <p className="text-gray-600 text-xs mt-1">
                Are you sure you want to delete <span className="text-gray-900 font-semibold">"{deleteModal.name}"</span>? This cannot be undone.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteModal(null)}
                disabled={deleting}
                className="flex-1 py-3 border border-gray-200 bg-gray-50 text-gray-900 rounded-xl font-bold text-sm disabled:opacity-50"
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

      <div>
        <h2 className="text-gray-900 font-bold text-2xl">Categories</h2>
        <p className="text-gray-600 text-sm mt-1">
          Organise your menu into sections · {categories.length} total
        </p>
      </div>

      {/* Form — name only, no image upload */}
      {/* <div className="rounded-2xl border border-gray-200 bg-white p-6"> */}


      {/* new to open a form and stop scrolling */}
      <div className={editing ? "fixed inset-0 z-100 bg-black/40 flex items-center justify-center p-4" : ""}>
      <div className={`rounded-2xl border border-gray-200 bg-white p-6 ${editing ? "w-full max-w-md shadow-2xl" : ""}`}>

        <h3 className="text-gray-900 font-bold text-base mb-4">
          {editing ? "Edit Category" : "Add New Category"}
        </h3>
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block text-gray-600 text-xs font-bold uppercase tracking-wide mb-2">
              Category Name
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ name: e.target.value })}
              placeholder="e.g. Starters, Main Course, Drinks"
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
              disabled={saving}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 placeholder-gray-400 outline-none focus:border-blue-600 disabled:opacity-50"
            />
          </div>
          <div className="flex gap-2 self-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >
              {saving ? (editing ? "Updating..." : "Adding...") : (editing ? "Update" : "Add")}
            </button>
            {editing && (
              <button
                onClick={handleCancel}
                disabled={saving}
                className="px-5 py-3 border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-900 rounded-xl font-bold text-sm transition-all disabled:opacity-50"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>
      </div>

      {/* List — plain text rows (no hover — rows are NOT clickable) */}
      <div className="space-y-2">
        {categories.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center text-gray-600">
            <div className="font-semibold">No categories yet</div>
            <div className="text-sm mt-1">Add your first category above</div>
          </div>
        ) : (
          categories.map((cat) => (
            <div key={cat._id} id={`category-${cat._id}`} className="flex items-center gap-4 p-4 rounded-2xl border border-gray-200 bg-white transition-all">
              <div className="flex-1">
                <div className="text-gray-900 font-bold text-base">{cat.name}</div>
                <div className="text-gray-600 text-xs mt-0.5">
                  Added {new Date(cat.createdAt).toLocaleDateString("en-IN")}
                </div>
              </div>
              <div className="flex gap-2">

                <button
                  onClick={() => handleEdit(cat)}
                  className="p-2 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-900 transition-all"
                  title="Edit"
                >
                  <Pencil size={18} />
                </button>

                <button
                  onClick={() => handleDeleteClick(cat)}
                  className="p-2 rounded-xl border border-red-500/30 bg-red-50 hover:bg-red-100 text-red-600 transition-all"
                  title="Delete"
                >
                  <Trash2 size={18} />
                </button>

              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
