#!/usr/bin/env node
/**
 * og.mjs renders tools/og-template.html to the raster assets that a site
 * can't generate at runtime:
 *
 *   static/assets/og.png               1200×630 social share card
 *   static/assets/apple-touch-icon.png 180×180 home-screen icon (iOS)
 *   static/assets/icon-192.png         192×192 web app manifest
 *   static/assets/icon-512.png         512×512 web app manifest, install prompts
 *
 * The favicon stays SVG (`static/assets/favicon.svg`) and wants to stay vector.
 *
 * Uses Playwright if installed, otherwise connects directly via Chrome DevTools
 * Protocol to local Chromium (`CHROMIUM_PATH` or `/usr/bin/chromium`) with zero
 * heavy npm devDependencies required.
 */

import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { dirname, extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.woff2': 'font/woff2',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
};

const SHOTS = [
  ['#og', 'static/assets/og.png', '1200×630'],
  ['#touch-icon', 'static/assets/apple-touch-icon.png', '180×180'],
  ['#icon-192', 'static/assets/icon-192.png', '192×192'],
  ['#icon-512', 'static/assets/icon-512.png', '512×512'],
];

const server = createServer(async (request, response) => {
  try {
    const pathname = normalize(decodeURIComponent(new URL(request.url ?? '/', 'http://x').pathname));
    const rel = pathname.replace(/^\/+/, '');
    const candidates = [join(root, rel), join(root, 'static', rel)];

    for (const candidate of candidates) {
      if (!candidate.startsWith(root)) throw new Error('escape');
      if (existsSync(candidate)) {
        const body = await readFile(candidate);
        response.writeHead(200, { 'content-type': TYPES[extname(candidate)] ?? 'application/octet-stream' });
        response.end(body);
        return;
      }
    }
    response.writeHead(404).end('not found');
  } catch {
    response.writeHead(404).end('not found');
  }
});

await new Promise((done) => server.listen(0, '127.0.0.1', done));
const port = server.address().port;
const targetUrl = `http://127.0.0.1:${port}/tools/og-template.html`;

async function captureWithChromiumCdp() {
  const candidates = [
    process.env.CHROMIUM_PATH,
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/usr/bin/google-chrome',
  ].filter(Boolean);

  const browserBin = candidates.find((p) => existsSync(p));
  if (!browserBin) {
    throw new Error(
      'No Chromium binary found. Set CHROMIUM_PATH or install playwright chromium.'
    );
  }

  const profileDir = await mkdtemp(join(tmpdir(), 'macieira-og-'));
  const proc = spawn(
    browserBin,
    [
      '--headless=new',
      '--no-sandbox',
      '--disable-gpu',
      '--disable-dev-shm-usage',
      '--remote-debugging-port=0',
      `--user-data-dir=${profileDir}`,
      '--window-size=1280,800',
      'about:blank',
    ],
    { stdio: ['ignore', 'pipe', 'pipe'] }
  );

  const wsUrl = await new Promise((resolveWs, rejectWs) => {
    let stderr = '';
    const timeout = setTimeout(() => rejectWs(new Error(`Chromium CDP timeout: ${stderr}`)), 15000);
    proc.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
      const match = stderr.match(/DevTools listening on (ws:\/\/[^\s]+)/);
      if (match) {
        clearTimeout(timeout);
        resolveWs(match[1]);
      }
    });
    proc.once('exit', (code) => {
      clearTimeout(timeout);
      rejectWs(new Error(`Chromium exited (${code}): ${stderr}`));
    });
  });

  try {
    const versionRes = await fetch(wsUrl.replace(/^ws:/, 'http:').replace(/\/devtools\/browser\/.*$/, '/json/list'));
    const targets = await versionRes.json();
    const pageTarget = targets.find((t) => t.type === 'page') ?? targets[0];
    if (!pageTarget?.webSocketDebuggerUrl) {
      throw new Error('Could not find CDP page target');
    }

    const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
    await new Promise((res, rej) => {
      ws.addEventListener('open', res, { once: true });
      ws.addEventListener('error', rej, { once: true });
    });

    let seq = 0;
    const pending = new Map();
    const listeners = new Map();

    ws.addEventListener('message', (evt) => {
      const msg = JSON.parse(evt.data.toString());
      if (msg.id && pending.has(msg.id)) {
        const { resolve: res, reject: rej } = pending.get(msg.id);
        pending.delete(msg.id);
        if (msg.error) rej(new Error(msg.error.message));
        else res(msg.result);
      } else if (msg.method && listeners.has(msg.method)) {
        for (const fn of listeners.get(msg.method)) fn(msg.params);
      }
    });

    const send = (method, params = {}) =>
      new Promise((res, rej) => {
        const id = ++seq;
        pending.set(id, { resolve: res, reject: rej });
        ws.send(JSON.stringify({ id, method, params }));
      });

    const once = (method) =>
      new Promise((res) => {
        const list = listeners.get(method) ?? [];
        const wrapped = (params) => {
          listeners.set(
            method,
            (listeners.get(method) ?? []).filter((fn) => fn !== wrapped)
          );
          res(params);
        };
        list.push(wrapped);
        listeners.set(method, list);
      });

    await send('Page.enable');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 1280,
      height: 1500,
      deviceScaleFactor: 1,
      mobile: false,
    });

    const loaded = once('Page.loadEventFired');
    await send('Page.navigate', { url: targetUrl });
    await loaded;

    await send('Runtime.evaluate', {
      expression: 'document.fonts.ready.then(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))))',
      awaitPromise: true,
    });

    for (const [selector, file, size] of SHOTS) {
      const box = await send('Runtime.evaluate', {
        expression: `(() => {
          const el = document.querySelector(${JSON.stringify(selector)});
          if (!el) return null;
          el.scrollIntoView({ block: 'start', inline: 'start' });
          const r = el.getBoundingClientRect();
          return { x: r.x + window.scrollX, y: r.y + window.scrollY, width: r.width, height: r.height };
        })()`,
        returnByValue: true,
      });

      const rect = box.result?.value;
      if (!rect) throw new Error(`Missing element ${selector}`);

      const shot = await send('Page.captureScreenshot', {
        format: 'png',
        clip: {
          x: rect.x,
          y: rect.y,
          width: rect.width,
          height: rect.height,
          scale: 1,
        },
        captureBeyondViewport: true,
      });

      await writeFile(join(root, file), Buffer.from(shot.data, 'base64'));
      console.log(`  ${file.padEnd(36)}${size}`);
    }

    ws.close();
  } finally {
    proc.kill('SIGTERM');
    await rm(profileDir, { recursive: true, force: true }).catch(() => {});
  }
}

try {
  let usedPlaywright = false;
  try {
    const { chromium } = await import('playwright');
    const browser = await chromium.launch({
      executablePath: process.env.CHROMIUM_PATH || undefined,
    });
    const page = await browser.newPage({ viewport: { width: 1280, height: 1500 }, deviceScaleFactor: 1 });
    await page.goto(targetUrl, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);

    for (const [selector, file, size] of SHOTS) {
      await page.locator(selector).screenshot({ path: join(root, file) });
      console.log(`  ${file.padEnd(36)}${size}`);
    }
    await browser.close();
    usedPlaywright = true;
  } catch {
    if (usedPlaywright) throw new Error('Playwright failed after launch');
  }

  if (!usedPlaywright) {
    await captureWithChromiumCdp();
  }
} finally {
  server.close();
}
