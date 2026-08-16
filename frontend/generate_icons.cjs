const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const svgPath = path.join(__dirname, 'public', 'logo.svg');
const out192 = path.join(__dirname, 'public', 'pwa-192x192.png');
const out512 = path.join(__dirname, 'public', 'pwa-512x512.png');

async function convert() {
  try {
    const svgBuffer = fs.readFileSync(svgPath);
    await sharp(svgBuffer).resize(192, 192).png().toFile(out192);
    await sharp(svgBuffer).resize(512, 512).png().toFile(out512);
    console.log('Successfully generated PWA PNG icons.');
  } catch (err) {
    console.error('Error generating icons:', err);
  }
}

convert();
