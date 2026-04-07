/**
 * Genera PNG cuadrados (RGBA) para prebuild si faltan assets referenciados en app.json.
 * Sin dependencias externas.
 */
import { createWriteStream, mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { deflateSync } from 'node:zlib';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const imagesDir = join(root, 'assets', 'images');

function crc32(buf) {
  let c = ~0 >>> 0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let j = 0; j < 8; j++) {
      c = (c >>> 1) ^ (0xed_b8_83_20 & -(c & 1));
    }
  }
  return (~c) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const typeData = Buffer.concat([typeBuf, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(typeData), 0);
  return Buffer.concat([len, typeData, crc]);
}

/** @param {[number,number,number,number]} rgba */
function makeSquarePng(size, rgba) {
  const [r, g, b, a] = rgba;
  const rawLen = size * (1 + size * 4);
  const raw = Buffer.alloc(rawLen);
  let o = 0;
  for (let y = 0; y < size; y++) {
    raw[o++] = 0;
    for (let x = 0; x < size; x++) {
      raw[o++] = r;
      raw[o++] = g;
      raw[o++] = b;
      raw[o++] = a;
    }
  }
  const compressed = deflateSync(raw);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr.writeUInt8(8, 8);
  ihdr.writeUInt8(6, 9);
  ihdr.writeUInt8(0, 10);
  ihdr.writeUInt8(0, 11);
  ihdr.writeUInt8(0, 12);
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', compressed), chunk('IEND', Buffer.alloc(0))]);
}

function writePng(path, size, rgba) {
  mkdirSync(dirname(path), { recursive: true });
  const png = makeSquarePng(size, rgba);
  return new Promise((resolve, reject) => {
    const ws = createWriteStream(path);
    ws.on('error', reject);
    ws.on('finish', resolve);
    ws.end(png);
  });
}

const iconSize = 1024;
const splashSize = 512;
const favSize = 48;

// Colores alineados con app.json (adaptive background #E6F4FE) y splash #0a0a0a
const fg = [10, 10, 10, 255];
const bgAdaptive = [230, 244, 254, 255];
await mkdirSync(imagesDir, { recursive: true });

const iconPath = join(imagesDir, 'icon.png');
if (!existsSync(iconPath)) {
  await writePng(iconPath, iconSize, fg);
}
const fgPath = join(imagesDir, 'android-icon-foreground.png');
if (!existsSync(fgPath)) {
  await writePng(fgPath, iconSize, fg);
}
const bgPath = join(imagesDir, 'android-icon-background.png');
if (!existsSync(bgPath)) {
  await writePng(bgPath, iconSize, bgAdaptive);
}
const monoPath = join(imagesDir, 'android-icon-monochrome.png');
if (!existsSync(monoPath)) {
  await writePng(monoPath, iconSize, [255, 255, 255, 255]);
}
const splashPath = join(imagesDir, 'splash-icon.png');
if (!existsSync(splashPath)) {
  await writePng(splashPath, splashSize, [230, 244, 254, 255]);
}
const favPath = join(imagesDir, 'favicon.png');
if (!existsSync(favPath)) {
  await writePng(favPath, favSize, fg);
}

console.log('Placeholder assets OK:', imagesDir);
