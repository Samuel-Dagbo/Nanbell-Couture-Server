const SiteContent = require("../models/SiteContent");
const { saveCompressedImage, saveImageFromUrl } = require("../utils/imageStorage");

const getOrCreateMainContent = async () => {
  let content = await SiteContent.findOne({ key: "main" });
  if (!content) {
    content = await SiteContent.create({ key: "main" });
  }
  return content;
};

const normalizeImagePath = (url = "") => String(url).replace(/\\/g, "/").trim();

const toImageList = (contentObj) => {
  const urls = Array.isArray(contentObj.founderImageUrls) ? contentObj.founderImageUrls.map(normalizeImagePath) : [];
  const legacy = contentObj.founderImageUrl ? [normalizeImagePath(contentObj.founderImageUrl)] : [];
  return [...new Set([...urls, ...legacy].filter(Boolean))];
};

const getSiteContent = async (_req, res) => {
  try {
    const content = await getOrCreateMainContent();
    const asObj = content.toObject();
    asObj.founderImageUrls = toImageList(asObj);
    return res.json(asObj);
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

    const currentImages = toImageList(content.toObject());

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

    if (typeof req.body.founderImageUrlsText === "string" && req.body.founderImageUrlsText.trim()) {
      const typedUrls = req.body.founderImageUrlsText
        .split(/\r?\n|,/)
        .map((url) => normalizeImagePath(url))
        .filter(Boolean);

      if (typedUrls.length > 0) {
        const imported = [];
        for (const url of typedUrls) {
          imported.push(await saveImageFromUrl(url, "site"));
        }
        const baseImages = updates.founderImageUrls || currentImages;
        updates.founderImageUrls = [...baseImages, ...imported];
      }
    }

    if (Array.isArray(req.files) && req.files.length > 0) {
      const uploadedImages = [];
      for (const file of req.files) {
        uploadedImages.push(await saveCompressedImage(file.buffer, "site"));
      }
      const baseImages = updates.founderImageUrls || currentImages;
      updates.founderImageUrls = [...baseImages, ...uploadedImages].map(normalizeImagePath);
    }

    if (Array.isArray(updates.founderImageUrls)) {
      updates.founderImageUrls = [...new Set(updates.founderImageUrls.map(normalizeImagePath).filter(Boolean))];
    }

    const updated = await SiteContent.findByIdAndUpdate(content._id, updates, { new: true });
    const asObj = updated.toObject();
    asObj.founderImageUrls = toImageList(asObj);
    return res.json(asObj);
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = { getSiteContent, updateSiteContent };
