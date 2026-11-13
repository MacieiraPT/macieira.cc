import { json, type RequestHandler } from '@sveltejs/kit';
import { env as cfEnv } from 'cloudflare:workers';

const KV_KEY = 'apple:picks';
const CACHE_PATH = '/api/apple/__state';
const NO_STORE = { 'Cache-Control': 'no-store' };

type CounterBackend = 'kv' | 'edge-cache' | 'ephemeral';

interface AppleCounterPayload {
  count: number;
  backend: CounterBackend;
}

// Fallback counter when neither Cloudflare KV nor Cache API is present (e.g. local Vite SSR)
let ephemeralCount = 0;

interface KVNamespaceBinding {
  get(key: string): Promise<string | null>;
  put(key: string, value: string): Promise<void>;
}

function getKvNamespace(): KVNamespaceBinding | undefined {
  try {
    const candidate = cfEnv?.APPLE_KV as KVNamespaceBinding | undefined;
    if (candidate && typeof candidate.get === 'function' && typeof candidate.put === 'function') {
      return candidate;
    }
  } catch {
    /* non-worker or unbound environment */
  }
  return undefined;
}

function getEdgeCache(): Cache | undefined {
  return typeof caches !== 'undefined' && 'default' in caches
    ? (caches as unknown as { default: Cache }).default
    : undefined;
}

async function readCount(origin: string): Promise<AppleCounterPayload> {
  const kv = getKvNamespace();
  if (kv) {
    try {
      const raw = await kv.get(KV_KEY);
      const parsed = raw ? Number.parseInt(raw, 10) : 0;
      return { count: Number.isFinite(parsed) && parsed >= 0 ? parsed : 0, backend: 'kv' };
    } catch {
      /* fall through to cache fallback */
    }
  }

  const cache = getEdgeCache();
  if (cache) {
    try {
      const cacheReq = new Request(origin + CACHE_PATH);
      const hit = await cache.match(cacheReq);
      if (hit) {
        const parsed = (await hit.json()) as { count?: number };
        const count = typeof parsed?.count === 'number' && parsed.count >= 0 ? parsed.count : 0;
        return { count, backend: 'edge-cache' };
      }
      return { count: 0, backend: 'edge-cache' };
    } catch {
      /* fall through */
    }
  }

  return { count: ephemeralCount, backend: 'ephemeral' };
}

async function incrementCount(origin: string): Promise<AppleCounterPayload> {
  const kv = getKvNamespace();
  if (kv) {
    try {
      const raw = await kv.get(KV_KEY);
      const current = raw ? Number.parseInt(raw, 10) : 0;
      const next = (Number.isFinite(current) && current >= 0 ? current : 0) + 1;
      await kv.put(KV_KEY, String(next));
      return { count: next, backend: 'kv' };
    } catch {
      /* fall through to cache fallback */
    }
  }

  const cache = getEdgeCache();
  if (cache) {
    try {
      const cacheReq = new Request(origin + CACHE_PATH);
      const hit = await cache.match(cacheReq);
      let current = 0;
      if (hit) {
        const parsed = (await hit.json()) as { count?: number };
        if (typeof parsed?.count === 'number' && parsed.count >= 0) current = parsed.count;
      }
      const next = current + 1;
      await cache.put(
        cacheReq,
        new Response(JSON.stringify({ count: next }), {
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'public, max-age=2592000',
          },
        })
      );
      return { count: next, backend: 'edge-cache' };
    } catch {
      /* fall through */
    }
  }

  ephemeralCount += 1;
  return { count: ephemeralCount, backend: 'ephemeral' };
}

export const GET: RequestHandler = async ({ url }) => {
  const payload = await readCount(url.origin);
  return json(payload, { headers: NO_STORE });
};

export const POST: RequestHandler = async ({ request, url }) => {
  const fetchSite = request.headers.get('sec-fetch-site');
  if (fetchSite === 'cross-site') {
    return json({ error: 'Cross-site requests not permitted.' }, { status: 403, headers: NO_STORE });
  }

  const payload = await incrementCount(url.origin);
  return json(payload, { headers: NO_STORE });
};
