const express = require("express");
const { getSiteContent, updateSiteContent } = require("../controllers/siteContentController");
const { protect, authorize } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

const router = express.Router();

router.get("/", getSiteContent);
router.put("/", protect, authorize("admin"), upload.single("founderImage"), updateSiteContent);

module.exports = router;
