const ShopItem = require("../models/ShopItem");
const { saveCompressedImage } = require("../utils/imageStorage");

const getShopItems = async (_req, res) => {
  const items = await ShopItem.find().sort({ createdAt: -1 });
  res.json(items);
};

const createShopItem = async (req, res) => {
  try {
    const { name, description, imageUrl, price, available } = req.body;
    const resolvedImageUrl = req.file ? await saveCompressedImage(req.file.buffer, "shop") : imageUrl;

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
