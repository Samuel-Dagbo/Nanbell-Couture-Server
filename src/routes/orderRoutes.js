const express = require("express");
const { createOrder, getOrders, updateOrderStatus, markTransactionCompleted } = require("../controllers/orderController");
const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();
router.get("/", protect, getOrders);
router.post("/", protect, createOrder);
router.patch("/:id/status", protect, authorize("admin"), updateOrderStatus);
router.patch("/:id/complete-transaction", protect, authorize("admin"), markTransactionCompleted);

module.exports = router;
