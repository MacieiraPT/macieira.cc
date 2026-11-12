<script lang="ts">
  import { page } from '$app/state';
  import { i18n } from '#lib/i18n/index.svelte.ts';
  import Icons from './Icons.svelte';

  let pathname = $derived(page.url.pathname);
</script>

<header class="masthead">
  <div class="masthead__inner wrap">
    <a class="masthead__brand" href="/" aria-label={i18n.t.nav.brandAria}>
      <Icons name="pixel-apple" class="monogram" size={26} />
      <span class="masthead__wordmark">macieira<span class="masthead__tld">.cc</span></span>
    </a>

    <nav class="masthead__nav" aria-label={i18n.t.nav.sectionsAria}>
      <a href="/work" class:is-current={pathname.startsWith('/work')}>
        <span class="idx">01</span> {i18n.t.nav.work}
      </a>
      <a href="/#background">
        <span class="idx">02</span> {i18n.t.nav.background}
      </a>
      <a href="/#github">
        <span class="idx">03</span> {i18n.t.nav.github}
      </a>
      <a href="/#contact">
        <span class="idx">04</span> {i18n.t.nav.contact}
      </a>
    </nav>

    <div class="masthead__end">
      <div class="lang" role="group" aria-label={i18n.t.nav.langAria}>
        <span class="lang__thumb" aria-hidden="true"></span>
        <button
          class="lang__btn"
          type="button"
          lang="en"
          aria-pressed={i18n.lang === 'en'}
          onclick={() => i18n.set('en')}
        >
          EN
        </button>
        <button
          class="lang__btn"
          type="button"
          lang="pt-PT"
          aria-pressed={i18n.lang === 'pt'}
          onclick={() => i18n.set('pt')}
        >
          PT
        </button>
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
    </div>
  </div>
</header>

<style>
  .masthead {
    position: sticky;
    top: 0;
    z-index: 30;
    border-bottom: 1px solid var(--line);
    background: color-mix(in oklab, var(--bg) 86%, transparent);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
  }

  .masthead__inner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
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
    gap: clamp(0.9rem, 1.8vw, 2rem);
    font-family: var(--font-mono);
    font-size: var(--step-label);
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--ink-dim);
  }

  .masthead__nav a {
    display: inline-flex;
    align-items: baseline;
    gap: 0.4rem;
    padding-block: 0.3rem;
    white-space: nowrap;
    transition: color 0.2s var(--ease-out);
  }

  .masthead__nav a:hover,
  .masthead__nav a.is-current {
    color: var(--ink);
  }

  .masthead__nav .idx {
    color: var(--ink-faint);
  }

  .masthead__nav a.is-current .idx {
    color: var(--acid);
  }

  .masthead__end {
    flex: none;
    display: flex;
    align-items: center;
    gap: 0.6rem;
  }

  /* Language pill */
  .lang {
    position: relative;
    display: inline-flex;
    align-items: center;
    padding: 3px;
    border: 1px solid var(--line-strong);
    border-radius: 999px;
    background: var(--bg-raise);
  }

  :global(html.no-js) .lang {
    display: none;
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
    transition: transform 0.4s var(--ease-out);
  }

  :global(html[data-lang='pt']) .lang__thumb {
    transform: translateX(100%);
  }

  .lang__btn {
    position: relative;
    z-index: 1;
    padding: 0.34rem 0.62rem;
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

  .lang__btn[aria-pressed='true'] {
    color: #08080a;
  }

  .masthead__gh {
    min-height: 36px;
    padding: 0.45rem 0.88rem;
    font-size: 0.84rem;
  }

  @media (max-width: 960px) {
    .masthead__nav {
      display: none;
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
  }
</style>
