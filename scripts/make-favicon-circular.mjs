/**
 * Makes the favicon image circular by setting pixels outside the inscribed circle to transparent.
 * Usage: node scripts/make-favicon-circular.mjs
 */
import sharp from 'sharp';
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const inputPath = join(root, 'public', 'favicon.png');
const outputs = [
  join(root, 'public', 'favicon.png'),
  join(root, 'public', 'apple-touch-icon.png'),
  join(root, 'src', 'app', 'icon.png'),
];

if (!existsSync(inputPath)) {
  console.error('Input not found: public/favicon.png');
  process.exit(1);
}

const image = sharp(inputPath);
const meta = await image.metadata();
const { width: w, height: h, channels } = meta;
const hasAlpha = channels === 4;
const cx = w / 2;
const cy = h / 2;
const r = Math.min(w, h) / 2 - 0.5; // inset slightly so edge is clean
const rSq = r * r;

const { data } = await image
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });

// data is rgba, stride = 4 per pixel
for (let y = 0; y < h; y++) {
  for (let x = 0; x < w; x++) {
    const dx = x - cx;
    const dy = y - cy;
    if (dx * dx + dy * dy > rSq) {
      const i = (y * w + x) * 4;
      data[i + 3] = 0; // set alpha to 0
    }
  }
}

const circular = sharp(data, {
  raw: {
    width: w,
    height: h,
    channels: 4,
  },
})
  .png();

for (const out of outputs) {
  await circular.clone().toFile(out);
  console.log('Written:', out);
}
