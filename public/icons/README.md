# PWA Icons

This directory should contain the following PWA icons:

- `icon-192.png` - 192x192px icon
- `icon-512.png` - 512x512px icon

## To Generate Icons

You can use one of the following tools:

1. **PWA Asset Generator**: https://www.pwabuilder.com/imageGenerator
2. **Favicon.io**: https://favicon.io/
3. **RealFaviconGenerator**: https://realfavicongenerator.net/

## Design Guidelines

- Use the SIGA branding colors (blue #3b82f6)
- Ensure the icon is clear at both 192px and 512px sizes
- Use a simple, recognizable design (e.g., "SIGA" text or school/education symbol)
- Make sure the icon works on both light and dark backgrounds

## Temporary Placeholder

For development purposes, you can create temporary placeholder icons using ImageMagick:

```bash
# Install ImageMagick first (brew install imagemagick on macOS)
convert -size 192x192 xc:#3b82f6 -gravity center -pointsize 48 -fill white -annotate +0+0 "SIGA" icon-192.png
convert -size 512x512 xc:#3b82f6 -gravity center -pointsize 128 -fill white -annotate +0+0 "SIGA" icon-512.png
```
