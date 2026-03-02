const express = require("express");
const { getTemplates, createTemplate, updateTemplate, deleteTemplate } = require("../controllers/templateController");
const { protect, authorize } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

const router = express.Router();

router.get("/", getTemplates);
router.post("/", protect, authorize("admin"), upload.single("image"), createTemplate);
router.put("/:id", protect, authorize("admin"), upload.single("image"), updateTemplate);
router.delete("/:id", protect, authorize("admin"), deleteTemplate);

module.exports = router;
