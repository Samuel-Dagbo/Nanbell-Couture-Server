const ShopItem = require("../models/ShopItem");
const { saveCompressedImage, saveImageFromUrl } = require("../utils/imageStorage");

const isHttpUrl = (value = "") => /^https?:\/\//i.test(String(value).trim());

const getShopItems = async (_req, res) => {
  const items = await ShopItem.find().sort({ createdAt: -1 });
  res.json(items);
};

const createShopItem = async (req, res) => {
  try {
    const { name, description, imageUrl, price, available } = req.body;
    let resolvedImageUrl = "";
    if (req.file) {
      resolvedImageUrl = await saveCompressedImage(req.file.buffer, "shop");
    } else if (imageUrl) {
      const normalized = String(imageUrl).trim();
      if (isHttpUrl(normalized)) {
        try {
          resolvedImageUrl = await saveImageFromUrl(normalized, "shop");
        } catch (_e) {
          resolvedImageUrl = normalized;
        }
      } else {
        resolvedImageUrl = normalized;
      }
    }

    if (!name || !description || !resolvedImageUrl || price === undefined) {
      return res.status(400).json({ message: "name, description, image, price are required" });
    }

    const item = await ShopItem.create({
      name,
      description,
      imageUrl: resolvedImageUrl,
      price,
      available: available === undefined ? true : available === "true" || available === true
    });

    return res.status(201).json(item);
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

const updateShopItem = async (req, res) => {
  try {
    const updates = { ...req.body };
    if (req.file) updates.imageUrl = await saveCompressedImage(req.file.buffer, "shop");
    else if (typeof req.body.imageUrl === "string" && req.body.imageUrl.trim()) {
      const normalized = req.body.imageUrl.trim();
      if (isHttpUrl(normalized)) {
        try {
          updates.imageUrl = await saveImageFromUrl(normalized, "shop");
        } catch (_e) {
          updates.imageUrl = normalized;
        }
      } else {
        updates.imageUrl = normalized;
      }
    }
    if (updates.available !== undefined) updates.available = updates.available === "true" || updates.available === true;

    const item = await ShopItem.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!item) return res.status(404).json({ message: "Shop item not found" });
    return res.json(item);
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

const deleteShopItem = async (req, res) => {
  const item = await ShopItem.findByIdAndDelete(req.params.id);
  if (!item) return res.status(404).json({ message: "Shop item not found" });
  return res.json({ message: "Shop item deleted" });
};

module.exports = { getShopItems, createShopItem, updateShopItem, deleteShopItem };
