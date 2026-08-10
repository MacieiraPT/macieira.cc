#!/usr/bin/env node
/**
 * og.mjs — renders tools/og-template.html to the two raster assets that a
 * static site can't generate at runtime:
 *
 *   assets/og.png               1200×630 social share card
 *   assets/apple-touch-icon.png 180×180 home-screen icon
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

await page.locator('#og').screenshot({ path: join(root, 'assets/og.png') });
await page.locator('#touch-icon').screenshot({ path: join(root, 'assets/apple-touch-icon.png') });

console.log('  assets/og.png                1200×630');
console.log('  assets/apple-touch-icon.png   180×180');

await browser.close();
server.close();
