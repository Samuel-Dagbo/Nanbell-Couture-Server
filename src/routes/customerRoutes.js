const express = require("express");
const { getCustomers, updateCustomer } = require("../controllers/customerController");
const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();
router.get("/", protect, authorize("admin"), getCustomers);
router.put("/:id", protect, authorize("admin"), updateCustomer);

module.exports = router;
