const express = require("express");
const router = express.Router();
const { getUploadSignature } = require("../controllers/uploadController");
const { protect } = require("../middlewares/authMiddleware");
const { authorize } = require("../middlewares/roleMiddleware");

router.use(protect);
router.use(authorize("restaurant_admin"));

router.get("/signature", getUploadSignature);

module.exports = router;








// const express = require("express");
// const router = express.Router();
// const { getUploadSignature } = require("../controllers/uploadController");
// const { protect } = require("../middlewares/authMiddleware");
// const { authorize } = require("../middlewares/roleMiddleware");

// router.use(protect);
// router.use(authorize("restaurant_admin"));

// router.get("/signature", getUploadSignature);

// module.exports = router;