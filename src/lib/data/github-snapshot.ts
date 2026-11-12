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
  payload?: {
    commits?: Array<unknown>;
  };
}

export interface GitHubPayload {
  source: 'live' | 'edge-cache' | 'snapshot';
  fetchedAt: string;
  snapshotDate: string;
  rateLimited?: boolean;
  profile: GitHubProfile;
  repos: GitHubRepo[];
  events: GitHubEvent[];
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
