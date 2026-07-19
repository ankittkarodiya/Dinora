import { useState, useEffect, useRef } from "react";
import { getCategoriesApi, createCategoryApi, updateCategoryApi, deleteCategoryApi } from "../../api/categoryApi";
import toast from "react-hot-toast";

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({ name: "" });
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);

  // inside the component, alongside your other refs/state:
const hasFetchedRef = useRef(false);

  // useEffect(() => {
  //   fetchCategories();
  // }, []);

  useEffect(() => {
  if (hasFetchedRef.current) return; // StrictMode's second mount hits this and stops
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
    try {
      if (editing) {
        const data = await updateCategoryApi(editing, { name: form.name });
        setCategories((p) => p.map((c) => c._id === editing ? data.category : c));
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
    }
  };

  const handleEdit = (cat) => {
    setEditing(cat._id);
    setForm({ name: cat.name });
  };

  const handleDelete = async (id) => {
    try {
      await deleteCategoryApi(id);
      setCategories((p) => p.filter((c) => c._id !== id));
      toast.success("Category deleted");
    } catch (error) {
      toast.error(error.response?.data?.message || "Cannot delete");
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
              className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-slate-400 outline-none focus:border-blue-500 focus:ring-0 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-2 self-end">
            <button onClick={handleSave} className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm transition-all hover:-translate-y-0.5">
              {editing ? "Update" : "Add"}
            </button>
            {editing && (
              <button onClick={handleCancel} className="px-5 py-3 border border-white/20 bg-white/10 hover:bg-white/20 text-slate-300 rounded-xl font-bold text-sm transition-all">
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
                <button onClick={() => handleDelete(cat._id)} className="px-4 py-2 rounded-xl border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm font-semibold transition-all">
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

























// import { useState, useEffect } from "react";
// import { getCategoriesApi, createCategoryApi, updateCategoryApi, deleteCategoryApi } from "../../api/categoryApi";
// import toast from "react-hot-toast";

// // const EMOJIS = ["🥗", "🍛", "🫓", "🥤", "🍮", "🍚", "🍖", "🥘", "🫕", "🧆", "🍜", "🥩", "🍣", "🍕", "🥪"];

// export default function Categories() {
//   const [categories, setCategories] = useState([]);
//   const [form, setForm] = useState({ name: "", emoji: "🍽️" });
//   const [editing, setEditing] = useState(null);
//   const [loading, setLoading] = useState(true);

//   const [imageFile, setImageFile] = useState(null);
//   const [imagePreview, setImagePreview] = useState(null);

//   const handleImageChange = (e) => {
//   const file = e.target.files[0];
//   if (!file) return;
//   setImageFile(file);
//   setImagePreview(URL.createObjectURL(file));
//   };


//   useEffect(() => {
//     fetchCategories();
//   }, []);

//   const fetchCategories = async () => {
//     try {
//       const data = await getCategoriesApi();
//       setCategories(data.categories || []);
//     } catch (error) {
//       toast.error("Failed to load categories");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleSave = async () => {
//     if (!form.name.trim()) return;
//     try {
//       if (editing) {
//         const data = await updateCategoryApi(editing, form);
//         setCategories((p) => p.map((c) => c._id === editing ? data.category : c));
//         setEditing(null);
//         toast.success("Category updated");
//       } else {
//         const data = await createCategoryApi(form);
//         setCategories((p) => [...p, data.category]);
//         toast.success("Category added");
//       }
//       setForm({ name: "", emoji: "🍽️" });
//     } catch (error) {
//       toast.error(error.response?.data?.message || "Something went wrong");
//     }
//   };

//   const handleEdit = (cat) => {
//     setEditing(cat._id);
//     setForm({ name: cat.name, emoji: cat.emoji });
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

//   if (loading) return (
//     <div className="flex items-center justify-center h-64">
//       <div className="text-center">
//         <div className="text-4xl mb-4 animate-pulse">📁</div>
//         <div className="text-slate-400 text-sm">Loading categories...</div>
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

//       {/* Form */}
//       <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6">
//         <h3 className="text-white font-bold text-base mb-5">
//           {editing ? "Edit Category" : "Add New Category"}
//         </h3>

//         {/* <div className="mb-4">
//           <label className="block text-slate-300 text-xs font-bold uppercase tracking-wide mb-2">
//             Choose Emoji
//           </label>
//           <div className="flex flex-wrap gap-2">
//             {EMOJIS.map((e) => (
//               <button
//                 key={e}
//                 onClick={() => setForm((p) => ({ ...p, emoji: e }))}
//                 className={`text-xl p-2 rounded-xl transition-all ${
//                   form.emoji === e
//                     ? "bg-blue-600 ring-2 ring-blue-400"
//                     : "bg-white/10 hover:bg-white/20 border border-white/10"
//                 }`}
//               >
//                 {e}
//               </button>
//             ))}
//           </div>
//         </div> */}
//         {/* imge upload */}
//         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

//   {/* Image upload box */}
//   <div>
//     <label className="block text-slate-300 text-xs font-bold uppercase tracking-wide mb-2">
//       Category Image
//     </label>
//     <div
//       onClick={() => document.getElementById("cat-image-input").click()}
//       className="relative h-40 rounded-xl border-2 border-dashed border-white/20 bg-white/5 hover:bg-white/10 hover:border-blue-500/50 transition-all cursor-pointer flex items-center justify-center overflow-hidden"
//     >
//       {imagePreview ? (
//         <>
//           <img src={imagePreview} alt="Preview" className="absolute inset-0 w-full h-full object-cover rounded-xl" />
//           <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity rounded-xl">
//             <span className="text-white text-sm font-semibold">Change Image</span>
//           </div>
//         </>
//       ) : (
//         <div className="text-center px-4">
//           <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="1.5" className="mx-auto mb-2">
//             <rect x="3" y="3" width="18" height="18" rx="2" />
//             <circle cx="8.5" cy="8.5" r="1.5" />
//             <polyline points="21,15 16,10 5,21" />
//           </svg>
//           <div className="text-slate-400 text-sm">Click to upload image</div>
//         </div>
//       )}
//     </div>
//     <input id="cat-image-input" type="file" accept="image/*" onChange={handleImageChange} className="hidden" />

//     {/* ✅ Guidance text */}
//     <p className="text-slate-500 text-xs mt-2 text-center">
//       Recommended: 400×400 px, square, JPG or PNG, under 2MB
//     </p>
//   </div>

//   {/* Name input + buttons */}
//   <div className="flex flex-col justify-between">
//     <div>
//       <label className="block text-slate-300 text-xs font-bold uppercase tracking-wide mb-2">
//         Category Name *
//       </label>
//       <input
//         type="text"
//         value={form.name}
//         onChange={(e) => setForm({ name: e.target.value })}
//         placeholder="e.g. Starters, Main Course, Drinks"
//         onKeyDown={(e) => e.key === "Enter" && handleSave()}
//         className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
//       />
//     </div>
//     <div className="flex gap-2 mt-4">
//       <button onClick={handleSave} className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm">
//         {editing ? "Update" : "Add Category"}
//       </button>
//       {editing && (
//         <button onClick={handleCancel} className="px-5 py-3 border border-white/20 bg-white/10 hover:bg-white/20 text-slate-300 rounded-xl font-bold text-sm">
//           Cancel
//         </button>
//       )}
//     </div>
//   </div>
// </div>

//         <div className="flex gap-3">
//           <div className="flex-1">
//             <label className="block text-slate-300 text-xs font-bold uppercase tracking-wide mb-2">
//               Category Name
//             </label>
//             <input
//               type="text"
//               value={form.name}
//               onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
//               placeholder="e.g. Starters, Main Course, Drinks"
//               onKeyDown={(e) => e.key === "Enter" && handleSave()}
//               className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
//             />
//           </div>
//           <div className="flex gap-2 self-end">
//             <button
//               onClick={handleSave}
//               className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm transition-all hover:-translate-y-0.5"
//             >
//               {editing ? "Update" : "Add"}
//             </button>
//             {editing && (
//               <button
//                 onClick={() => { setEditing(null); setForm({ name: "", emoji: "🍽️" }); }}
//                 className="px-5 py-3 border border-white/20 bg-white/10 hover:bg-white/20 text-slate-300 rounded-xl font-bold text-sm transition-all"
//               >
//                 Cancel
//               </button>
//             )}
//           </div>
//         </div>
//       </div>

//       {/* List */}
//       <div className="space-y-2">
//         {categories.length === 0 ? (
//           <div className="rounded-2xl border border-white/10 bg-white/5 p-10 text-center text-slate-400">
//             <div className="text-4xl mb-3">📁</div>
//             <div className="font-semibold">No categories yet</div>
//             <div className="text-sm mt-1">Add your first category above</div>
//           </div>
//         ) : (
//           categories.map((cat) => (
//             <div
//               key={cat._id}
//               className="flex items-center gap-4 p-4 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all"
//             >
//               <span className="text-3xl">{cat.emoji}</span>
//               <div className="flex-1">
//                 <div className="text-white font-bold text-base">{cat.name}</div>
//                 <div className="text-slate-400 text-xs mt-0.5">
//                   Added {new Date(cat.createdAt).toLocaleDateString("en-IN")}
//                 </div>
//               </div>
//               <div className="flex gap-2">
//                 <button
//                   onClick={() => handleEdit(cat)}
//                   className="px-4 py-2 rounded-xl border border-white/20 bg-white/10 hover:bg-white/20 text-slate-300 text-sm font-semibold transition-all"
//                 >
//                   Edit
//                 </button>
//                 <button
//                   onClick={() => handleDelete(cat._id)}
//                   className="px-4 py-2 rounded-xl border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm font-semibold transition-all"
//                 >
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