<script lang="ts">
  import { page } from '$app/state';
  import { i18n, stripLangPrefix } from '#lib/i18n/index.svelte.ts';
  import { THEMES, workbench } from '#lib/state/workbench.svelte.ts';
  import Icons from './Icons.svelte';

  let cleanPath = $derived(stripLangPrefix(page.url.pathname));
  let enHref = $derived(i18n.alternatePath('en'));
  let ptHref = $derived(i18n.alternatePath('pt'));

  let menuOpen = $state(false);

  $effect(() => {
    // Close mobile drawer automatically whenever route changes
    void page.url.pathname;
    void page.url.hash;
    menuOpen = false;
  });

  function handleCycleTheme() {
    const next = workbench.cycleTheme();
    workbench.showToast(i18n.t.nav.themeToast(next.label));
  }

  function onWindowKeyDown(e: KeyboardEvent) {
    if (e.key === 'Escape' && menuOpen) {
      menuOpen = false;
    }
  }
</script>

<svelte:window onkeydown={onWindowKeyDown} />

<header class="masthead">
  <div class="masthead__inner wrap">
    <a class="masthead__brand" href={i18n.href('/')} aria-label={i18n.t.nav.brandAria}>
      <Icons name="pixel-apple" class="monogram" size={26} />
      <span class="masthead__wordmark">macieira<span class="masthead__tld">.cc</span></span>
    </a>

    <nav class="masthead__nav" aria-label={i18n.t.nav.sectionsAria}>
      <a href={i18n.href('/work')} class:is-current={cleanPath.startsWith('/work')}>
        <span class="idx">01</span> {i18n.t.nav.work}
      </a>
      <a href={i18n.href('/#background')}>
        <span class="idx">02</span> {i18n.t.nav.background}
      </a>
      <a href={i18n.href('/#github')}>
        <span class="idx">03</span> {i18n.t.nav.github}
      </a>
      <a href={i18n.href('/cv')} class:is-current={cleanPath === '/cv'}>
        <span class="idx">04</span> {i18n.t.nav.cv}
      </a>
      <a href={i18n.href('/#contact')}>
        <span class="idx">05</span> {i18n.t.nav.contact}
      </a>
    </nav>

    <div class="masthead__end">
      <button
        type="button"
        class="theme-pill mono"
        aria-label={i18n.t.nav.themeCycleAria(workbench.themeMeta.label)}
        title={workbench.themeMeta.label}
        onclick={handleCycleTheme}
      >
        <span class="theme-pill__dot" aria-hidden="true"></span>
        <span class="theme-pill__code">{workbench.themeMeta.shortLabel}</span>
      </button>

      <div class="lang" role="group" aria-label={i18n.t.nav.langAria}>
        <span class="lang__thumb" aria-hidden="true"></span>
        <a
          class="lang__btn"
          href={enHref}
          hreflang="en"
          lang="en"
          aria-current={i18n.lang === 'en' ? 'page' : undefined}
          data-sveltekit-noscroll
          onclick={() => i18n.remember('en')}
        >
          EN
        </a>
        <a
          class="lang__btn"
          href={ptHref}
          hreflang="pt-PT"
          lang="pt-PT"
          aria-current={i18n.lang === 'pt' ? 'page' : undefined}
          data-sveltekit-noscroll
          onclick={() => i18n.remember('pt')}
        >
          PT
        </a>
      </div>

      <a
        class="btn btn--ghost masthead__gh"
        href="https://github.com/MacieiraPT"
        target="_blank"
        rel="me noopener"
      >
        <Icons name="github" />
        <span class="masthead__gh-label">{i18n.t.nav.githubButton}</span>
        <Icons name="arrow-up-right" class="icon icon--sm masthead__gh-arrow" />
      </a>

      <button
        type="button"
        class="menu-toggle"
        aria-expanded={menuOpen}
        aria-controls="mobile-nav"
        aria-label={menuOpen ? i18n.t.nav.menuCloseAria : i18n.t.nav.menuOpenAria}
        onclick={() => (menuOpen = !menuOpen)}
      >
        <Icons name={menuOpen ? 'close' : 'menu'} size={18} />
      </button>
    </div>
  </div>

  {#if menuOpen}
    <nav id="mobile-nav" class="mobile-drawer" aria-label={i18n.t.nav.sectionsAria}>
      <div class="mobile-drawer__inner wrap">
        <div class="mobile-drawer__links mono">
          <a
            href={i18n.href('/work')}
            class:is-current={cleanPath.startsWith('/work')}
            onclick={() => (menuOpen = false)}
          >
            <span class="idx">01</span> {i18n.t.nav.work}
          </a>
          <a href={i18n.href('/#background')} onclick={() => (menuOpen = false)}>
            <span class="idx">02</span> {i18n.t.nav.background}
          </a>
          <a href={i18n.href('/#github')} onclick={() => (menuOpen = false)}>
            <span class="idx">03</span> {i18n.t.nav.github}
          </a>
          <a
            href={i18n.href('/cv')}
            class:is-current={cleanPath === '/cv'}
            onclick={() => (menuOpen = false)}
          >
            <span class="idx">04</span> {i18n.t.nav.cv}
          </a>
          <a href={i18n.href('/#contact')} onclick={() => (menuOpen = false)}>
            <span class="idx">05</span> {i18n.t.nav.contact}
          </a>
        </div>

        <div class="mobile-drawer__themes" role="group" aria-label={i18n.t.hero.themeGroupAria}>
          {#each THEMES as preset (preset.id)}
            <button
              type="button"
              class="mobile-theme-chip mono"
              class:is-active={workbench.theme === preset.id}
              aria-pressed={workbench.theme === preset.id}
              onclick={() => {
                workbench.setTheme(preset.id);
                workbench.showToast(i18n.t.nav.themeToast(preset.label));
              }}
            >
              <span>{preset.code}</span>
              <span>{preset.shortLabel}</span>
            </button>
          {/each}
        </div>
      </div>
    </nav>
  {/if}
</header>

<style>
  .masthead {
    position: sticky;
    top: 0;
    z-index: 30;
    border-bottom: 1px solid var(--line);
    background: color-mix(in oklab, var(--bg) 88%, transparent);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
  }

  .masthead__inner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.85rem;
    min-height: 64px;
  }

  .masthead__brand {
    flex: none;
    display: inline-flex;
    align-items: center;
    gap: 0.6rem;
    font-weight: 700;
    letter-spacing: -0.02em;
    white-space: nowrap;
  }

  .masthead__brand:hover :global(.monogram) {
    transform: rotate(-7deg) scale(1.06);
  }

  :global(.monogram) {
    transition: transform 0.35s var(--ease-out);
  }

  .masthead__wordmark {
    font-size: 0.98rem;
  }

  .masthead__tld {
    color: var(--ink-dim);
  }

  .masthead__nav {
    display: flex;
    align-items: center;
    gap: clamp(0.75rem, 1.5vw, 1.75rem);
    font-family: var(--font-mono);
    font-size: var(--step-label);
    letter-spacing: 0.11em;
    text-transform: uppercase;
    color: var(--ink-dim);
  }

  .masthead__nav a {
    display: inline-flex;
    align-items: baseline;
    gap: 0.38rem;
    padding-block: 0.3rem;
    white-space: nowrap;
    transition: color 0.2s var(--ease-out);
  }

  .masthead__nav a:hover,
  .masthead__nav a.is-current {
    color: var(--ink);
  }

  .masthead__nav .idx,
  .mobile-drawer__links .idx {
    color: var(--ink-faint);
  }

  .masthead__nav a.is-current .idx,
  .mobile-drawer__links a.is-current .idx {
    color: var(--acid);
  }

  .masthead__end {
    flex: none;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  /* Compact global theme toggle */
  .theme-pill {
    display: inline-flex;
    align-items: center;
    gap: 0.42rem;
    min-height: 36px;
    padding: 0.35rem 0.68rem;
    border: 1px solid var(--line-strong);
    border-radius: 999px;
    background: var(--bg-raise);
    color: var(--ink-dim);
    font-size: 0.64rem;
    letter-spacing: 0.1em;
    cursor: pointer;
    transition:
      color 0.2s var(--ease-out),
      border-color 0.2s var(--ease-out),
      background-color 0.2s var(--ease-out);
  }

  .theme-pill:hover {
    color: var(--ink);
    border-color: var(--ink);
    background: var(--hover-wash);
  }

  .theme-pill__dot {
    width: 8px;
    height: 8px;
    border-radius: 2px;
    background: var(--acid);
    flex: none;
  }

  :global(html.no-js) .theme-pill,
  :global(html.no-js) .menu-toggle {
    display: none;
  }

  /* Language pill (real prerendered EN / PT links) */
  .lang {
    position: relative;
    display: inline-flex;
    align-items: center;
    padding: 3px;
    border: 1px solid var(--line-strong);
    border-radius: 999px;
    background: var(--bg-raise);
  }

  .lang__thumb {
    position: absolute;
    top: 3px;
    bottom: 3px;
    left: 3px;
    width: calc(50% - 3px);
    border-radius: 999px;
    background: var(--acid);
    pointer-events: none;
    transition: transform 0.35s var(--ease-out);
  }

  :global(html[data-lang='pt']) .lang__thumb {
    transform: translateX(100%);
  }

  .lang__btn {
    position: relative;
    z-index: 1;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 28px;
    padding: 0.32rem 0.6rem;
    border-radius: 999px;
    font-family: var(--font-mono);
    font-size: 0.66rem;
    font-weight: 600;
    line-height: 1;
    letter-spacing: 0.12em;
    color: var(--ink-dim);
    cursor: pointer;
    transition: color 0.25s var(--ease-out);
  }

  .lang__btn:hover {
    color: var(--ink);
  }

  .lang__btn[aria-current='page'] {
    color: var(--acid-ink);
  }

  .masthead__gh {
    min-height: 36px;
    padding: 0.45rem 0.84rem;
    font-size: 0.84rem;
  }

  .menu-toggle {
    display: none;
    align-items: center;
    justify-content: center;
    width: 38px;
    height: 38px;
    border-radius: 999px;
    border: 1px solid var(--line-strong);
    background: var(--bg-raise);
    color: var(--ink);
    cursor: pointer;
    transition: border-color 0.2s var(--ease-out), background-color 0.2s var(--ease-out);
  }

  .menu-toggle:hover {
    border-color: var(--ink);
    background: var(--hover-wash);
  }

  /* Mobile drawer */
  .mobile-drawer {
    border-top: 1px solid var(--line);
    background: var(--bg-raise);
  }

  .mobile-drawer__inner {
    display: grid;
    gap: 1rem;
    padding-block: 1rem 1.25rem;
  }

  .mobile-drawer__links {
    display: grid;
    gap: 0.2rem;
    text-transform: uppercase;
    letter-spacing: 0.12em;
  }

  .mobile-drawer__links a {
    display: flex;
    align-items: center;
    gap: 0.65rem;
    min-height: 44px;
    padding-inline: 0.5rem;
    border-radius: 8px;
    color: var(--ink-dim);
    transition: background-color 0.2s var(--ease-out), color 0.2s var(--ease-out);
  }

  .mobile-drawer__links a:hover,
  .mobile-drawer__links a.is-current {
    background: var(--hover-wash);
    color: var(--ink);
  }

  .mobile-drawer__themes {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 0.4rem;
    padding-top: 0.85rem;
    border-top: 1px solid var(--line);
  }

  .mobile-theme-chip {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.3rem;
    min-height: 36px;
    padding: 0.35rem 0.4rem;
    border-radius: 6px;
    border: 1px solid var(--line);
    color: var(--ink-dim);
    font-size: 0.6rem;
    letter-spacing: 0.08em;
    cursor: pointer;
  }

  .mobile-theme-chip.is-active {
    background: var(--acid);
    border-color: var(--acid);
    color: var(--acid-ink);
    font-weight: 600;
  }

  @media (max-width: 1060px) {
    .theme-pill__code {
      display: none;
    }

    .theme-pill {
      padding: 0.35rem 0.55rem;
    }
  }

  @media (max-width: 960px) {
    .masthead__nav {
      display: none;
    }

    .menu-toggle {
      display: inline-flex;
    }

    /* Keep navigation reachable when JS is disabled */
    :global(html.no-js) .masthead__inner {
      flex-wrap: wrap;
      padding-block: 0.65rem;
    }

    :global(html.no-js) .masthead__nav {
      display: flex;
      flex-wrap: wrap;
      width: 100%;
      order: 3;
      padding-top: 0.5rem;
      border-top: 1px solid var(--line);
    }
  }

  @media (max-width: 520px) {
    .masthead__gh-label {
      position: absolute;
      width: 1px;
      height: 1px;
      margin: -1px;
      padding: 0;
      overflow: hidden;
      clip-path: inset(50%);
      white-space: nowrap;
      border: 0;
    }

    .masthead__gh {
      padding: 0.45rem 0.65rem;
    }

    :global(.masthead__gh-arrow) {
      display: none;
    }

    .mobile-drawer__themes {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
</style>
