/**
 * github-snapshot.js — curated fallback for when GitHub's anonymous API is
 * unreachable or rate-limited (60 req/hr per IP).
 *
 * Strictly static and tokenless; only surfaced as a labelled snapshot when
 * live requests and localStorage cache are both unavailable.
 */

export const SNAPSHOT_DATE = '2026-11-12';

export const GITHUB_SNAPSHOT = {
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
      description: 'basic personal website',
      language: 'JavaScript',
      stargazers_count: 0,
      fork: false,
      archived: false,
      pushed_at: '2026-08-12T21:46:25Z',
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
};
