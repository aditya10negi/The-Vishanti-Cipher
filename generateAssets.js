const sharp = require('sharp');
const fs = require('fs');

if (!fs.existsSync('assets')) {
  fs.mkdirSync('assets');
}

const svgIcon = `
<svg width="256" height="256" viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
  <rect width="256" height="256" rx="50" fill="#07080f" />
  <circle cx="128" cy="128" r="110" stroke="#e5a93c" stroke-width="4" fill="none" opacity="0.8" />
  <circle cx="128" cy="128" r="90" stroke="#ffd23f" stroke-width="2" stroke-dasharray="8,6" fill="none" />
  <polygon points="128,38 218,128 128,218 38,128" stroke="#e5a93c" stroke-width="3" fill="none" opacity="0.9" />
  <polygon points="128,218 38,128 128,38 218,128" stroke="#00f0ff" stroke-width="2" fill="none" opacity="0.7" />
  <circle cx="128" cy="128" r="55" stroke="#00f0ff" stroke-width="3" fill="none" />
  <polygon points="128,73 175,155 81,155" stroke="#ffd23f" stroke-width="2" fill="rgba(229,169,60,0.2)" />
  <polygon points="128,183 81,101 175,101" stroke="#ffd23f" stroke-width="2" fill="rgba(0,240,255,0.1)" />
  <circle cx="128" cy="128" r="16" fill="#00f0ff" />
</svg>
`;

// Also generate sample lossless PNG host images for instant testing
async function generateSampleImages() {
  await sharp(Buffer.from(svgIcon))
    .png()
    .toFile('assets/icon.png');
  console.log('Created assets/icon.png');

  // Create a sample 600x400 high-detail mystical host PNG in assets/sample_host.png
  const width = 600, height = 400;
  const rawRgb = Buffer.alloc(width * height * 3);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 3;
      // Cosmic gradient with starry texture
      const r = Math.floor((x / width) * 40 + (y / height) * 60 + 10);
      const g = Math.floor((y / height) * 50 + 15);
      const b = Math.floor((1 - x / width) * 90 + 40);
      rawRgb[idx] = Math.min(255, r);
      rawRgb[idx + 1] = Math.min(255, g);
      rawRgb[idx + 2] = Math.min(255, b);
    }
  }

  await sharp(rawRgb, { raw: { width, height, channels: 3 } })
    .png({ compressionLevel: 9 })
    .toFile('assets/sample_host.png');
  console.log('Created assets/sample_host.png (600x400)');
}

generateSampleImages().catch(err => console.error(err));
