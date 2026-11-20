import { json, type RequestHandler } from '@sveltejs/kit';
import { GITHUB_TOKEN } from '$app/env/private';
import {
  GITHUB_SNAPSHOT,
  SNAPSHOT_DATE,
  computeLanguageStats,
  extractLatestPush,
  type GitHubEvent,
  type GitHubPayload,
  type GitHubProfile,
  type GitHubRepo,
} from '#lib/data/github-snapshot.ts';

import { SITE } from '#lib/data/site.ts';

const USER = SITE.githubUser;
const GITHUB_API = 'https://api.github.com';
const EDGE_TTL_SECONDS = 1800; // 30 minutes
const FALLBACK_EDGE_TTL_SECONDS = 120; // 2 minutes to prevent retry storms
const UPSTREAM_TIMEOUT_MS = 4500;

function trimProfile(raw: GitHubProfile): GitHubProfile {
  return {
    login: raw.login,
    name: raw.name ?? null,
    bio: raw.bio ?? null,
    avatar_url: raw.avatar_url,
    html_url: raw.html_url,
    public_repos: raw.public_repos ?? 0,
    followers: raw.followers ?? 0,
    created_at: raw.created_at,
  };
}

function trimRepo(raw: GitHubRepo): GitHubRepo {
  return {
    name: raw.name,
    html_url: raw.html_url,
    description: raw.description ?? null,
    language: raw.language ?? null,
    stargazers_count: raw.stargazers_count ?? 0,
    fork: Boolean(raw.fork),
    archived: Boolean(raw.archived),
    pushed_at: raw.pushed_at,
  };
}

function trimEvent(raw: GitHubEvent): GitHubEvent {
  const firstMsg = raw.payload?.commits?.[0]?.message;
  const commitCount = raw.payload?.size ?? raw.payload?.commits?.length;
  return {
    type: raw.type,
    created_at: raw.created_at,
    ...(raw.repo?.name ? { repo: { name: raw.repo.name } } : {}),
    ...(firstMsg || commitCount !== undefined
      ? {
          payload: {
            ...(commitCount !== undefined ? { size: commitCount } : {}),
            ...(firstMsg ? { commits: [{ message: firstMsg }] } : {}),
          },
        }
      : {}),
  };
}

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
      const rateLimited =
        res.status === 429 ||
        (res.status === 403 &&
          (res.headers.get('x-ratelimit-remaining') === '0' || res.headers.has('retry-after')));
      return {
        ok: false,
        status: res.status,
        rateLimited,
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
  const cacheUrl = new URL(url.origin + '/api/github?v=4');
  const cacheStorage =
    typeof caches !== 'undefined' && 'default' in caches
      ? (caches as unknown as { default: Cache }).default
      : undefined;

  if (cacheStorage) {
    try {
      const hit = await cacheStorage.match(cacheUrl.toString());
      if (hit) {
        const payload = (await hit.json()) as GitHubPayload;
        const cachedPayload: GitHubPayload = {
          ...payload,
          languages: payload.languages ?? computeLanguageStats(payload.repos ?? []),
          latestPush:
            payload.latestPush ?? extractLatestPush(payload.repos ?? [], payload.events ?? []),
          source: payload.source === 'snapshot' ? 'snapshot' : 'edge-cache',
        };
        const cacheControl =
          cachedPayload.source === 'snapshot'
            ? `public, max-age=60, s-maxage=${FALLBACK_EDGE_TTL_SECONDS}`
            : `public, max-age=300, s-maxage=${EDGE_TTL_SECONDS}, stale-while-revalidate=3600`;

        return json(cachedPayload, {
          headers: {
            'Cache-Control': cacheControl,
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
    'User-Agent': 'macieira.cc-worker/2.1 (+https://macieira.cc)',
  });
  if (GITHUB_TOKEN) {
    reqHeaders.set('Authorization', `Bearer ${GITHUB_TOKEN}`);
  }

  const [profileRes, reposRes, eventsRes] = await Promise.all([
    fetchGitHub<GitHubProfile>(`/users/${USER}`, reqHeaders),
    fetchGitHub<GitHubRepo[]>(`/users/${USER}/repos?per_page=20&sort=pushed`, reqHeaders),
    fetchGitHub<GitHubEvent[]>(`/users/${USER}/events/public?per_page=100`, reqHeaders),
  ]);

  const liveSuccess =
    profileRes.ok && Boolean(profileRes.data) && reposRes.ok && Array.isArray(reposRes.data);
  const rateLimited = profileRes.rateLimited || reposRes.rateLimited || eventsRes.rateLimited;

  const repos = liveSuccess ? reposRes.data!.map(trimRepo) : GITHUB_SNAPSHOT.repos;
  const events = liveSuccess
    ? eventsRes.ok && Array.isArray(eventsRes.data)
      ? eventsRes.data.map(trimEvent)
      : []
    : GITHUB_SNAPSHOT.events;

  const payload: GitHubPayload = {
    source: liveSuccess ? 'live' : 'snapshot',
    fetchedAt: new Date().toISOString(),
    snapshotDate: SNAPSHOT_DATE,
    ...(liveSuccess ? {} : { rateLimited }),
    profile: liveSuccess ? trimProfile(profileRes.data!) : GITHUB_SNAPSHOT.profile,
    repos,
    events,
    languages: computeLanguageStats(repos),
    latestPush: extractLatestPush(repos, events),
  };

  const cacheHeader = liveSuccess
    ? `public, max-age=300, s-maxage=${EDGE_TTL_SECONDS}, stale-while-revalidate=3600`
    : `public, max-age=60, s-maxage=${FALLBACK_EDGE_TTL_SECONDS}`;

  const response = json(payload, {
    headers: {
      'Cache-Control': cacheHeader,
      'X-GitHub-Source': payload.source,
    },
  });

  if (cacheStorage) {
    try {
      await cacheStorage.put(cacheUrl.toString(), response.clone());
    } catch {
      /* ignore non-fatal cache put errors */
    }
  }

  return response;
};
