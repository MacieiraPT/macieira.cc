<script lang="ts">
  import { i18n } from '#lib/i18n/index.svelte.ts';
  import { PROJECTS } from '#lib/data/projects.ts';
  import RetroAppleCanvas from '#lib/components/RetroAppleCanvas.svelte';
  import ProjectVisual from '#lib/components/ProjectVisual.svelte';
  import GitHubPanel from '#lib/components/GitHubPanel.svelte';
  import Icons from '#lib/components/Icons.svelte';

  type BackgroundTab = 'how' | 'track' | 'education';

  const TAB_ORDER: BackgroundTab[] = ['how', 'track', 'education'];
  let activeTab = $state<BackgroundTab>('how');

  let canonicalUrl = $derived(i18n.lang === 'pt' ? 'https://macieira.cc/pt' : 'https://macieira.cc/');

  let personJsonLd = $derived(
    JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Person',
      name: 'Rodrigo Macieira',
      alternateName: 'MacieiraPT',
      url: canonicalUrl,
      nationality: 'PT',
      jobTitle: i18n.t.cv.roleTitle,
      email: 'rodrigo@macieira.cc',
      sameAs: ['https://github.com/MacieiraPT'],
      makesOffer: {
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: i18n.t.cv.roleTitle,
          description: i18n.t.cv.summaryBody,
        },
      },
      hasCredential: {
        '@type': 'EducationalOccupationalCredential',
        name: 'Programador/a de Informática',
        credentialCategory: 'Professional certification',
        educationalLevel: 'Level 4, Quadro Nacional de Qualificações (EQF 4)',
        url: 'https://catalogo.snq.gov.pt/qualificacoesDetalhe/7382',
      },
    })
  );

  function onTabKeyDown(e: KeyboardEvent) {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    const idx = TAB_ORDER.indexOf(activeTab);
    const delta = e.key === 'ArrowRight' ? 1 : -1;
    const next = TAB_ORDER[(idx + delta + TAB_ORDER.length) % TAB_ORDER.length];
    activeTab = next;
    document.getElementById(`bg-tab-${next}`)?.focus();
  }
</script>

<svelte:head>
  <title>{i18n.t.meta.homeTitle}</title>
  <meta name="description" content={i18n.t.meta.homeDescription} />
  <link rel="canonical" href={canonicalUrl} />
  <link rel="alternate" hreflang="en" href="https://macieira.cc/" />
  <link rel="alternate" hreflang="pt-PT" href="https://macieira.cc/pt" />
  <link rel="alternate" hreflang="x-default" href="https://macieira.cc/" />

  <meta property="og:type" content="website" />
  <meta property="og:url" content={canonicalUrl} />
  <meta property="og:site_name" content="macieira.cc" />
  <meta property="og:title" content={i18n.t.meta.homeTitle} />
  <meta property="og:description" content={i18n.t.meta.homeDescription} />
  <meta property="og:locale" content={i18n.t.meta.ogLocale} />
  <meta property="og:locale:alternate" content={i18n.t.meta.ogLocaleAlt} />
  <meta property="og:image" content="https://macieira.cc/assets/og.png" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:image:alt" content={i18n.t.meta.ogImageAlt} />
  <meta name="twitter:card" content="summary_large_image" />
  {@html `<script type="application/ld+json">${personJsonLd}</script>`}
</svelte:head>

<!-- HERO -->
<section class="hero wrap" aria-labelledby="hero-name">
  <div class="hero__grid">
    <div class="hero__copy">
      <div class="hero__topline">
        <p class="hero__region mono">{i18n.t.hero.regionLine}</p>
        <p class="availability-pill mono">
          <span class="availability-pill__dot" aria-hidden="true"></span>
          <span>{i18n.t.hero.availabilityPill}</span>
        </p>
      </div>

      <h1 class="hero__name" id="hero-name">{i18n.t.hero.name}</h1>

      <p class="hero__lede">
        <span class="hero__lede-strong">{i18n.t.hero.ledeLead}</span>
        <span>{' '}{i18n.t.hero.ledeSub}</span>
      </p>

      <div class="hero__actions">
        <a class="btn btn--solid" href="#work">
          <span>{i18n.t.hero.primaryCta}</span>
        </a>
        <a class="btn btn--acid-soft" href={i18n.href('/cv')}>
          <Icons name="file-text" class="icon icon--sm" />
          <span>{i18n.t.hero.cvCta}</span>
        </a>
        <a class="btn btn--ghost" href="mailto:rodrigo@macieira.cc">
          <Icons name="mail" />
          <span>{i18n.t.hero.secondaryCta}</span>
        </a>
      </div>
    </div>

    <dl class="hero-proof">
      <div>
        <dt class="mono">{i18n.t.hero.proofStackLabel}</dt>
        <dd>{i18n.t.hero.proofStackValue}</dd>
      </div>
      <div>
        <dt class="mono">{i18n.t.hero.proofCredentialLabel}</dt>
        <dd>{i18n.t.hero.proofCredentialValue}</dd>
      </div>
      <div>
        <dt class="mono">{i18n.t.hero.proofFocusLabel}</dt>
        <dd>{i18n.t.hero.proofFocusValue}</dd>
      </div>
    </dl>

    <div class="hero__visual">
      <RetroAppleCanvas />
      <p class="hero__caption mono">{i18n.t.hero.shaderCaption}</p>
    </div>
  </div>
</section>

<!-- 01 SELECTED WORK -->
<section class="section wrap" id="work" aria-labelledby="work-heading">
  <div class="section__head work-head">
    <div class="work-head__copy">
      <p class="section-label">{i18n.t.work.sectionIndex}</p>
      <h2 class="h2" id="work-heading">{i18n.t.work.heading}</h2>
      <p class="prose">{i18n.t.work.intro}</p>
    </div>
    <a class="btn btn--ghost" href={i18n.href('/work')}>
      <span>{i18n.t.work.archiveCta}</span>
      <Icons name="arrow-up-right" class="icon icon--sm" />
    </a>
  </div>

  <div class="work-grid">
    {#each PROJECTS as project (project.slug)}
      <article class="project-card">
        <a
          class="project-card__visual"
          href={i18n.href(`/work/${project.slug}`)}
          tabindex="-1"
          aria-hidden="true"
        >
          <ProjectVisual slug={project.slug} compact />
        </a>

        <div class="project-card__meta mono">
          <span>{project.year} · {project.categoryLabel[i18n.lang]}</span>
          <span>{project.license}</span>
        </div>

        <h3 class="project-card__title">
          <a href={i18n.href(`/work/${project.slug}`)}>{project.title}</a>
        </h3>

        <p class="project-card__summary">{project.summary[i18n.lang]}</p>

        <dl class="project-card__kpis">
          {#each project.metrics.slice(0, 2) as metric}
            <div>
              <dt class="mono">{metric.value}</dt>
              <dd>{metric.label[i18n.lang]}</dd>
            </div>
          {/each}
        </dl>

        <ul class="project-card__tags" aria-label={i18n.t.work.techStackAria}>
          {#each project.stack.slice(0, 4) as tech}
            <li class="mono">{tech}</li>
          {/each}
        </ul>

        <div class="project-card__links">
          <a
            class="project-link project-link--primary mono"
            href={i18n.href(`/work/${project.slug}`)}
          >
            <span>{i18n.t.work.caseStudyLink}</span>
            <Icons name="arrow-up-right" class="icon icon--sm" />
          </a>
          <a class="project-link mono" href={project.repoUrl} target="_blank" rel="noopener">
            <Icons name="github" size={14} />
            <span>{i18n.t.work.sourceLink}</span>
          </a>
        </div>
      </article>
    {/each}
  </div>
</section>

<!-- 02 BACKGROUND & STACK -->
<section class="section wrap" id="background" aria-labelledby="background-heading">
  <div class="section__head">
    <p class="section-label">{i18n.t.background.sectionIndex}</p>
    <h2 class="h2" id="background-heading">{i18n.t.background.heading}</h2>
  </div>

  <div class="capability-grid">
    {#each i18n.t.background.capabilities as cap (cap.title)}
      <article class="surface-card">
        <p class="surface-card__label mono">{cap.label}</p>
        <h3 class="surface-card__title">{cap.title}</h3>
        <p class="surface-card__body">{cap.body}</p>
      </article>
    {/each}
  </div>

  <div class="bg-tabs">
    <div
      class="bg-tablist"
      role="tablist"
      aria-label={i18n.t.background.tabsAria}
      tabindex="-1"
      onkeydown={onTabKeyDown}
    >
      <button
        id="bg-tab-how"
        type="button"
        role="tab"
        class="bg-tab mono"
        class:is-active={activeTab === 'how'}
        aria-selected={activeTab === 'how'}
        aria-controls="bg-panel-how"
        tabindex={activeTab === 'how' ? 0 : -1}
        onclick={() => (activeTab = 'how')}
      >
        {i18n.t.background.tabHowIWork}
      </button>
      <button
        id="bg-tab-track"
        type="button"
        role="tab"
        class="bg-tab mono"
        class:is-active={activeTab === 'track'}
        aria-selected={activeTab === 'track'}
        aria-controls="bg-panel-track"
        tabindex={activeTab === 'track' ? 0 : -1}
        onclick={() => (activeTab = 'track')}
      >
        {i18n.t.background.tabTrackRecord}
      </button>
      <button
        id="bg-tab-education"
        type="button"
        role="tab"
        class="bg-tab mono"
        class:is-active={activeTab === 'education'}
        aria-selected={activeTab === 'education'}
        aria-controls="bg-panel-education"
        tabindex={activeTab === 'education' ? 0 : -1}
        onclick={() => (activeTab = 'education')}
      >
        {i18n.t.background.tabEducation}
      </button>
    </div>

    <div
      id="bg-panel-how"
      class="bg-panel surface-card"
      role="tabpanel"
      aria-labelledby="bg-tab-how"
      hidden={activeTab !== 'how'}
    >
      <p class="surface-card__label mono">{i18n.t.background.principlesLabel}</p>
      <h3 class="surface-card__title">{i18n.t.background.principlesTitle}</h3>
      <ul class="ethos-grid">
        {#each i18n.t.background.howIWorkBullets as item (item.label)}
          <li class="ethos-item">
            <p class="ethos-item__label mono">{item.label}</p>
            <p class="ethos-item__detail">{item.detail}</p>
          </li>
        {/each}
      </ul>
    </div>

    <div
      id="bg-panel-track"
      class="bg-panel surface-card"
      role="tabpanel"
      aria-labelledby="bg-tab-track"
      hidden={activeTab !== 'track'}
    >
      <p class="surface-card__label mono">{i18n.t.background.trackRecordLabel}</p>
      <h3 class="surface-card__title">{i18n.t.background.trackRecordTitle}</h3>
      <ol class="timeline">
        {#each i18n.t.background.trackRecordItems as entry (entry.name)}
          <li class="timeline__item">
            <span class="timeline__year mono">{entry.period}</span>
            <div class="timeline__body">
              <div class="timeline__head">
                <a class="timeline__name" href={i18n.href(entry.href)}>{entry.name}</a>
                <span class="timeline__scope mono">{entry.scope}</span>
              </div>
              <p class="timeline__desc">{entry.detail}</p>
            </div>
          </li>
        {/each}
      </ol>
    </div>

    <div
      id="bg-panel-education"
      class="bg-panel surface-card"
      role="tabpanel"
      aria-labelledby="bg-tab-education"
      hidden={activeTab !== 'education'}
    >
      <p class="surface-card__label mono">{i18n.t.background.qualificationLabel}</p>
      <h3 class="surface-card__title">{i18n.t.background.qualificationTitle}</h3>
      <p class="surface-card__body">{i18n.t.background.qualificationBody}</p>
      <a
        class="btn btn--ghost surface-card__cta"
        href="https://catalogo.snq.gov.pt/qualificacoesDetalhe/7382"
        target="_blank"
        rel="noopener"
      >
        <span>{i18n.t.background.qualificationCta}</span>
        <Icons name="arrow-up-right" class="icon icon--sm" />
      </a>
      <p class="surface-card__footnote mono">{i18n.t.background.qualificationMeta}</p>
    </div>
  </div>
</section>

<!-- 03 GITHUB & OPEN SOURCE -->
<section class="section wrap" id="github" aria-labelledby="github-heading">
  <div class="github-split">
    <div class="github-split__intro">
      <p class="section-label">{i18n.t.github.sectionIndex}</p>
      <h2 class="h2" id="github-heading">{i18n.t.github.heading}</h2>
      <p class="prose">{i18n.t.github.prose}</p>
      <a
        class="btn btn--solid"
        href="https://github.com/MacieiraPT"
        target="_blank"
        rel="me noopener"
      >
        <Icons name="github" />
        <span>{i18n.t.github.visitProfile}</span>
        <Icons name="arrow-up-right" class="icon icon--sm" />
      </a>
    </div>

    <div class="github-split__panel">
      <GitHubPanel />
    </div>
  </div>
</section>

<style>
  /* Hero */
  .hero {
    padding-block: clamp(2rem, 5.5vh, 4.5rem) clamp(3.25rem, 7.5vh, 5.75rem);
  }

  .hero__grid {
    display: grid;
    grid-template-columns: minmax(0, 1.12fr) minmax(0, 0.88fr);
    grid-template-areas:
      'copy visual'
      'proof visual';
    align-items: center;
    column-gap: clamp(2rem, 4.5vw, 4.5rem);
    row-gap: clamp(1.25rem, 2.5vh, 1.75rem);
  }

  .hero__copy {
    grid-area: copy;
    display: grid;
    justify-items: start;
    align-self: end;
    gap: clamp(0.95rem, 1.8vh, 1.45rem);
  }

  .hero__topline {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.55rem 0.9rem;
  }

  .hero__region {
    color: var(--ink-dim);
    text-transform: uppercase;
    letter-spacing: 0.14em;
  }

  .availability-pill {
    display: inline-flex;
    align-items: center;
    gap: 0.42rem;
    padding: 0.25rem 0.62rem;
    border-radius: 999px;
    border: 1px solid color-mix(in oklab, var(--acid) 45%, transparent);
    background: color-mix(in oklab, var(--acid) 10%, transparent);
    color: var(--ink);
    font-size: 0.64rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .availability-pill__dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--acid);
  }

  .hero__name {
    font-size: clamp(2.5rem, 6.2vw, 5.75rem);
    font-weight: 800;
    font-variation-settings: 'wdth' 116;
    line-height: 0.96;
    letter-spacing: -0.045em;
    margin-left: -0.03em;
    color: var(--ink);
    text-wrap: balance;
  }

  .hero__lede {
    max-width: 48ch;
    padding-top: 1rem;
    border-top: 1px solid var(--line);
    color: var(--ink-dim);
    text-wrap: pretty;
  }

  .hero__lede-strong {
    color: var(--ink);
  }

  .hero__actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.65rem;
  }

  .hero-proof {
    grid-area: proof;
    align-self: start;
    width: 100%;
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 1rem;
    padding-top: 1.15rem;
    border-top: 1px solid var(--line);
  }

  .hero-proof dt {
    color: var(--ink-faint);
    text-transform: uppercase;
    letter-spacing: 0.14em;
    font-size: 0.64rem;
    margin-bottom: 0.35rem;
  }

  .hero-proof dd {
    font-size: 0.88rem;
    color: var(--ink-dim);
    line-height: 1.4;
  }

  .hero__visual {
    grid-area: visual;
    display: grid;
    gap: 0.65rem;
  }

  .hero__caption {
    color: var(--ink-faint);
    text-align: center;
  }

  /* 01 Selected work */
  .work-head {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 1.5rem;
  }

  .work-head__copy {
    display: grid;
    gap: 0.85rem;
  }

  .work-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: clamp(1rem, 2vw, 1.5rem);
  }

  .project-card {
    display: flex;
    flex-direction: column;
    gap: 0.85rem;
    padding: clamp(1rem, 1.8vw, 1.35rem);
    border: 1px solid var(--line);
    border-radius: var(--radius);
    background: var(--bg-raise);
    transition: border-color 0.25s var(--ease-out), transform 0.25s var(--ease-out);
  }

  .project-card:hover {
    border-color: var(--line-strong);
    transform: translateY(-2px);
  }

  .project-card__visual {
    display: block;
    border-radius: 8px;
  }

  .project-card__meta {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    color: var(--ink-faint);
  }

  .project-card__title {
    font-size: var(--step-h3);
    font-weight: 700;
    letter-spacing: -0.02em;
    line-height: 1.15;
  }

  .project-card__title a:hover {
    color: var(--acid);
  }

  .project-card__summary {
    color: var(--ink-dim);
    font-size: 0.94rem;
    line-height: 1.5;
  }

  .project-card__kpis {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.65rem;
    padding-block: 0.7rem;
    border-block: 1px solid var(--line);
  }

  .project-card__kpis dt {
    color: var(--acid);
    font-weight: 600;
    font-size: 0.78rem;
  }

  .project-card__kpis dd {
    color: var(--ink-faint);
    font-size: 0.76rem;
    line-height: 1.35;
    margin-top: 0.15rem;
  }

  .project-card__tags {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
    margin-top: auto;
  }

  .project-card__tags li {
    padding: 0.22rem 0.55rem;
    border-radius: 999px;
    border: 1px solid var(--line);
    color: var(--ink-dim);
    font-size: 0.64rem;
  }

  .project-card__links {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    padding-top: 0.85rem;
    border-top: 1px solid var(--line);
  }

  .project-link {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    color: var(--ink-dim);
    transition: color 0.2s var(--ease-out);
  }

  .project-link--primary {
    color: var(--ink);
    font-weight: 600;
  }

  .project-link:hover {
    color: var(--acid);
  }

  /* 02 Background & stack */
  .capability-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: clamp(1rem, 2vw, 1.35rem);
  }

  .bg-tabs {
    margin-top: clamp(1.25rem, 2.5vw, 1.75rem);
    display: grid;
    gap: 0.9rem;
  }

  .bg-tablist {
    display: inline-flex;
    flex-wrap: wrap;
    gap: 0.35rem;
    padding: 4px;
    width: fit-content;
    border: 1px solid var(--line-strong);
    border-radius: 999px;
    background: var(--bg-raise);
  }

  .bg-tab {
    padding: 0.42rem 0.9rem;
    border-radius: 999px;
    font-size: 0.68rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--ink-dim);
    cursor: pointer;
    transition: background-color 0.2s var(--ease-out), color 0.2s var(--ease-out);
  }

  .bg-tab:hover {
    color: var(--ink);
  }

  .bg-tab.is-active {
    background: var(--acid);
    color: var(--acid-ink);
    font-weight: 600;
  }

  .bg-panel[hidden] {
    display: none;
  }

  :global(html.no-js) .bg-tablist {
    display: none;
  }

  :global(html.no-js) .bg-panel[hidden] {
    display: grid;
  }

  .surface-card {
    display: grid;
    align-content: start;
    justify-items: start;
    gap: 0.75rem;
    padding: clamp(1.25rem, 2.2vw, 1.75rem);
    border: 1px solid var(--line);
    border-radius: var(--radius);
    background: var(--bg-raise);
  }

  .surface-card__label {
    color: var(--acid);
    text-transform: uppercase;
    letter-spacing: 0.14em;
    font-size: 0.65rem;
  }

  .surface-card__title {
    font-size: var(--step-h3);
    font-weight: 700;
    letter-spacing: -0.02em;
    line-height: 1.15;
  }

  .surface-card__body {
    color: var(--ink-dim);
    font-size: 0.96rem;
    text-wrap: pretty;
  }

  .surface-card__cta {
    margin-top: 0.35rem;
  }

  .surface-card__footnote {
    color: var(--ink-faint);
    font-size: 0.68rem;
  }

  .ethos-grid {
    width: 100%;
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 1rem;
    margin-top: 0.35rem;
  }

  .ethos-item {
    display: grid;
    align-content: start;
    gap: 0.45rem;
    padding-top: 0.85rem;
    border-top: 1px solid var(--line);
  }

  .ethos-item__label {
    color: var(--ink);
    font-size: 0.68rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .ethos-item__detail {
    color: var(--ink-dim);
    font-size: 0.92rem;
    line-height: 1.5;
  }

  .timeline {
    width: 100%;
    display: grid;
    gap: 0.85rem;
    margin-top: 0.35rem;
  }

  .timeline__item {
    display: grid;
    grid-template-columns: 4.5rem minmax(0, 1fr);
    gap: 1rem;
    padding-top: 0.85rem;
    border-top: 1px solid var(--line);
  }

  .timeline__year {
    color: var(--acid);
    font-size: 0.72rem;
  }

  .timeline__body {
    display: grid;
    gap: 0.25rem;
  }

  .timeline__head {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 0.4rem 0.9rem;
  }

  .timeline__name {
    font-weight: 700;
    letter-spacing: -0.015em;
  }

  .timeline__name:hover {
    color: var(--acid);
  }

  .timeline__scope {
    color: var(--ink-faint);
    font-size: 0.66rem;
  }

  .timeline__desc {
    color: var(--ink-dim);
    font-size: 0.92rem;
  }

  /* 03 GitHub */
  .github-split {
    display: grid;
    grid-template-columns: minmax(0, 5fr) minmax(0, 7fr);
    gap: clamp(2rem, 5vw, 4.5rem);
    align-items: start;
  }

  .github-split__intro {
    display: grid;
    justify-items: start;
    gap: 1.1rem;
  }

  /* Responsive */
  @media (max-width: 1020px) {
    .hero {
      padding-block: 1.5rem 2.75rem;
    }

    .hero__grid {
      grid-template-columns: 1fr;
      grid-template-areas:
        'copy'
        'visual'
        'proof';
      row-gap: 1.5rem;
    }

    .work-grid,
    .capability-grid,
    .ethos-grid {
      grid-template-columns: repeat(auto-fit, minmax(min(280px, 100%), 1fr));
    }

    .github-split {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 700px) {
    .hero-proof,
    .project-card__kpis {
      grid-template-columns: 1fr;
    }

    .timeline__item {
      grid-template-columns: 1fr;
      gap: 0.3rem;
    }
  }
</style>
