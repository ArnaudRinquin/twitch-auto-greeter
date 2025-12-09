# Extension Icons

## Quick Setup

1. **Add your source icon:**
   - Place a PNG file (512x512 or larger, square) at `public/icon-source.png`
   - Transparent background recommended

2. **Generate all sizes:**
   ```bash
   pnpm generate:icons
   ```

3. **Build extension:**
   ```bash
   pnpm build
   ```

## Generated Files

The script creates:
- `icon-16.png` - Toolbar icon (16x16)
- `icon-32.png` - Retina toolbar icon (32x32)
- `icon-48.png` - Extensions page icon (48x48)
- `icon-128.png` - Chrome Web Store icon (128x128)

## Requirements

- Source image format: PNG
- Recommended size: 512x512 or 1024x1024
- Aspect ratio: 1:1 (square)
- Background: Transparent preferred

The script automatically installs `sharp` if needed.
