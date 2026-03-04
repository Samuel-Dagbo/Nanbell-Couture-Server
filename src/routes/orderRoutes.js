const express = require("express");
const { createOrder, getOrders, updateOrderStatus, confirmOrder, cancelOrder, markTransactionCompleted } = require("../controllers/orderController");
const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();
router.get("/", protect, getOrders);
router.post("/", protect, createOrder);
router.patch("/:id/confirm", protect, authorize("admin"), confirmOrder);
router.patch("/:id/status", protect, authorize("admin"), updateOrderStatus);
router.patch("/:id/cancel", protect, authorize("customer"), cancelOrder);
router.patch("/:id/complete-transaction", protect, authorize("admin"), markTransactionCompleted);

module.exports = router;
