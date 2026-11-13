<script lang="ts">
  import { i18n } from '#lib/i18n/index.svelte.ts';
  import { PROJECTS } from '#lib/data/projects.ts';
  import Icons from '#lib/components/Icons.svelte';
</script>

<svelte:head>
  <title>{i18n.t.meta.cvTitle}</title>
  <meta name="description" content={i18n.t.meta.cvDescription} />
  <link rel="canonical" href="https://macieira.cc/cv" />
  <link rel="alternate" hreflang="en" href="https://macieira.cc/cv" />
  <link rel="alternate" hreflang="pt-PT" href="https://macieira.cc/cv?lang=pt" />
  <link rel="alternate" hreflang="x-default" href="https://macieira.cc/cv" />
</svelte:head>

<article class="cv wrap">
  <div class="cv-toolbar">
    <a class="crumb-link mono" href="/">
      <Icons name="arrow-left" class="icon icon--sm" />
      <span>{i18n.t.cv.backHome}</span>
    </a>

    <button type="button" class="btn btn--solid" onclick={() => window.print()}>
      <Icons name="printer" class="icon icon--sm" />
      <span>{i18n.t.cv.printCta}</span>
    </button>
  </div>

  <div class="cv-sheet">
    <header class="cv-header">
      <div>
        <h1 class="cv-header__name">{i18n.t.hero.name}</h1>
        <p class="cv-header__role">{i18n.t.cv.roleTitle}</p>
        <p class="cv-header__meta mono">{i18n.t.cv.location}</p>
      </div>

      <dl class="cv-contact mono">
        <div>
          <dt>Web</dt>
          <dd><a href="https://macieira.cc">macieira.cc</a></dd>
        </div>
        <div>
          <dt>Email</dt>
          <dd><a href="mailto:rodrigo@macieira.cc">rodrigo@macieira.cc</a></dd>
        </div>
        <div>
          <dt>GitHub</dt>
          <dd><a href="https://github.com/MacieiraPT" target="_blank" rel="noopener">github.com/MacieiraPT</a></dd>
        </div>
        <div>
          <dt>Status</dt>
          <dd>{i18n.t.cv.status}</dd>
        </div>
      </dl>
    </header>

    <section class="cv-section">
      <h2 class="cv-section__h mono">{i18n.t.cv.summaryHeading}</h2>
      <p class="cv-summary">{i18n.t.cv.summaryBody}</p>
    </section>

    <section class="cv-section">
      <h2 class="cv-section__h mono">{i18n.t.cv.skillsHeading}</h2>
      <dl class="cv-skills">
        {#each i18n.t.cv.skillGroups as group (group.label)}
          <div class="cv-skills__row">
            <dt class="mono">{group.label}</dt>
            <dd>{group.items}</dd>
          </div>
        {/each}
      </dl>
    </section>

    <section class="cv-section">
      <h2 class="cv-section__h mono">{i18n.t.cv.projectsHeading}</h2>
      <div class="cv-projects">
        {#each PROJECTS as project (project.slug)}
          <div class="cv-project">
            <div class="cv-project__head">
              <h3>
                <a href="/work/{project.slug}">{project.title}</a>
                <span class="cv-project__role mono"> · {project.role[i18n.lang]}</span>
              </h3>
              <span class="mono">{project.year}</span>
            </div>
            <p class="cv-project__headline">{project.headline[i18n.lang]}</p>
            <p class="cv-project__outcomes">{project.outcomes[i18n.lang]}</p>
            <p class="cv-project__metrics mono">
              {project.metrics.map((m) => m.value).join(' · ')}
            </p>
          </div>
        {/each}
      </div>
    </section>

    <div class="cv-split">
      <section class="cv-section">
        <h2 class="cv-section__h mono">{i18n.t.cv.educationHeading}</h2>
        <div class="cv-edu">
          <h3>{i18n.t.background.qualificationTitle}</h3>
          <p class="cv-edu__meta mono">{i18n.t.hero.proofCredentialValue}</p>
          <p>{i18n.t.background.qualificationBody}</p>
          <p class="cv-edu__ref mono">{i18n.t.background.qualificationMeta}</p>
        </div>
      </section>

      <section class="cv-section">
        <h2 class="cv-section__h mono">{i18n.t.cv.ethosHeading}</h2>
        <ul class="cv-principles">
          {#each i18n.t.background.howIWorkBullets as item (item.label)}
            <li>
              <strong class="mono">{item.label}</strong>
              <span>{item.detail}</span>
            </li>
          {/each}
        </ul>
      </section>
    </div>
  </div>
</article>

<style>
  .cv {
    padding-block: clamp(2rem, 5vh, 3.5rem) var(--section-y);
    display: grid;
    gap: 1.5rem;
  }

  .cv-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    flex-wrap: wrap;
  }

  .crumb-link {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    color: var(--ink-dim);
    transition: color 0.2s var(--ease-out);
  }

  .crumb-link:hover {
    color: var(--acid);
  }

  .cv-sheet {
    display: grid;
    gap: 1.85rem;
    padding: clamp(1.5rem, 3.5vw, 2.75rem);
    border: 1px solid var(--line-strong);
    border-radius: var(--radius);
    background: var(--bg-raise);
  }

  .cv-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 1.5rem;
    flex-wrap: wrap;
    padding-bottom: 1.35rem;
    border-bottom: 1px solid var(--line);
  }

  .cv-header__name {
    font-size: clamp(2rem, 4vw, 3.1rem);
    font-weight: 800;
    letter-spacing: -0.04em;
    line-height: 1;
  }

  .cv-header__role {
    margin-top: 0.4rem;
    font-size: 1.08rem;
    font-weight: 600;
    color: var(--ink);
  }

  .cv-header__meta {
    margin-top: 0.35rem;
    color: var(--ink-faint);
  }

  .cv-contact {
    display: grid;
    gap: 0.3rem;
    font-size: 0.7rem;
  }

  .cv-contact > div {
    display: flex;
    gap: 0.75rem;
  }

  .cv-contact dt {
    width: 4.5rem;
    color: var(--ink-faint);
    text-transform: uppercase;
  }

  .cv-contact a:hover {
    color: var(--acid);
  }

  .cv-section {
    display: grid;
    gap: 0.75rem;
  }

  .cv-section__h {
    color: var(--acid);
    text-transform: uppercase;
    letter-spacing: 0.14em;
    font-size: 0.68rem;
  }

  .cv-summary {
    color: var(--ink-dim);
    max-width: 72ch;
  }

  .cv-skills {
    display: grid;
    gap: 0.65rem;
  }

  .cv-skills__row {
    display: grid;
    grid-template-columns: 12rem minmax(0, 1fr);
    gap: 0.5rem 1.25rem;
    padding-top: 0.55rem;
    border-top: 1px solid var(--line);
  }

  .cv-skills__row dt {
    color: var(--ink);
    font-size: 0.7rem;
  }

  .cv-skills__row dd {
    color: var(--ink-dim);
    font-size: 0.94rem;
  }

  .cv-projects {
    display: grid;
    gap: 1.1rem;
  }

  .cv-project {
    display: grid;
    gap: 0.35rem;
    padding-top: 0.85rem;
    border-top: 1px solid var(--line);
  }

  .cv-project__head {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 1rem;
  }

  .cv-project__head h3 {
    font-size: 1.05rem;
    font-weight: 700;
  }

  .cv-project__head h3 a:hover {
    color: var(--acid);
  }

  .cv-project__role {
    color: var(--ink-faint);
    font-weight: 400;
  }

  .cv-project__headline {
    color: var(--ink);
    font-size: 0.95rem;
    font-weight: 500;
  }

  .cv-project__outcomes {
    color: var(--ink-dim);
    font-size: 0.92rem;
  }

  .cv-project__metrics {
    color: var(--ink-faint);
    font-size: 0.68rem;
    margin-top: 0.2rem;
  }

  .cv-split {
    display: grid;
    grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr);
    gap: 1.5rem 2.25rem;
    padding-top: 1rem;
    border-top: 1px solid var(--line);
  }

  .cv-edu {
    display: grid;
    gap: 0.45rem;
  }

  .cv-edu h3 {
    font-size: 1.05rem;
    font-weight: 700;
  }

  .cv-edu__meta,
  .cv-edu__ref {
    color: var(--ink-faint);
    font-size: 0.68rem;
  }

  .cv-edu p:not(.mono) {
    color: var(--ink-dim);
    font-size: 0.92rem;
  }

  .cv-principles {
    display: grid;
    gap: 0.65rem;
  }

  .cv-principles li {
    display: grid;
    gap: 0.2rem;
  }

  .cv-principles strong {
    color: var(--ink);
    font-size: 0.68rem;
  }

  .cv-principles span {
    color: var(--ink-dim);
    font-size: 0.9rem;
  }

  @media (max-width: 780px) {
    .cv-skills__row,
    .cv-split {
      grid-template-columns: 1fr;
    }
  }

  @media print {
    @page {
      size: A4 portrait;
      margin: 12mm;
    }

    :global(.masthead),
    :global(.footer),
    :global(.atmosphere),
    .cv-toolbar {
      display: none !important;
    }

    :global(html),
    :global(body) {
      background: #fff !important;
      color: #111 !important;
      font-size: 9.5pt;
      width: auto !important;
      max-width: 100% !important;
      min-height: 0 !important;
      margin: 0 !important;
      padding: 0 !important;
      overflow: visible !important;
    }

    :global(.wrap.cv) {
      width: 100% !important;
      max-width: 100% !important;
      padding: 0 !important;
      margin: 0 !important;
    }

    .cv-sheet {
      width: 100%;
      max-width: 100%;
      border: 0;
      padding: 0;
      background: #fff !important;
      color: #111 !important;
      gap: 0.95rem;
    }

    .cv-header,
    .cv-split,
    .cv-section,
    .cv-project,
    .cv-skills__row,
    .cv-split > *,
    .cv-contact {
      min-width: 0;
      max-width: 100%;
    }

    .cv-header__name {
      font-size: 24pt !important;
    }

    .cv-header,
    .cv-skills__row,
    .cv-project,
    .cv-split {
      border-color: #d4d4d8 !important;
    }

    .cv-section__h,
    .cv-header__role,
    .cv-skills__row dt,
    .cv-project__head h3,
    .cv-project__headline,
    .cv-principles strong {
      color: #111 !important;
    }

    .cv-summary,
    .cv-skills__row dd,
    .cv-project__outcomes,
    .cv-edu p,
    .cv-principles span,
    .cv-header__meta,
    .cv-project__role,
    .cv-project__metrics,
    .cv-edu__meta,
    .cv-edu__ref,
    .cv-contact dt {
      color: #3f3f46 !important;
    }
  }
</style>
