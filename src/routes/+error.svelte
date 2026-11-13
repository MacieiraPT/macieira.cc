<script lang="ts">
  import { page } from '$app/state';
  import { i18n } from '#lib/i18n/index.svelte.ts';
  import Icons from '#lib/components/Icons.svelte';
</script>

<svelte:head>
  <title>{page.status} | macieira.cc</title>
  <meta name="robots" content="noindex" />
</svelte:head>

<section class="lost wrap">
  <div class="lost__mark">
    <Icons name="pixel-apple" size={64} />
  </div>

  <p class="lost__code mono">{i18n.t.errorPage.code} {page.status}</p>
  <h1 class="lost__title">{i18n.t.errorPage.title}</h1>
  <p class="lost__body prose">{i18n.t.errorPage.body}</p>

  <div class="lost__actions">
    <a class="btn btn--solid" href="/">
      <Icons name="arrow-left" class="icon icon--sm" />
      <span>{i18n.t.errorPage.homeCta}</span>
    </a>
    <a class="btn btn--ghost" href="/work">
      <span>{i18n.t.errorPage.workCta}</span>
      <Icons name="arrow-up-right" class="icon icon--sm" />
    </a>
  </div>
</section>

<style>
  .lost {
    min-height: 70svh;
    display: grid;
    align-content: center;
    justify-items: start;
    gap: 1.25rem;
    padding-block: clamp(4rem, 12vh, 8rem);
  }

  .lost__code {
    color: var(--ink-faint);
    letter-spacing: 0.2em;
    text-transform: uppercase;
  }

  .lost__title {
    font-size: clamp(2.4rem, 7vw, 5rem);
    font-weight: 800;
    font-variation-settings: 'wdth' 116;
    line-height: 0.96;
    letter-spacing: -0.04em;
    max-width: 14ch;
    text-wrap: balance;
  }

  .lost__body {
    padding-top: 1rem;
    border-top: 1px solid var(--line);
  }

  .lost__actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    margin-top: 0.4rem;
  }
</style>
