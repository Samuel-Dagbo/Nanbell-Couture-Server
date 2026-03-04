const Template = require("../models/Template");
const { saveCompressedImage, saveImageFromUrl } = require("../utils/imageStorage");

const getTemplates = async (_req, res) => {
  const templates = await Template.find().sort({ createdAt: -1 });
  res.json(templates);
};

const createTemplate = async (req, res) => {
  try {
    const { name, description, imageUrl } = req.body;
    let resolvedImageUrl = "";
    if (req.file) resolvedImageUrl = await saveCompressedImage(req.file.buffer, "templates");
    else if (imageUrl) resolvedImageUrl = await saveImageFromUrl(imageUrl, "templates");

    if (!name || !description || !resolvedImageUrl) {
      return res.status(400).json({ message: "name, description, image are required" });
    }

    const template = await Template.create({ name, description, imageUrl: resolvedImageUrl });
    return res.status(201).json(template);
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

const updateTemplate = async (req, res) => {
  try {
    const updates = { ...req.body };
    if (req.file) updates.imageUrl = await saveCompressedImage(req.file.buffer, "templates");
    else if (typeof req.body.imageUrl === "string" && req.body.imageUrl.trim()) {
      updates.imageUrl = await saveImageFromUrl(req.body.imageUrl.trim(), "templates");
    }

    const template = await Template.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!template) return res.status(404).json({ message: "Template not found" });
    return res.json(template);
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

const deleteTemplate = async (req, res) => {
  const template = await Template.findByIdAndDelete(req.params.id);
  if (!template) return res.status(404).json({ message: "Template not found" });
  return res.json({ message: "Template deleted" });
};

module.exports = { getTemplates, createTemplate, updateTemplate, deleteTemplate };
