import { json, type RequestHandler } from '@sveltejs/kit';
import { GITHUB_TOKEN } from '$app/env/private';
import {
  GITHUB_SNAPSHOT,
  SNAPSHOT_DATE,
  type GitHubEvent,
  type GitHubPayload,
  type GitHubProfile,
  type GitHubRepo,
} from '#lib/data/github-snapshot.ts';

const USER = 'MacieiraPT';
const GITHUB_API = 'https://api.github.com';
const EDGE_TTL_SECONDS = 1800; // 30 minutes
const UPSTREAM_TIMEOUT_MS = 4500;

interface UpstreamResult<T> {
  ok: boolean;
  status: number;
  rateLimited: boolean;
  data?: T;
}

async function fetchGitHub<T>(path: string, headers: HeadersInit): Promise<UpstreamResult<T>> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);

  try {
    const res = await fetch(`${GITHUB_API}${path}`, {
      headers,
      signal: controller.signal,
    });

    if (!res.ok) {
      return {
        ok: false,
        status: res.status,
        rateLimited:
          res.status === 403 && res.headers.get('x-ratelimit-remaining') === '0',
      };
    }

    const data = (await res.json()) as T;
    return { ok: true, status: res.status, rateLimited: false, data };
  } catch {
    return { ok: false, status: 0, rateLimited: false };
  } finally {
    clearTimeout(timeout);
  }
}

export const GET: RequestHandler = async ({ url }) => {
  const cacheUrl = new URL(url.origin + '/api/github');
  const cacheStorage =
    typeof caches !== 'undefined' && 'default' in caches
      ? (caches as unknown as { default: Cache }).default
      : undefined;

  if (cacheStorage && !url.searchParams.has('fresh')) {
    try {
      const hit = await cacheStorage.match(cacheUrl.toString());
      if (hit) {
        const payload = (await hit.json()) as GitHubPayload;
        const cachedPayload: GitHubPayload = {
          ...payload,
          source: payload.source === 'snapshot' ? 'snapshot' : 'edge-cache',
        };
        return json(cachedPayload, {
          headers: {
            'Cache-Control': `public, max-age=300, s-maxage=${EDGE_TTL_SECONDS}, stale-while-revalidate=3600`,
            'X-GitHub-Source': cachedPayload.source,
          },
        });
      }
    } catch {
      /* ignore cache read failure and fall through */
    }
  }

  const reqHeaders = new Headers({
    Accept: 'application/vnd.github+json',
    'User-Agent': 'macieira.cc-worker/2.0 (+https://macieira.cc)',
  });
  if (GITHUB_TOKEN) {
    reqHeaders.set('Authorization', `Bearer ${GITHUB_TOKEN}`);
  }

  const [profileRes, reposRes, eventsRes] = await Promise.all([
    fetchGitHub<GitHubProfile>(`/users/${USER}`, reqHeaders),
    fetchGitHub<GitHubRepo[]>(`/users/${USER}/repos?per_page=20&sort=pushed`, reqHeaders),
    fetchGitHub<GitHubEvent[]>(`/users/${USER}/events/public?per_page=100`, reqHeaders),
  ]);

  const liveSuccess = profileRes.ok && Boolean(profileRes.data) && reposRes.ok && Array.isArray(reposRes.data);
  const rateLimited = profileRes.rateLimited || reposRes.rateLimited || eventsRes.rateLimited;

  const payload: GitHubPayload = liveSuccess
    ? {
        source: 'live',
        fetchedAt: new Date().toISOString(),
        snapshotDate: SNAPSHOT_DATE,
        profile: profileRes.data!,
        repos: reposRes.data!,
        events: eventsRes.ok && Array.isArray(eventsRes.data) ? eventsRes.data : [],
      }
    : {
        source: 'snapshot',
        fetchedAt: new Date().toISOString(),
        snapshotDate: SNAPSHOT_DATE,
        rateLimited,
        profile: GITHUB_SNAPSHOT.profile,
        repos: GITHUB_SNAPSHOT.repos,
        events: GITHUB_SNAPSHOT.events,
      };

  const cacheHeader = liveSuccess
    ? `public, max-age=300, s-maxage=${EDGE_TTL_SECONDS}, stale-while-revalidate=3600`
    : 'public, max-age=60, s-maxage=120';

  const response = json(payload, {
    headers: {
      'Cache-Control': cacheHeader,
      'X-GitHub-Source': payload.source,
    },
  });

  if (cacheStorage && liveSuccess) {
    try {
      await cacheStorage.put(cacheUrl.toString(), response.clone());
    } catch {
      /* ignore non-fatal cache put errors */
    }
  }

  return response;
};
