const express = require("express");
const router = express.Router();
const { getMyRestaurant, createRestaurant, updateRestaurant } = require("../controllers/restaurantController");
// const { getMyRestaurant, createRestaurant, updateRestaurant, uploadLogo } = require("../controllers/restaurantController");

const { protect } = require("../middlewares/authMiddleware");
const { authorize } = require("../middlewares/roleMiddleware");

// const { uploadRestaurantLogo } = require("../config/cloudinary");

router.use(protect);
router.use(authorize("restaurant_admin"));

router.get("/me", getMyRestaurant);
router.post("/", createRestaurant);
router.put("/", updateRestaurant);

// router.post("/logo", uploadRestaurantLogo.single("logo"), uploadLogo);

module.exports = router;



