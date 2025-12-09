#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..');

const sourcePath = path.join(projectRoot, 'public', 'icon-source.png');
const sizes = [16, 32, 48, 128];

// Check if source exists
if (!fs.existsSync(sourcePath)) {
  console.error('❌ Source icon not found at public/icon-source.png');
  console.log('\n📝 Please provide a source icon:');
  console.log('   1. Place a PNG file (512x512 or larger) at: public/icon-source.png');
  console.log('   2. Run: pnpm generate:icons');
  process.exit(1);
}

// Check if sharp is available
try {
  const sharp = await import('sharp');
  const sharpInstance = sharp.default;

  console.log('🎨 Generating icons from public/icon-source.png...\n');

  for (const size of sizes) {
    const outputPath = path.join(projectRoot, 'public', `icon-${size}.png`);

    await sharpInstance(sourcePath)
      .ensureAlpha()
      .resize(size, size, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .png({
        compressionLevel: 9,
        palette: false,
        quality: 100,
      })
      .toFile(outputPath);

    console.log(`✅ Generated icon-${size}.png`);
  }

  console.log('\n✨ All icons generated successfully!');
  console.log('📦 Icons are ready in public/ folder');
  console.log('🔧 Run `pnpm build` to include them in the extension');

} catch (error) {
  if (error.code === 'ERR_MODULE_NOT_FOUND') {
    console.error('❌ sharp is not installed');
    console.log('\n📦 Installing sharp...');

    const { execSync } = await import('child_process');
    execSync('pnpm add -D sharp', { stdio: 'inherit', cwd: projectRoot });

    console.log('\n✅ sharp installed! Please run the script again:');
    console.log('   pnpm generate:icons');
    process.exit(0);
  } else {
    console.error('❌ Error generating icons:', error.message);
    process.exit(1);
  }
}
