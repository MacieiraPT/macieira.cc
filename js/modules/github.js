/**
 * github.js — the live half of the dev section.
 *
 * Reads three public, unauthenticated GitHub endpoints and renders whatever
 * is actually true right now:
 *
 *   /users/:user                 profile counters
 *   /users/:user/repos           most recently pushed repositories
 *   /users/:user/events/public   activity, bucketed per day
 *
 * Constraints this is written around:
 *   - No token. The public API allows 60 requests/hour *per IP*, which is
 *     shared by everyone behind the same NAT, so responses are cached in
 *     localStorage and a rate-limited response falls back to that cache.
 *   - The account may legitimately have nothing in it yet. An empty result
 *     is a real state with real copy, not an error.
 *   - Anything can fail. The markup in index.html already reads correctly
 *     with no JS at all; this only ever *improves* it.
 */

const USER = 'MacieiraPT';
const API = 'https://api.github.com';
const CACHE_PREFIX = 'gh:v1:';
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes
const ACTIVITY_DAYS = 14;
const MAX_REPOS = 4;

/* -------------------------------------------------------------------------- */
/* Fetching + caching                                                          */
/* -------------------------------------------------------------------------- */

function readCache(key) {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null; // private mode, quota, or a stale shape — not worth reporting
  }
}

function writeCache(key, data) {
  try {
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify({ t: Date.now(), data }));
  } catch {
    /* storage is a nice-to-have */
  }
}

/**
 * Returns `{ data, fresh }`. Serves a fresh cache entry without touching the
 * network; on failure, falls back to a stale entry before giving up.
 */
async function getJSON(path, signal) {
  const cached = readCache(path);
  if (cached && Date.now() - cached.t < CACHE_TTL) return { data: cached.data, fresh: false };

  const response = await fetch(API + path, {
    signal,
    headers: { Accept: 'application/vnd.github+json' },
  });

  if (!response.ok) {
    if (cached) return { data: cached.data, fresh: false };
    const error = new Error(`GitHub responded ${response.status}`);
    error.status = response.status;
    error.rateLimited =
      response.status === 403 && response.headers.get('x-ratelimit-remaining') === '0';
    throw error;
  }

  const data = await response.json();
  writeCache(path, data);
  return { data, fresh: true };
}

/* -------------------------------------------------------------------------- */
/* Formatting                                                                  */
/* -------------------------------------------------------------------------- */

const numberFormat = new Intl.NumberFormat('en-GB');
const relativeFormat = new Intl.RelativeTimeFormat('en-GB', { numeric: 'auto' });

const UNITS = [
  ['year', 365 * 24 * 3600],
  ['month', 30 * 24 * 3600],
  ['week', 7 * 24 * 3600],
  ['day', 24 * 3600],
  ['hour', 3600],
  ['minute', 60],
];

function timeAgo(iso) {
  const seconds = (Date.parse(iso) - Date.now()) / 1000;
  for (const [unit, size] of UNITS) {
    if (Math.abs(seconds) >= size) return relativeFormat.format(Math.round(seconds / size), unit);
  }
  return 'just now';
}

/** GitHub's own language colours, for the handful most likely to show up first. */
const LANGUAGE_COLORS = {
  JavaScript: '#f1e05a',
  TypeScript: '#3178c6',
  HTML: '#e34c26',
  CSS: '#663399',
  Python: '#3572A5',
  Java: '#b07219',
  C: '#555555',
  'C++': '#f34b7d',
  'C#': '#178600',
  Shell: '#89e051',
  Lua: '#000080',
  Rust: '#dea584',
  Go: '#00ADD8',
  Kotlin: '#A97BFF',
  PHP: '#4F5D95',
  Dart: '#00B4AB',
  GLSL: '#5686a5',
};

/* -------------------------------------------------------------------------- */
/* Rendering                                                                   */
/* -------------------------------------------------------------------------- */

function renderProfile(root, user) {
  const avatar = root.querySelector('[data-gh-avatar]');
  if (avatar && user.avatar_url) {
    // Loaded through CSS rather than an <img> so the gradient placeholder
    // stays visible underneath until the real image decodes.
    avatar.style.backgroundImage = `url("${user.avatar_url}&s=128")`;
  }

  const sub = root.querySelector('[data-gh-sub]');
  if (sub) sub.textContent = user.bio?.trim() || user.name || 'github.com/MacieiraPT';

  const set = (key, value) => {
    const cell = root.querySelector(`[data-gh-stat="${key}"]`);
    if (cell) cell.textContent = value;
  };

  set('repos', numberFormat.format(user.public_repos ?? 0));
  set('followers', numberFormat.format(user.followers ?? 0));
  set('since', user.created_at ? new Date(user.created_at).getFullYear() : '—');
}

/**
 * Buckets public events into one bar per day. Public events only cover the
 * last ~90 days and the most recent 300 items, which is plenty for a
 * two-week strip — and the label says exactly what it is.
 */
function renderActivity(root, events) {
  const spark = root.querySelector('[data-gh-spark]');
  const note = root.querySelector('[data-gh-activity-note]');
  if (!spark) return;

  const buckets = new Array(ACTIVITY_DAYS).fill(0);
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  for (const event of events) {
    // Compare midnight to midnight. Subtracting raw timestamps would make
    // anything that happened *today* land on -1 and vanish from the strip,
    // and Math.round keeps the 23/25-hour days around a DST change honest.
    const eventDay = new Date(event.created_at);
    eventDay.setHours(0, 0, 0, 0);
    const day = Math.round((startOfToday - eventDay) / 86_400_000);

    if (day >= 0 && day < ACTIVITY_DAYS) {
      // A push counts for what it carried, so a real work session outranks a star.
      buckets[ACTIVITY_DAYS - 1 - day] += event.type === 'PushEvent'
        ? Math.max(1, event.payload?.commits?.length ?? 1)
        : 1;
    }
  }

  const peak = Math.max(...buckets, 1);
  const total = buckets.reduce((sum, value) => sum + value, 0);

  const bars = buckets.map((value, index) => {
    const bar = document.createElement('span');
    bar.className = 'spark__bar';
    bar.dataset.empty = String(value === 0);
    bar.style.transitionDelay = `${index * 22}ms`;
    const day = new Date(startOfToday.getTime() - (ACTIVITY_DAYS - 1 - index) * 86_400_000);
    bar.title = `${day.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}: ${value} event${value === 1 ? '' : 's'}`;
    return bar;
  });

  spark.replaceChildren(...bars);

  // Heights are applied on the next frame so the CSS transition has a
  // starting value to grow from — set inline at creation, it would snap.
  requestAnimationFrame(() => {
    bars.forEach((bar, index) => {
      bar.style.height = `${Math.round((buckets[index] / peak) * 92) + 8}%`;
    });
  });

  spark.setAttribute(
    'aria-label',
    `${total} public GitHub event${total === 1 ? '' : 's'} in the last ${ACTIVITY_DAYS} days`
  );
  if (note) {
    note.textContent = total
      ? `${total} event${total === 1 ? '' : 's'} · last ${ACTIVITY_DAYS} days`
      : `quiet · last ${ACTIVITY_DAYS} days`;
  }
}

function renderRepos(root, repos) {
  const container = root.querySelector('[data-gh-repos]');
  if (!container) return;

  const own = repos
    .filter((repo) => !repo.fork && !repo.archived)
    .sort((a, b) => Date.parse(b.pushed_at) - Date.parse(a.pushed_at))
    .slice(0, MAX_REPOS);

  if (!own.length) {
    const message = document.createElement('p');
    message.className = 'gh__empty';
    message.textContent = repos.length
      ? 'Nothing public of my own yet — only forks so far.'
      : 'No public repositories yet. First one lands here the moment it exists.';
    container.replaceChildren(message);
    return;
  }

  container.replaceChildren(
    ...own.map((repo) => {
      const link = document.createElement('a');
      link.className = 'repo';
      link.href = repo.html_url;
      link.target = '_blank';
      link.rel = 'noopener';

      const name = document.createElement('span');
      name.className = 'repo__name';
      name.textContent = repo.name;

      const meta = document.createElement('span');
      meta.className = 'repo__meta mono';

      if (repo.language) {
        const language = document.createElement('span');
        language.className = 'repo__lang';
        language.style.setProperty('--lang-color', LANGUAGE_COLORS[repo.language] ?? 'var(--plasma)');
        language.textContent = repo.language;
        meta.append(language);
      }
      if (repo.stargazers_count) {
        const stars = document.createElement('span');
        stars.textContent = `★ ${numberFormat.format(repo.stargazers_count)}`;
        meta.append(stars);
      }
      const updated = document.createElement('span');
      updated.textContent = timeAgo(repo.pushed_at);
      meta.append(updated);

      link.append(name, meta);

      if (repo.description) {
        const description = document.createElement('span');
        description.className = 'repo__desc';
        description.textContent = repo.description;
        link.append(description);
      }

      return link;
    })
  );
}

function setStatus(root, state, text) {
  root.dataset.ghState = state;
  const output = root.querySelector('[data-gh-status-text]');
  if (output) output.textContent = text;
}

function setNote(root, text) {
  const note = root.querySelector('[data-gh-note]');
  if (note) note.textContent = text;
}

/* -------------------------------------------------------------------------- */
/* Entry point                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * @param {() => void} [onRender] called after the DOM changes, so the caller
 *        can refresh ScrollTrigger — the panel's height changes when real
 *        repositories replace the placeholder, which moves every trigger
 *        below it.
 */
export async function initGitHub(onRender) {
  const root = document.querySelector('[data-gh]');
  if (!root) return;

  setStatus(root, 'loading', 'fetching…');

  // One shared timeout: a hanging request should degrade, not spin forever.
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  const [profile, repositories, activity] = await Promise.allSettled([
    getJSON(`/users/${USER}`, controller.signal),
    getJSON(`/users/${USER}/repos?per_page=20&sort=pushed`, controller.signal),
    getJSON(`/users/${USER}/events/public?per_page=100`, controller.signal),
  ]);
  clearTimeout(timeout);

  if (profile.status === 'rejected') {
    setStatus(root, 'error', 'offline');
    setNote(
      root,
      profile.reason?.rateLimited
        ? "GitHub's public API is rate-limited from this network right now — the profile link still works."
        : "Couldn't reach the GitHub API from here. The profile link still works."
    );
    onRender?.();
    return;
  }

  renderProfile(root, profile.value.data);
  if (Array.isArray(repositories.value?.data)) renderRepos(root, repositories.value.data);
  if (Array.isArray(activity.value?.data)) renderActivity(root, activity.value.data);

  const fresh = profile.value.fresh;
  setStatus(root, 'live', fresh ? 'live from the GitHub API' : 'from cache');
  setNote(root, fresh ? '' : 'Cached for up to 30 minutes to stay inside the public rate limit.');

  onRender?.();
}
