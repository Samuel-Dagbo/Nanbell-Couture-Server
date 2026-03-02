const mongoose = require("mongoose");

const shopItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    imageUrl: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    available: { type: Boolean, default: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model("ShopItem", shopItemSchema);
