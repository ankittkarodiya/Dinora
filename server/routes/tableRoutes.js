const express = require("express");
const router = express.Router();
const { getTables, createTable, deleteTable } = require("../controllers/tableController");
const { protect } = require("../middlewares/authMiddleware");
const { authorize } = require("../middlewares/roleMiddleware");

const { checkSubscription } = require("../middlewares/checkSubscription");


router.use(protect);
router.use(authorize("restaurant_admin"));
router.use(checkSubscription); // ← add this after authorize ← must run before createTable to attach req.planLimits

router.get("/", getTables);
router.post("/", createTable);
router.delete("/:id", deleteTable);

module.exports = router;