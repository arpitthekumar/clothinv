const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function main() {
  const publicDir = path.join(__dirname, '..', 'public');
  const files = fs.readdirSync(publicDir);
  
  let convertedCount = 0;
  let removedCount = 0;

  for (const file of files) {
    if (file.endsWith('.jpg') || file.endsWith('.jpeg')) {
      const fullPath = path.join(publicDir, file);
      const webpName = file.replace(/\.(jpg|jpeg)$/, '.webp');
      const webpPath = path.join(publicDir, webpName);

      try {
        await sharp(fullPath).webp({ quality: 85 }).toFile(webpPath);
        console.log(`Converted: ${file} -> ${webpName}`);
        convertedCount++;

        fs.unlinkSync(fullPath);
        console.log(`Deleted original: ${file}`);
        removedCount++;
      } catch (err) {
        console.error(`Failed to convert ${file}:`, err);
      }
    }
  }

  console.log(`\nFinished! Converted ${convertedCount} JPG files to WEBP and removed ${removedCount} old JPG files.`);
}

main().catch(err => console.error(err));
