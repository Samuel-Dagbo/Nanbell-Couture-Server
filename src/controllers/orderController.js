const Order = require("../models/Order");

const generateOrderCode = () => {
  const n = Math.floor(Math.random() * 9000) + 1000;
  return `ORD-${Date.now()}-${n}`;
};

const defaultDueDate = (days) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
};

const asBool = (value, fallback = true) => {
  if (value === undefined || value === null || value === "") return fallback;
  if (typeof value === "boolean") return value;
  return String(value).toLowerCase() === "true";
};

const createOrder = async (req, res) => {
  try {
    const { customer, template, shopItem, dressType, expectedCompletionDate, notes, quantity, size, showEstimatedDate } = req.body;
    const isAdmin = req.user.role === "admin";

    if (isAdmin) {
      if (!customer || !dressType || !expectedCompletionDate) {
        return res.status(400).json({ message: "customer, dressType, expectedCompletionDate are required for admin custom orders" });
      }

      const order = await Order.create({
        orderCode: generateOrderCode(),
        customer,
        template: template || null,
        dressType,
        orderType: "custom",
        quantity: Number(quantity) || 1,
        size: size || "",
        expectedCompletionDate,
        showEstimatedDate: asBool(showEstimatedDate, true),
        notes: notes || ""
      });

      const populated = await order.populate(["customer", "template", "shopItem"]);
      return res.status(201).json(populated);
    }

    if (!shopItem) {
      return res.status(400).json({ message: "shopItem is required for customer shop orders" });
    }

    const order = await Order.create({
      orderCode: generateOrderCode(),
      customer: req.user._id,
      shopItem,
      orderType: "shop",
      quantity: Number(quantity) || 1,
      size: size || "",
      expectedCompletionDate: expectedCompletionDate || defaultDueDate(2),
      showEstimatedDate: true,
      notes: notes || ""
    });

    const populated = await order.populate(["customer", "template", "shopItem"]);
    return res.status(201).json(populated);
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getOrders = async (req, res) => {
  const query = req.user.role === "customer" ? { customer: req.user._id } : {};
  const orders = await Order.find(query)
    .populate("customer", "fullName phone email")
    .populate("template")
    .populate("shopItem")
    .sort({ createdAt: -1 });
  res.json(orders);
};

const updateOrderStatus = async (req, res) => {
  const { status, expectedCompletionDate, showEstimatedDate } = req.body;
  const updates = {};
  if (status) updates.status = status;
  if (expectedCompletionDate) updates.expectedCompletionDate = expectedCompletionDate;
  if (showEstimatedDate !== undefined) updates.showEstimatedDate = asBool(showEstimatedDate, true);
  if (status && status !== "Ready for Pickup") {
    updates.transactionCompleted = false;
    updates.completedAt = null;
  }

  const order = await Order.findByIdAndUpdate(req.params.id, updates, { new: true })
    .populate("customer", "fullName phone email")
    .populate("template")
    .populate("shopItem");

  if (!order) return res.status(404).json({ message: "Order not found" });
  return res.json(order);
};

const markTransactionCompleted = async (req, res) => {
  const order = await Order.findByIdAndUpdate(
    req.params.id,
    { transactionCompleted: true, completedAt: new Date() },
    { new: true }
  )
    .populate("customer", "fullName phone email")
    .populate("template")
    .populate("shopItem");

  if (!order) return res.status(404).json({ message: "Order not found" });
  return res.json(order);
};

module.exports = { createOrder, getOrders, updateOrderStatus, markTransactionCompleted };
