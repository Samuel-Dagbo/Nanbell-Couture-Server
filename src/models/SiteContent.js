const mongoose = require("mongoose");

const siteContentSchema = new mongoose.Schema(
  {
    key: { type: String, default: "main", unique: true },
    founderName: { type: String, default: "Face Behind Nanbell Couture" },
    founderBio: {
      type: String,
      default: "The creative force behind Nanbell Couture, dedicated to elegant and customer-focused fashion."
    },
    founderImageUrls: { type: [String], default: [] }
  },
  { timestamps: true }
);

module.exports = mongoose.model("SiteContent", siteContentSchema);
