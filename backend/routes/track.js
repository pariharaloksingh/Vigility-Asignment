const express = require("express");
const router = express.Router();

const trackController = require("../controllers/trackController");
const authMiddleware = require("../middleware/authMiddleware");


router.post("/", authMiddleware, trackController.trackFeature);

module.exports = router;