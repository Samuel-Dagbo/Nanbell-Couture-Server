const SiteContent = require("../models/SiteContent");
const { saveCompressedImage } = require("../utils/imageStorage");

const getOrCreateMainContent = async () => {
  let content = await SiteContent.findOne({ key: "main" });
  if (!content) {
    content = await SiteContent.create({ key: "main" });
  }
  return content;
};

const getSiteContent = async (_req, res) => {
  try {
    const content = await getOrCreateMainContent();
    return res.json(content);
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

const updateSiteContent = async (req, res) => {
  try {
    const content = await getOrCreateMainContent();
    const updates = {};

    if (typeof req.body.founderName === "string") {
      updates.founderName = req.body.founderName.trim();
    }
    if (typeof req.body.founderBio === "string") {
      updates.founderBio = req.body.founderBio.trim();
    }

    const currentImages = Array.isArray(content.founderImageUrls) ? [...content.founderImageUrls] : [];

    if (typeof req.body.imagesToRemove === "string" && req.body.imagesToRemove.trim()) {
      let imagesToRemove = [];
      try {
        imagesToRemove = JSON.parse(req.body.imagesToRemove);
      } catch (_e) {
        imagesToRemove = [];
      }

      if (Array.isArray(imagesToRemove) && imagesToRemove.length > 0) {
        updates.founderImageUrls = currentImages.filter((url) => !imagesToRemove.includes(url));
      }
    }

    if (Array.isArray(req.files) && req.files.length > 0) {
      const uploadedImages = [];
      for (const file of req.files) {
        uploadedImages.push(await saveCompressedImage(file.buffer, "site"));
      }
      const baseImages = updates.founderImageUrls || currentImages;
      updates.founderImageUrls = [...baseImages, ...uploadedImages];
    }

    const updated = await SiteContent.findByIdAndUpdate(content._id, updates, { new: true });
    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = { getSiteContent, updateSiteContent };
