#!/usr/bin/env node
/**
 * og.mjs — renders tools/og-template.html to the raster assets that a static
 * site can't generate at runtime:
 *
 *   assets/og.png               1200×630 social share card
 *   assets/apple-touch-icon.png 180×180 home-screen icon (iOS)
 *   assets/icon-192.png         192×192 web app manifest
 *   assets/icon-512.png         512×512 web app manifest, install prompts
 *
 * The favicon stays SVG and is not generated here — it is the one mark that
 * wants to stay vector.
 *
 * Both are committed, so this only needs running when the artwork changes:
 *
 *     npx playwright@latest install chromium   # once
 *     node tools/og.mjs
 *
 * Playwright is deliberately NOT a dependency of this project — it is a
 * ~300 MB toolchain for two PNGs that change once a year.
 */

import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.woff2': 'font/woff2',
  '.svg': 'image/svg+xml',
};

// The template pulls in the real stylesheet and fonts, so it has to be served
// over http rather than opened as a file: URL.
const server = createServer(async (request, response) => {
  try {
    const path = join(root, normalize(decodeURIComponent(new URL(request.url, 'http://x').pathname)));
    if (!path.startsWith(root)) throw new Error('escape');
    const body = await readFile(path);
    response.writeHead(200, { 'content-type': TYPES[extname(path)] ?? 'application/octet-stream' });
    response.end(body);
  } catch {
    response.writeHead(404).end('not found');
  }
});

await new Promise((done) => server.listen(4322, done));

const { chromium } = await import('playwright');
// CHROMIUM_PATH lets this run against a browser that is already on the
// machine instead of a Playwright-managed download.
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || undefined,
});
const page = await browser.newPage({ viewport: { width: 1200, height: 700 }, deviceScaleFactor: 1 });

await page.goto('http://localhost:4322/tools/og-template.html', { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);

const shots = [
  ['#og', 'assets/og.png', '1200×630'],
  ['#touch-icon', 'assets/apple-touch-icon.png', '180×180'],
  ['#icon-192', 'assets/icon-192.png', '192×192'],
  ['#icon-512', 'assets/icon-512.png', '512×512'],
];

for (const [selector, file, size] of shots) {
  await page.locator(selector).screenshot({ path: join(root, file) });
  console.log(`  ${file.padEnd(28)}${size}`);
}

await browser.close();
server.close();
