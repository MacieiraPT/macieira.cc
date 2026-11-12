<script lang="ts">
  import { onMount } from 'svelte';
  import { i18n } from '#lib/i18n/index.svelte.ts';
  import {
    GITHUB_SNAPSHOT,
    SNAPSHOT_DATE,
    type GitHubPayload,
  } from '#lib/data/github-snapshot.ts';
  import Icons from './Icons.svelte';

  const ACTIVITY_DAYS = 14;
  const MAX_REPOS = 4;

  const LANGUAGE_COLORS: Record<string, string> = {
    TypeScript: '#3178c6',
    JavaScript: '#f1e05a',
    'C#': '#178600',
    Svelte: '#ff3e00',
    HTML: '#e34c26',
    CSS: '#563d7c',
    Python: '#3572A5',
    Rust: '#dea584',
    Go: '#00ADD8',
  };

  let payload = $state<GitHubPayload>({
    source: 'snapshot',
    fetchedAt: SNAPSHOT_DATE,
    snapshotDate: SNAPSHOT_DATE,
    profile: GITHUB_SNAPSHOT.profile,
    repos: GITHUB_SNAPSHOT.repos,
    events: GITHUB_SNAPSHOT.events,
  });

  let loading = $state(false);
  let loadedFromWorker = $state(false);
  let avatarFailed = $state(false);

  onMount(() => {
    loading = true;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);

    fetch('/api/github', { signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as GitHubPayload;
        if (data?.profile && Array.isArray(data?.repos)) {
          if (data.profile.avatar_url !== payload.profile.avatar_url) {
            avatarFailed = false;
          }
          payload = data;
          loadedFromWorker = true;
        }
      })
      .catch(() => {
        // Keep SSR/initial GITHUB_SNAPSHOT cleanly visible
      })
      .finally(() => {
        clearTimeout(timer);
        loading = false;
      });

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  });

  let numberFmt = $derived(new Intl.NumberFormat(i18n.locale));
  let dayFmt = $derived(new Intl.DateTimeFormat(i18n.locale, { day: 'numeric', month: 'short' }));
  let monthYearFmt = $derived(
    new Intl.DateTimeFormat(i18n.locale, { month: 'short', year: 'numeric', timeZone: 'UTC' })
  );
  let relativeFmt = $derived(new Intl.RelativeTimeFormat(i18n.locale, { numeric: 'auto' }));

  function safeAvatarUrl(raw: string | undefined): string | null {
    if (!raw) return null;
    try {
      const parsed = new URL(raw);
      if (parsed.protocol !== 'https:' || parsed.hostname !== 'avatars.githubusercontent.com') {
        return null;
      }
      parsed.searchParams.set('s', '128');
      return parsed.href;
    } catch {
      return null;
    }
  }

  function timeAgo(iso: string): string {
    const seconds = (Date.parse(iso) - Date.now()) / 1000;
    const units: Array<[Intl.RelativeTimeFormatUnit, number]> = [
      ['year', 365 * 24 * 3600],
      ['month', 30 * 24 * 3600],
      ['week', 7 * 24 * 3600],
      ['day', 24 * 3600],
      ['hour', 3600],
      ['minute', 60],
    ];
    for (const [unit, size] of units) {
      if (Math.abs(seconds) >= size) {
        return relativeFmt.format(Math.round(seconds / size), unit);
      }
    }
    return i18n.t.github.justNow;
  }

  let ownRepos = $derived(
    payload.repos
      .filter((r) => !r.fork && !r.archived)
      .sort((a, b) => Date.parse(b.pushed_at) - Date.parse(a.pushed_at))
      .slice(0, MAX_REPOS)
  );

  let latestPushAt = $derived(ownRepos[0]?.pushed_at ?? null);

  let activityBuckets = $derived.by(() => {
    const counts = new Array(ACTIVITY_DAYS).fill(0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const event of payload.events) {
      const evDay = new Date(event.created_at);
      evDay.setHours(0, 0, 0, 0);
      const diff = Math.round((today.getTime() - evDay.getTime()) / 86_400_000);
      if (diff >= 0 && diff < ACTIVITY_DAYS) {
        counts[ACTIVITY_DAYS - 1 - diff] +=
          event.type === 'PushEvent' ? Math.max(1, event.payload?.commits?.length ?? 1) : 1;
      }
    }

    const peak = Math.max(...counts, 1);
    const total = counts.reduce((sum, n) => sum + n, 0);

    const bars = counts.map((value, idx) => {
      const date = new Date(today.getTime() - (ACTIVITY_DAYS - 1 - idx) * 86_400_000);
      return {
        value,
        heightPct: value === 0 ? 10 : Math.round((value / peak) * 90) + 10,
        tooltip: i18n.t.github.dayTooltip(dayFmt.format(date), value),
      };
    });

    return { bars, total };
  });

  let snapshotFormatted = $derived(monthYearFmt.format(Date.parse(payload.snapshotDate || SNAPSHOT_DATE)));

  let statusText = $derived.by(() => {
    if (loading) return i18n.t.github.connecting;
    if (payload.source === 'live') return i18n.t.github.liveBadge;
    if (payload.source === 'edge-cache') return i18n.t.github.cachedBadge;
    return i18n.t.github.snapshotBadge(snapshotFormatted);
  });

  let footerNote = $derived.by(() => {
    if (payload.source === 'snapshot' && loadedFromWorker) {
      return i18n.t.github.snapshotNote(snapshotFormatted, payload.rateLimited);
    }
    if (payload.source === 'edge-cache') return i18n.t.github.cacheNote;
    return '';
  });

  let activityNote = $derived.by(() => {
    if (activityBuckets.total > 0) {
      return i18n.t.github.activityCount(activityBuckets.total, ACTIVITY_DAYS);
    }
    if (latestPushAt) {
      return i18n.t.github.activityQuietSince(ACTIVITY_DAYS, timeAgo(latestPushAt));
    }
    return i18n.t.github.activityQuiet(ACTIVITY_DAYS);
  });

  let avatarHref = $derived(safeAvatarUrl(payload.profile.avatar_url));
  let sinceYear = $derived(
    payload.profile.created_at ? new Date(payload.profile.created_at).getFullYear() : '2026'
  );
</script>

<div class="gh" data-gh-source={payload.source}>
  <header class="gh__head">
    <div class="gh__id">
      {#if avatarHref && !avatarFailed}
        <img
          class="gh__avatar"
          src={avatarHref}
          alt="@MacieiraPT"
          width="44"
          height="44"
          loading="lazy"
          decoding="async"
          onerror={() => (avatarFailed = true)}
        />
      {:else}
        <span class="gh__avatar gh__avatar--placeholder" aria-hidden="true">RM</span>
      {/if}
      <div>
        <h3 class="gh__title">{i18n.t.github.panelTitle}</h3>
        <p class="gh__sub mono">{payload.profile.bio?.trim() || i18n.t.github.panelSubFallback}</p>
      </div>
    </div>

    <p class="gh__status mono">
      <span class="gh__led" class:is-live={payload.source === 'live' || payload.source === 'edge-cache'} aria-hidden="true"></span>
      <span>{statusText}</span>
    </p>
  </header>

  <dl class="gh__stats">
    <div>
      <dt class="mono">{i18n.t.github.statsRepos}</dt>
      <dd>{numberFmt.format(payload.profile.public_repos ?? 0)}</dd>
    </div>
    <div>
      <dt class="mono">{i18n.t.github.statsFollowers}</dt>
      <dd>{numberFmt.format(payload.profile.followers ?? 0)}</dd>
    </div>
    <div>
      <dt class="mono">{i18n.t.github.statsSince}</dt>
      <dd>{sinceYear}</dd>
    </div>
  </dl>

  <div class="gh__activity">
    <div class="gh__activity-head">
      <span class="section-label">{i18n.t.github.activityLabel}</span>
      <span class="mono gh__dim">{activityNote}</span>
    </div>

    <div
      class="spark"
      role="img"
      aria-label={i18n.t.github.activityAria(activityBuckets.total, ACTIVITY_DAYS)}
    >
      {#each activityBuckets.bars as bar}
        <span
          class="spark__bar"
          class:is-empty={bar.value === 0}
          style:height="{bar.heightPct}%"
          title={bar.tooltip}
        ></span>
      {/each}
    </div>
  </div>

  <div class="gh__repos">
    {#if ownRepos.length === 0}
      <p class="gh__empty">{payload.repos.length ? i18n.t.github.forksOnly : i18n.t.github.noRepos}</p>
    {:else}
      {#each ownRepos as repo (repo.name)}
        <a class="repo" href={repo.html_url} target="_blank" rel="noopener">
          <span class="repo__name">
            {repo.name}
            <Icons name="arrow-up-right" class="icon icon--sm repo__arrow" />
          </span>

          <span class="repo__meta mono">
            {#if repo.language}
              <span class="repo__lang">
                <span
                  class="repo__lang-dot"
                  style:background={LANGUAGE_COLORS[repo.language] ?? 'var(--acid)'}
                  aria-hidden="true"
                ></span>
                {repo.language}
              </span>
            {/if}
            {#if repo.stargazers_count > 0}
              <span>★ {numberFmt.format(repo.stargazers_count)}</span>
            {/if}
            <span>{timeAgo(repo.pushed_at)}</span>
          </span>

          {#if repo.description}
            <span class="repo__desc">{repo.description}</span>
          {/if}
        </a>
      {/each}
    {/if}
  </div>

  {#if footerNote}
    <p class="gh__note mono">{footerNote}</p>
  {/if}
</div>

<style>
  .gh {
    border: 1px solid var(--line);
    border-radius: var(--radius);
    background: var(--bg-raise);
    overflow: hidden;
  }

  .gh > * + * {
    border-top: 1px solid var(--line);
  }

  .gh__head,
  .gh__activity,
  .gh__repos {
    padding: clamp(1rem, 2vw, 1.4rem);
  }

  .gh__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    flex-wrap: wrap;
  }

  .gh__id {
    display: flex;
    align-items: center;
    gap: 0.85rem;
  }

  .gh__avatar {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    border: 1px solid var(--line-strong);
    object-fit: cover;
    flex: none;
  }

  .gh__avatar--placeholder {
    display: grid;
    place-items: center;
    background: var(--bg-elev);
    font-family: var(--font-mono);
    font-size: 0.78rem;
  }

  .gh__title {
    font-size: var(--step-h3);
    font-weight: 600;
    letter-spacing: -0.02em;
    line-height: 1.1;
  }

  .gh__sub {
    color: var(--ink-faint);
    margin-top: 0.25rem;
  }

  .gh__status {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    color: var(--ink-dim);
  }

  .gh__led {
    width: 7px;
    height: 7px;
    background: var(--ink-faint);
    border-radius: 2px;
  }

  .gh__led.is-live {
    background: var(--acid);
  }

  .gh__stats {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .gh__stats > div {
    padding: clamp(0.9rem, 1.8vw, 1.25rem);
  }

  .gh__stats > div + div {
    border-left: 1px solid var(--line);
  }

  .gh__stats dt {
    color: var(--ink-faint);
    text-transform: uppercase;
    letter-spacing: 0.14em;
    font-size: 0.62rem;
    margin-bottom: 0.45rem;
  }

  .gh__stats dd {
    font-size: clamp(1.4rem, 2.5vw, 1.95rem);
    font-weight: 700;
    letter-spacing: -0.03em;
    font-variant-numeric: tabular-nums;
    line-height: 1;
  }

  .gh__activity-head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 1rem;
    flex-wrap: wrap;
    margin-bottom: 0.9rem;
  }

  .gh__dim {
    color: var(--ink-faint);
  }

  .spark {
    display: flex;
    align-items: flex-end;
    gap: 4px;
    height: 52px;
  }

  .spark__bar {
    flex: 1;
    min-height: 3px;
    border-radius: 2px;
    background: var(--acid);
    transition: height 0.5s var(--ease-out);
  }

  .spark__bar.is-empty {
    background: var(--line);
  }

  .gh__repos {
    display: grid;
    gap: 0.25rem;
  }

  .gh__empty {
    color: var(--ink-dim);
    font-size: 0.92rem;
  }

  .repo {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: baseline;
    gap: 0.35rem 1rem;
    padding: 0.75rem 0.65rem;
    margin-inline: -0.65rem;
    border-radius: 8px;
    transition: background-color 0.2s var(--ease-out);
  }

  .repo:hover {
    background: rgb(255 255 255 / 0.04);
  }

  .repo__name {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    font-weight: 600;
    letter-spacing: -0.01em;
  }

  :global(.repo__arrow) {
    color: var(--ink-faint);
    transition: transform 0.2s var(--ease-out), color 0.2s var(--ease-out);
  }

  .repo:hover :global(.repo__arrow) {
    color: var(--acid);
    transform: translate(2px, -2px);
  }

  .repo__meta {
    display: flex;
    align-items: center;
    gap: 0.85rem;
    color: var(--ink-faint);
  }

  .repo__lang {
    display: inline-flex;
    align-items: center;
    gap: 0.38rem;
  }

  .repo__lang-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
  }

  .repo__desc {
    grid-column: 1 / -1;
    color: var(--ink-dim);
    font-size: 0.9rem;
  }

  .gh__note {
    padding: 0.8rem clamp(1rem, 2vw, 1.4rem);
    color: var(--ink-faint);
  }

  @media (max-width: 580px) {
    .gh__stats {
      grid-template-columns: 1fr;
    }

    .gh__stats > div + div {
      border-left: 0;
      border-top: 1px solid var(--line);
    }

    .repo {
      grid-template-columns: 1fr;
    }
  }
</style>
