const express = require("express");
const router = express.Router();
const { getCategories, createCategory, updateCategory, deleteCategory } = require("../controllers/categoryController");
const { protect } = require("../middlewares/authMiddleware");
const { authorize } = require("../middlewares/roleMiddleware");

const { checkSubscription } = require("../middlewares/checkSubscription");

router.use(protect);
router.use(authorize("restaurant_admin"));
router.use(checkSubscription); // ← add this after authorize

router.get("/", getCategories);
router.post("/", createCategory);
router.put("/:id", updateCategory);
router.delete("/:id", deleteCategory);

module.exports = router;