const User = require("../models/User");

const getCustomers = async (req, res) => {
  const search = req.query.search || "";
  const regex = new RegExp(search, "i");
  const customers = await User.find({ role: "customer", $or: [{ fullName: regex }, { phone: regex }] })
    .select("-password")
    .sort({ createdAt: -1 });
  res.json(customers);
};

const updateCustomer = async (req, res) => {
  const customer = await User.findOneAndUpdate(
    { _id: req.params.id, role: "customer" },
    { fullName: req.body.fullName, phone: req.body.phone, email: req.body.email },
    { new: true }
  ).select("-password");

  if (!customer) return res.status(404).json({ message: "Customer not found" });
  return res.json(customer);
};

module.exports = { getCustomers, updateCustomer };
