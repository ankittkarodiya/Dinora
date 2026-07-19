import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  restaurant: { name: "Spice Garden", slug: "spice-garden" },
  tables: [
    { id: "t1", name: "Table 1", capacity: 4 },
    { id: "t2", name: "Table 2", capacity: 2 },
    { id: "t3", name: "Table 3", capacity: 6 },
  ],
  categories: [
    { id: "c1", name: "Starters", emoji: "🥗" },
    { id: "c2", name: "Main Course", emoji: "🍛" },
    { id: "c3", name: "Breads", emoji: "🫓" },
    { id: "c4", name: "Drinks", emoji: "🥤" },
    { id: "c5", name: "Desserts", emoji: "🍮" },
  ],
  menuItems: [
    { id: "m1", name: "Paneer Tikka", categoryId: "c1", price: 280, isVeg: true, isAvailable: true, isBestseller: true, description: "Soft cottage cheese marinated in spiced yogurt, grilled in tandoor. Served with mint chutney." },
    { id: "m2", name: "Chicken Seekh Kebab", categoryId: "c1", price: 320, isVeg: false, isAvailable: true, isBestseller: true, description: "Minced chicken with aromatic spices on skewers, grilled over charcoal." },
    { id: "m3", name: "Veg Spring Rolls", categoryId: "c1", price: 180, isVeg: true, isAvailable: true, isBestseller: false, description: "Crispy rolls stuffed with seasoned vegetables and glass noodles." },
    { id: "m4", name: "Butter Chicken", categoryId: "c2", price: 380, isVeg: false, isAvailable: true, isBestseller: true, description: "Tender chicken in rich, creamy tomato-based sauce. Our most loved dish." },
    { id: "m5", name: "Palak Paneer", categoryId: "c2", price: 300, isVeg: true, isAvailable: true, isBestseller: false, description: "Fresh cottage cheese cubes in smooth, spiced spinach gravy." },
    { id: "m6", name: "Dal Makhani", categoryId: "c2", price: 260, isVeg: true, isAvailable: false, isBestseller: false, description: "Black lentils slow cooked overnight with butter and cream." },
    { id: "m7", name: "Mutton Rogan Josh", categoryId: "c2", price: 450, isVeg: false, isAvailable: true, isBestseller: true, description: "Slow cooked mutton in Kashmiri spices. Rich, aromatic and fall-off-the-bone tender." },
    { id: "m8", name: "Butter Naan", categoryId: "c3", price: 50, isVeg: true, isAvailable: true, isBestseller: true, description: "Soft leavened bread baked in tandoor, brushed with butter." },
    { id: "m9", name: "Laccha Paratha", categoryId: "c3", price: 60, isVeg: true, isAvailable: true, isBestseller: false, description: "Flaky whole wheat layered bread." },
    { id: "m10", name: "Chicken Biryani", categoryId: "c2", price: 380, isVeg: false, isAvailable: true, isBestseller: true, description: "Fragrant basmati rice layered with spiced chicken, saffron and caramelized onions." },
    { id: "m11", name: "Gulab Jamun", categoryId: "c5", price: 120, isVeg: true, isAvailable: true, isBestseller: false, description: "Soft milk solid dumplings soaked in rose flavored sugar syrup. Served warm." },
    { id: "m12", name: "Mango Lassi", categoryId: "c4", price: 120, isVeg: true, isAvailable: true, isBestseller: true, description: "Chilled yogurt blended with fresh Alphonso mango pulp." },
    { id: "m13", name: "Masala Chai", categoryId: "c4", price: 60, isVeg: true, isAvailable: true, isBestseller: false, description: "Aromatic spiced tea brewed with ginger, cardamom and fresh milk." },
  ],
};

const menuSlice = createSlice({
  name: "menu",
  initialState,
  reducers: {
    // Admin will use these when restaurant admin page is built
    addCategory: (state, action) => { state.categories.push(action.payload); },
    updateCategory: (state, action) => {
      const i = state.categories.findIndex((c) => c.id === action.payload.id);
      if (i !== -1) state.categories[i] = action.payload;
    },
    deleteCategory: (state, action) => {
      state.categories = state.categories.filter((c) => c.id !== action.payload);
    },
    addMenuItem: (state, action) => { state.menuItems.push(action.payload); },
    updateMenuItem: (state, action) => {
      const i = state.menuItems.findIndex((m) => m.id === action.payload.id);
      if (i !== -1) state.menuItems[i] = action.payload;
    },
    deleteMenuItem: (state, action) => {
      state.menuItems = state.menuItems.filter((m) => m.id !== action.payload);
    },
    toggleAvailability: (state, action) => {
      const item = state.menuItems.find((m) => m.id === action.payload);
      if (item) item.isAvailable = !item.isAvailable;
    },
    addTable: (state, action) => { state.tables.push(action.payload); },
    deleteTable: (state, action) => {
      state.tables = state.tables.filter((t) => t.id !== action.payload);
    },
  },
});

export const {
  addCategory, updateCategory, deleteCategory,
  addMenuItem, updateMenuItem, deleteMenuItem,
  toggleAvailability, addTable, deleteTable,
} = menuSlice.actions;

export default menuSlice.reducer;