const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    orderCode: { type: String, required: true, unique: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    template: { type: mongoose.Schema.Types.ObjectId, ref: "Template" },
    shopItem: { type: mongoose.Schema.Types.ObjectId, ref: "ShopItem" },
    dressType: { type: String, default: "" },
    orderType: { type: String, enum: ["custom", "shop"], required: true },
    quantity: { type: Number, default: 1, min: 1 },
    size: { type: String, default: "" },
    status: {
      type: String,
      enum: ["Not Started", "In Progress", "Almost Done", "Ready for Pickup"],
      default: "Not Started"
    },
    expectedCompletionDate: { type: Date, required: true },
    showEstimatedDate: { type: Boolean, default: true },
    transactionCompleted: { type: Boolean, default: false },
    completedAt: { type: Date, default: null },
    notes: { type: String, default: "" }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
