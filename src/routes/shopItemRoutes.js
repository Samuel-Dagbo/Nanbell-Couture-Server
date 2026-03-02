const express = require("express");
const { getShopItems, createShopItem, updateShopItem, deleteShopItem } = require("../controllers/shopItemController");
const { protect, authorize } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

const router = express.Router();

router.get("/", getShopItems);
router.post("/", protect, authorize("admin"), upload.single("image"), createShopItem);
router.put("/:id", protect, authorize("admin"), upload.single("image"), updateShopItem);
router.delete("/:id", protect, authorize("admin"), deleteShopItem);

module.exports = router;
