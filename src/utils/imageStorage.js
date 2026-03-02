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

module.exports = { saveCompressedImage };
