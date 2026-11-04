const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function convertPngToWebp(dirPath) {
  if (!fs.existsSync(dirPath)) return;
  const files = fs.readdirSync(dirPath);
  for (const file of files) {
    const fullPath = path.join(dirPath, file);
    const stat = fs.statSync(fullPath);
    if (stat.isFile() && file.endsWith('.png')) {
      const webpPath = fullPath.replace(/\.png$/, '.webp');
      try {
        await sharp(fullPath).webp({ quality: 90 }).toFile(webpPath);
        console.log(`Converted ${file} -> ${path.basename(webpPath)}`);
      } catch (e) {
        console.warn(`Skipping ${file}: ${e.message}`);
      }
    }
  }
}

async function main() {
  const publicDir = path.join(__dirname, '..', 'public');
  const iconsDir = path.join(publicDir, 'icons');
  
  await convertPngToWebp(publicDir);
  await convertPngToWebp(iconsDir);
  const roundedPath = path.join(iconsDir, 'icon512_rounded.png');
  if (fs.existsSync(roundedPath)) {
    await sharp(roundedPath).resize(192, 192).webp({ quality: 90 }).toFile(path.join(iconsDir, 'icon-192.webp'));
    await sharp(roundedPath).resize(512, 512).webp({ quality: 90 }).toFile(path.join(iconsDir, 'icon-512.webp'));
    console.log('Generated icon-192.webp and icon-512.webp successfully!');
  }
  console.log('Done converting all PNG icons to WEBP!');
}

main().catch(err => console.error(err));
