import { useState, useEffect, useRef } from "react";
import { getCategoriesApi, createCategoryApi, updateCategoryApi, deleteCategoryApi } from "../../api/categoryApi";
import toast from "react-hot-toast";

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({ name: "" });
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false); // ← new: covers both add and update
  const [deleteModal, setDeleteModal] = useState(null); // ← new: holds the category pending delete confirmation
  const [deleting, setDeleting] = useState(false); // ← new: loading state for the confirm-delete button

  const hasFetchedRef = useRef(false);

  useEffect(() => {
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const data = await getCategoriesApi();
      setCategories(data.categories || []);
    } catch {
      toast.error("Failed to load categories");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    if (saving) return; // ← guard against double-clicks
    setSaving(true);
    try {
      if (editing) {
        const data = await updateCategoryApi(editing, { name: form.name });
        setCategories((p) => p.map((c) => (c._id === editing ? data.category : c)));
        setEditing(null);
        toast.success("Category updated");
      } else {
        const data = await createCategoryApi({ name: form.name });
        setCategories((p) => [...p, data.category]);
        toast.success("Category added");
      }
      setForm({ name: "" });
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

  // ← replaces the old direct handleDelete — this just opens the confirmation modal
  const handleDeleteClick = (cat) => {
    setDeleteModal(cat);
  };

  // ← the actual delete, only runs after the user confirms in the modal
  const handleConfirmDelete = async () => {
    if (deleting) return;
    setDeleting(true);
    try {
      await deleteCategoryApi(deleteModal._id);
      setCategories((p) => p.filter((c) => c._id !== deleteModal._id));
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
        <div className="text-slate-400 text-sm animate-pulse">Loading categories...</div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">

      {/* Delete confirmation modal */}
      {deleteModal && (
        <div className="fixed inset-0 bg-black/80 z-100 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-3xl border border-red-500/20 bg-slate-800/95 p-6">
            <div className="text-center mb-5">
              <div className="text-4xl mb-3">⚠️</div>
              <h3 className="text-white font-bold text-lg">Delete Category?</h3>
              <p className="text-slate-400 text-xs mt-1">
                Are you sure you want to delete <span className="text-white font-semibold">"{deleteModal.name}"</span>? This cannot be undone.
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
        <h2 className="text-white font-bold text-2xl">Categories</h2>
        <p className="text-slate-400 text-sm mt-1">
          Organise your menu into sections · {categories.length} total
        </p>
      </div>

      {/* Form — name only, no image upload */}
      <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6">
        <h3 className="text-white font-bold text-base mb-4">
          {editing ? "Edit Category" : "Add New Category"}
        </h3>
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block text-slate-300 text-xs font-bold uppercase tracking-wide mb-2">
              Category Name
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ name: e.target.value })}
              placeholder="e.g. Starters, Main Course, Drinks"
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
              disabled={saving}
              className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-slate-400 outline-none focus:border-blue-500 focus:ring-0 focus:ring-blue-500 disabled:opacity-50"
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
                className="px-5 py-3 border border-white/20 bg-white/10 hover:bg-white/20 text-slate-300 rounded-xl font-bold text-sm transition-all disabled:opacity-50"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>

      {/* List — plain text rows */}
      <div className="space-y-2">
        {categories.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-10 text-center text-slate-400">
            <div className="font-semibold">No categories yet</div>
            <div className="text-sm mt-1">Add your first category above</div>
          </div>
        ) : (
          categories.map((cat) => (
            <div key={cat._id} className="flex items-center gap-4 p-4 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all">
              <div className="flex-1">
                <div className="text-white font-bold text-base">{cat.name}</div>
                <div className="text-slate-400 text-xs mt-0.5">
                  Added {new Date(cat.createdAt).toLocaleDateString("en-IN")}
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleEdit(cat)} className="px-4 py-2 rounded-xl border border-white/20 bg-white/10 hover:bg-white/20 text-slate-300 text-sm font-semibold transition-all">
                  Edit
                </button>
                <button onClick={() => handleDeleteClick(cat)} className="px-4 py-2 rounded-xl border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm font-semibold transition-all">
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

























// import { useState, useEffect, useRef } from "react";
// import { getCategoriesApi, createCategoryApi, updateCategoryApi, deleteCategoryApi } from "../../api/categoryApi";
// import toast from "react-hot-toast";

// export default function Categories() {
//   const [categories, setCategories] = useState([]);
//   const [form, setForm] = useState({ name: "" });
//   const [editing, setEditing] = useState(null);
//   const [loading, setLoading] = useState(true);

//   // inside the component, alongside your other refs/state:
// const hasFetchedRef = useRef(false);

//   // useEffect(() => {
//   //   fetchCategories();
//   // }, []);

//   useEffect(() => {
//   if (hasFetchedRef.current) return; // StrictMode's second mount hits this and stops
//   hasFetchedRef.current = true;
//   fetchCategories();
// }, []);

//   const fetchCategories = async () => {
//     try {
//       const data = await getCategoriesApi();
//       setCategories(data.categories || []);
//     } catch {
//       toast.error("Failed to load categories");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleSave = async () => {
//     if (!form.name.trim()) return;
//     try {
//       if (editing) {
//         const data = await updateCategoryApi(editing, { name: form.name });
//         setCategories((p) => p.map((c) => c._id === editing ? data.category : c));
//         setEditing(null);
//         toast.success("Category updated");
//       } else {
//         const data = await createCategoryApi({ name: form.name });
//         setCategories((p) => [...p, data.category]);
//         toast.success("Category added");
//       }
//       setForm({ name: "" });
//     } catch (error) {
//       toast.error(error.response?.data?.message || "Something went wrong");
//     }
//   };

//   const handleEdit = (cat) => {
//     setEditing(cat._id);
//     setForm({ name: cat.name });
//   };

//   const handleDelete = async (id) => {
//     try {
//       await deleteCategoryApi(id);
//       setCategories((p) => p.filter((c) => c._id !== id));
//       toast.success("Category deleted");
//     } catch (error) {
//       toast.error(error.response?.data?.message || "Cannot delete");
//     }
//   };

//   const handleCancel = () => {
//     setEditing(null);
//     setForm({ name: "" });
//   };

//   if (loading) return (
//     <div className="flex items-center justify-center h-64">
//       <div className="text-center">
//         <div className="text-slate-400 text-sm animate-pulse">Loading categories...</div>
//       </div>
//     </div>
//   );

//   return (
//     <div className="space-y-6">
//       <div>
//         <h2 className="text-white font-bold text-2xl">Categories</h2>
//         <p className="text-slate-400 text-sm mt-1">
//           Organise your menu into sections · {categories.length} total
//         </p>
//       </div>

//       {/* Form — name only, no image upload */}
//       <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6">
//         <h3 className="text-white font-bold text-base mb-4">
//           {editing ? "Edit Category" : "Add New Category"}
//         </h3>
//         <div className="flex gap-3">
//           <div className="flex-1">
//             <label className="block text-slate-300 text-xs font-bold uppercase tracking-wide mb-2">
//               Category Name
//             </label>
//             <input
//               type="text"
//               value={form.name}
//               onChange={(e) => setForm({ name: e.target.value })}
//               placeholder="e.g. Starters, Main Course, Drinks"
//               onKeyDown={(e) => e.key === "Enter" && handleSave()}
//               className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-slate-400 outline-none focus:border-blue-500 focus:ring-0 focus:ring-blue-500"
//             />
//           </div>
//           <div className="flex gap-2 self-end">
//             <button onClick={handleSave} className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm transition-all hover:-translate-y-0.5">
//               {editing ? "Update" : "Add"}
//             </button>
//             {editing && (
//               <button onClick={handleCancel} className="px-5 py-3 border border-white/20 bg-white/10 hover:bg-white/20 text-slate-300 rounded-xl font-bold text-sm transition-all">
//                 Cancel
//               </button>
//             )}
//           </div>
//         </div>
//       </div>

//       {/* List — plain text rows */}
//       <div className="space-y-2">
//         {categories.length === 0 ? (
//           <div className="rounded-2xl border border-white/10 bg-white/5 p-10 text-center text-slate-400">
//             <div className="font-semibold">No categories yet</div>
//             <div className="text-sm mt-1">Add your first category above</div>
//           </div>
//         ) : (
//           categories.map((cat) => (
//             <div key={cat._id} className="flex items-center gap-4 p-4 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all">
//               <div className="flex-1">
//                 <div className="text-white font-bold text-base">{cat.name}</div>
//                 <div className="text-slate-400 text-xs mt-0.5">
//                   Added {new Date(cat.createdAt).toLocaleDateString("en-IN")}
//                 </div>
//               </div>
//               <div className="flex gap-2">
//                 <button onClick={() => handleEdit(cat)} className="px-4 py-2 rounded-xl border border-white/20 bg-white/10 hover:bg-white/20 text-slate-300 text-sm font-semibold transition-all">
//                   Edit
//                 </button>
//                 <button onClick={() => handleDelete(cat._id)} className="px-4 py-2 rounded-xl border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm font-semibold transition-all">
//                   Delete
//                 </button>
//               </div>
//             </div>
//           ))
//         )}
//       </div>
//     </div>
//   );
// }