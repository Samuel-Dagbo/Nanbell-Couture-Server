const Order = require("../models/Order");
const { sendEmail } = require("../utils/email");

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

const editableStatuses = ["Not Started", "In Progress", "Almost Done", "Ready for Pickup"];
const cancellableStatuses = ["Pending Confirmation", "Not Started"];

const getOrderItemName = (order) =>
  order.orderType === "shop"
    ? order.shopItem?.name || "Shop item"
    : order.dressType || order.template?.name || "Custom dress";

const sendOrderPlacedEmail = async (order) => {
  if (!order.customer?.email) return;
  const itemName = getOrderItemName(order);
  sendEmail({
    to: order.customer.email,
    subject: `Order received (${order.orderCode})`,
    text: `Hi ${order.customer.fullName}, your order for "${itemName}" has been received. Current status: ${order.status}.`
  });
};

const sendOrderStatusEmail = async (order) => {
  if (!order.customer?.email) return;
  const itemName = getOrderItemName(order);
  sendEmail({
    to: order.customer.email,
    subject: `Order update (${order.orderCode})`,
    text: `Hi ${order.customer.fullName}, your order "${itemName}" is now "${order.status}".`
  });
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
        status: "Not Started",
        adminConfirmed: true,
        confirmedAt: new Date(),
        expectedCompletionDate,
        showEstimatedDate: asBool(showEstimatedDate, true),
        notes: notes || ""
      });

      const populated = await order.populate([
        { path: "customer", select: "fullName phone email" },
        { path: "template" },
        { path: "shopItem" }
      ]);
      await sendOrderPlacedEmail(populated);
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
      status: "Pending Confirmation",
      adminConfirmed: false,
      confirmedAt: null,
      expectedCompletionDate: expectedCompletionDate || defaultDueDate(2),
      showEstimatedDate: true,
      notes: notes || ""
    });

    const populated = await order.populate([
      { path: "customer", select: "fullName phone email" },
      { path: "template" },
      { path: "shopItem" }
    ]);
    await sendOrderPlacedEmail(populated);
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

  const order = await Order.findById(req.params.id)
    .populate("customer", "fullName phone email")
    .populate("template")
    .populate("shopItem");

  if (!order) return res.status(404).json({ message: "Order not found" });
  if (order.status === "Cancelled") return res.status(400).json({ message: "Cancelled order cannot be updated" });
  if (order.transactionCompleted) return res.status(400).json({ message: "Transaction already completed" });
  if (order.adminConfirmed === false) return res.status(400).json({ message: "Confirm this order first before updating status" });

  if (status && !editableStatuses.includes(status)) {
    return res.status(400).json({ message: "Invalid status transition" });
  }

  if (status) order.status = status;
  if (expectedCompletionDate) order.expectedCompletionDate = expectedCompletionDate;
  if (showEstimatedDate !== undefined) order.showEstimatedDate = asBool(showEstimatedDate, true);

  if (status && status !== "Ready for Pickup") {
    order.transactionCompleted = false;
    order.completedAt = null;
  }

  await order.save();
  await sendOrderStatusEmail(order);
  return res.json(order);
};

const confirmOrder = async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate("customer", "fullName phone email")
    .populate("template")
    .populate("shopItem");

  if (!order) return res.status(404).json({ message: "Order not found" });
  if (order.status === "Cancelled") return res.status(400).json({ message: "Cancelled order cannot be confirmed" });
  if (order.adminConfirmed !== false) return res.json(order);

  order.adminConfirmed = true;
  order.confirmedAt = new Date();
  if (order.status === "Pending Confirmation") order.status = "Not Started";

  await order.save();
  await sendOrderStatusEmail(order);
  return res.json(order);
};

const cancelOrder = async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate("customer", "fullName phone email")
    .populate("template")
    .populate("shopItem");

  if (!order) return res.status(404).json({ message: "Order not found" });
  if (String(order.customer?._id || order.customer) !== String(req.user._id)) {
    return res.status(403).json({ message: "You can only cancel your own orders" });
  }
  if (order.transactionCompleted) return res.status(400).json({ message: "Completed transaction cannot be cancelled" });
  if (order.status === "Cancelled") return res.status(400).json({ message: "Order is already cancelled" });
  if (!cancellableStatuses.includes(order.status)) {
    return res.status(400).json({ message: "This order can no longer be cancelled" });
  }

  order.status = "Cancelled";
  order.cancelledAt = new Date();
  order.transactionCompleted = false;
  order.completedAt = null;
  await order.save();

  await sendOrderStatusEmail(order);
  return res.json(order);
};

const markTransactionCompleted = async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate("customer", "fullName phone email")
    .populate("template")
    .populate("shopItem");

  if (!order) return res.status(404).json({ message: "Order not found" });
  if (order.adminConfirmed === false) return res.status(400).json({ message: "Confirm this order first" });
  if (order.status !== "Ready for Pickup") return res.status(400).json({ message: "Only ready-for-pickup orders can be completed" });
  if (order.status === "Cancelled") return res.status(400).json({ message: "Cancelled order cannot be completed" });

  order.transactionCompleted = true;
  order.completedAt = new Date();
  await order.save();

  await sendOrderStatusEmail({ ...order.toObject(), status: "Transaction Completed" });
  return res.json(order);
};

module.exports = { createOrder, getOrders, updateOrderStatus, confirmOrder, cancelOrder, markTransactionCompleted };
