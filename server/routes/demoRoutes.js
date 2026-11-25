const express = require("express");
const router = express.Router();
const { createDemoRequest } = require("../controllers/demoController");
const { demoLimiter } = require("../middlewares/rateLimiter");

router.post("/", demoLimiter, createDemoRequest);

module.exports = router;