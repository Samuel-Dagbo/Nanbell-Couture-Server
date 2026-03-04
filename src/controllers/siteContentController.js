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
    if (typeof req.body.founderImageUrl === "string" && req.body.founderImageUrl.trim()) {
      updates.founderImageUrl = req.body.founderImageUrl.trim();
    }
    if (req.file) {
      updates.founderImageUrl = await saveCompressedImage(req.file.buffer, "site");
    }

    const updated = await SiteContent.findByIdAndUpdate(content._id, updates, { new: true });
    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = { getSiteContent, updateSiteContent };
