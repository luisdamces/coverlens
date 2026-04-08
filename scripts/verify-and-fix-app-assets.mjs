/**
 * Valida PNG referenciados en app.json (expo-doctor rechaza .png que son JPEG por dentro).
 * Convierte JPEG→PNG con jpeg-js+pngjs si están instalados; en Windows usa PowerShell si no.
 */
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { platform } from 'node:os';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const imagesDir = join(root, 'assets', 'images');

function isJpeg(buf) {
  return buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
}

function isPng(buf) {
  return (
    buf.length >= 8 &&
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4e &&
    buf[3] === 0x47
  );
}

const targets = [
  'icon.png',
  'android-icon-foreground.png',
  'android-icon-background.png',
  'android-icon-monochrome.png',
  'splash-icon.png',
  'favicon.png',
];

function tryJpegToPng(buf) {
  const require = createRequire(import.meta.url);
  let decode;
  let PNG;
  try {
    decode = require('jpeg-js').decode;
    PNG = require('pngjs').PNG;
  } catch {
    return null;
  }
  const decoded = decode(buf, { useTArray: true });
  const png = new PNG({ width: decoded.width, height: decoded.height });
  png.data.set(decoded.data);
  return PNG.sync.write(png);
}

function tryPowershellConvert(absPath) {
  if (platform() !== 'win32') return false;
  const ps1 = join(__dirname, 'convert-image-to-png.ps1');
  if (!existsSync(ps1)) return false;
  try {
    execFileSync(
      'powershell.exe',
      ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', ps1, '-ImagePath', absPath],
      { stdio: 'inherit' }
    );
    return true;
  } catch {
    return false;
  }
}

function main() {
  mkdirSync(imagesDir, { recursive: true });
  const bad = [];
  let fixed = 0;

  for (const name of targets) {
    const abs = join(imagesDir, name);
    if (!existsSync(abs)) {
      console.warn('[verify-assets] Falta archivo:', name);
      bad.push(name);
      continue;
    }
    const fileBuf = readFileSync(abs);
    if (isPng(fileBuf)) {
      console.log('[verify-assets] OK PNG:', name);
      continue;
    }
    if (isJpeg(fileBuf)) {
      const out = tryJpegToPng(fileBuf);
      if (out) {
        writeFileSync(abs, out);
        console.log('[verify-assets] Reconvertido JPEG→PNG (jpeg-js):', name);
        fixed++;
      } else if (tryPowershellConvert(abs)) {
        const again = readFileSync(abs);
        if (isPng(again)) {
          console.log('[verify-assets] Reconvertido JPEG→PNG (PowerShell):', name);
          fixed++;
        } else {
          console.error('[verify-assets] PowerShell no produjo PNG válido:', name);
          bad.push(name);
        }
      } else {
        console.error(
          `[verify-assets] ${name} es JPEG con extensión .png. En Windows debería usarse scripts/convert-image-to-png.ps1; en otros SO: npm install jpeg-js pngjs.`
        );
        bad.push(name);
      }
      continue;
    }
    console.warn('[verify-assets] Formato no reconocido (ni PNG ni JPEG):', name);
    bad.push(name);
  }

  if (fixed) {
    console.log(
      '[verify-assets] Regenera mipmaps: npx expo prebuild --platform android (o expo run:android).'
    );
  }

  if (bad.length) {
    process.exitCode = 1;
  }
}

main();
