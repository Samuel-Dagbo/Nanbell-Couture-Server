const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const saveCompressedImage = async (fileBuffer, folder) => {
  const uploadDir = path.join(__dirname, "..", "..", "uploads", folder);
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const fileName = `${folder.replace(/\//g, "-")}-${Date.now()}-${Math.round(Math.random() * 1e6)}.jpg`;
  const outputPath = path.join(uploadDir, fileName);

  await sharp(fileBuffer)
    .rotate()
    .resize({ width: 1280, withoutEnlargement: true })
    .jpeg({ quality: 80, mozjpeg: true })
    .toFile(outputPath);

  return `/uploads/${folder}/${fileName}`;
};

const saveImageFromUrl = async (imageUrl, folder) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(imageUrl, {
      signal: controller.signal,
      headers: {
        "User-Agent": "NanbellCouture/1.0",
        Accept: "image/*,*/*;q=0.8"
      }
    });

    if (!response.ok) {
      throw new Error(`Unable to fetch image URL (${response.status})`);
    }

    const contentType = String(response.headers.get("content-type") || "").toLowerCase();
    if (!contentType.startsWith("image/")) {
      throw new Error("URL does not point to a direct image resource");
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    return saveCompressedImage(buffer, folder);
  } finally {
    clearTimeout(timeout);
  }
};

module.exports = { saveCompressedImage, saveImageFromUrl };
