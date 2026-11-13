export interface GitHubProfile {
  login: string;
  name: string | null;
  bio: string | null;
  avatar_url: string;
  html_url: string;
  public_repos: number;
  followers: number;
  created_at: string;
}

export interface GitHubRepo {
  name: string;
  html_url: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  fork: boolean;
  archived: boolean;
  pushed_at: string;
}

export interface GitHubEvent {
  type: string;
  created_at: string;
  repo?: {
    name?: string;
  };
  payload?: {
    head?: string;
    commits?: Array<{
      sha?: string;
      message?: string;
    }>;
  };
}

export interface GitHubLanguageStat {
  name: string;
  count: number;
  pct: number;
}

export interface GitHubLatestPush {
  repo: string;
  message?: string;
  at: string;
}

export interface GitHubPayload {
  source: 'live' | 'edge-cache' | 'snapshot';
  fetchedAt: string;
  snapshotDate: string;
  rateLimited?: boolean;
  profile: GitHubProfile;
  repos: GitHubRepo[];
  events: GitHubEvent[];
  languages: GitHubLanguageStat[];
  latestPush: GitHubLatestPush | null;
}

export function computeLanguageStats(repos: GitHubRepo[]): GitHubLanguageStat[] {
  const counts = new Map<string, number>();
  let total = 0;

  for (const repo of repos) {
    if (repo.fork || repo.archived || !repo.language) continue;
    counts.set(repo.language, (counts.get(repo.language) ?? 0) + 1);
    total += 1;
  }

  if (total === 0) return [];

  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([name, count]) => ({
      name,
      count,
      pct: Math.round((count / total) * 100),
    }));
}

export function extractLatestPush(
  repos: GitHubRepo[],
  events: GitHubEvent[]
): GitHubLatestPush | null {
  for (const ev of events) {
    if (ev.type !== 'PushEvent') continue;
    const rawName = ev.repo?.name ?? '';
    const repo = rawName.includes('/') ? rawName.split('/').slice(1).join('/') : rawName;
    const rawMsg = ev.payload?.commits?.[0]?.message?.split('\n')[0]?.trim();
    if (repo) {
      return {
        repo,
        message: rawMsg && rawMsg.length > 72 ? `${rawMsg.slice(0, 69)}...` : rawMsg,
        at: ev.created_at,
      };
    }
  }

  const ownSorted = repos
    .filter((r) => !r.fork && !r.archived && r.pushed_at)
    .sort((a, b) => Date.parse(b.pushed_at) - Date.parse(a.pushed_at));

  if (ownSorted[0]) {
    return {
      repo: ownSorted[0].name,
      at: ownSorted[0].pushed_at,
    };
  }
  return null;
}

export const SNAPSHOT_DATE = '2026-11-12';

export const GITHUB_SNAPSHOT: {
  profile: GitHubProfile;
  repos: GitHubRepo[];
  events: GitHubEvent[];
} = {
  profile: {
    login: 'MacieiraPT',
    name: 'Rodrigo Macieira',
    bio: null,
    avatar_url: 'https://avatars.githubusercontent.com/u/254562296?v=4',
    html_url: 'https://github.com/MacieiraPT',
    public_repos: 4,
    followers: 0,
    created_at: '2026-01-12T22:43:30Z',
  },
  repos: [
    {
      name: 'EmuHub',
      html_url: 'https://github.com/MacieiraPT/EmuHub',
      description: 'All your emulators in one place.',
      language: 'TypeScript',
      stargazers_count: 0,
      fork: false,
      archived: false,
      pushed_at: '2026-09-07T23:03:14Z',
    },
    {
      name: 'macieira.cc',
      html_url: 'https://github.com/MacieiraPT/macieira.cc',
      description: 'Personal portfolio, retro WebGL work, and case studies',
      language: 'Svelte',
      stargazers_count: 0,
      fork: false,
      archived: false,
      pushed_at: '2026-11-12T22:00:00Z',
    },
    {
      name: 'SGEEP.Web',
      html_url: 'https://github.com/MacieiraPT/SGEEP.Web',
      description: 'Sistema de Gestão de Estágios para Escolas Profissionais',
      language: 'C#',
      stargazers_count: 0,
      fork: false,
      archived: false,
      pushed_at: '2026-05-13T16:21:35Z',
    },
    {
      name: 'FinSight',
      html_url: 'https://github.com/MacieiraPT/FinSight',
      description: 'Personal finance management web app',
      language: 'C#',
      stargazers_count: 0,
      fork: false,
      archived: false,
      pushed_at: '2026-05-10T22:24:13Z',
    },
  ],
  events: [],
};
