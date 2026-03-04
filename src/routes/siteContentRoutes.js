const express = require("express");
const { getSiteContent, updateSiteContent } = require("../controllers/siteContentController");
const { protect, authorize } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

const router = express.Router();

router.get("/", getSiteContent);
router.put("/", protect, authorize("admin"), upload.array("founderImages", 10), updateSiteContent);

module.exports = router;
