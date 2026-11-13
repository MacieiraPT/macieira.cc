<script lang="ts">
  import { i18n } from '#lib/i18n/index.svelte.ts';
  import { PROJECTS } from '#lib/data/projects.ts';
  import RetroAppleCanvas from '#lib/components/RetroAppleCanvas.svelte';
  import ProjectVisual from '#lib/components/ProjectVisual.svelte';
  import GitHubPanel from '#lib/components/GitHubPanel.svelte';
  import Icons from '#lib/components/Icons.svelte';
</script>

<svelte:head>
  <title>{i18n.t.meta.homeTitle}</title>
  <meta name="description" content={i18n.t.meta.homeDescription} />
  <link rel="canonical" href="https://macieira.cc/" />
  <link rel="alternate" hreflang="en" href="https://macieira.cc/" />
  <link rel="alternate" hreflang="pt-PT" href="https://macieira.cc/?lang=pt" />
  <link rel="alternate" hreflang="x-default" href="https://macieira.cc/" />

  <meta property="og:type" content="website" />
  <meta property="og:url" content="https://macieira.cc/" />
  <meta property="og:site_name" content="macieira.cc" />
  <meta property="og:title" content={i18n.t.meta.homeTitle} />
  <meta property="og:description" content={i18n.t.meta.homeDescription} />
  <meta property="og:locale" content={i18n.t.meta.ogLocale} />
  <meta property="og:locale:alternate" content="pt_PT" />
  <meta property="og:image" content="https://macieira.cc/assets/og.png" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:image:alt" content="macieira.cc: Rodrigo Macieira, Full-Stack & WebGL, Portugal." />
  <meta name="twitter:card" content="summary_large_image" />
</svelte:head>

<!-- HERO -->
<section class="hero wrap" aria-labelledby="hero-name">
  <div class="hero__grid">
    <div class="hero__copy">
      <p class="hero__region mono">{i18n.t.hero.regionLine}</p>

      <h1 class="hero__name" id="hero-name">{i18n.t.hero.name}</h1>

      <p class="hero__lede">
        <span class="hero__lede-strong">{i18n.t.hero.ledeLead}</span>
        <span>{' '}{i18n.t.hero.ledeSub}</span>
      </p>

      <div class="hero__actions">
        <a class="btn btn--solid" href="#work">
          <span>{i18n.t.hero.primaryCta}</span>
        </a>
        <a class="btn btn--acid-soft" href="/work">
          <span>{i18n.t.hero.tertiaryCta}</span>
          <Icons name="arrow-up-right" class="icon icon--sm" />
        </a>
        <a class="btn btn--ghost" href="mailto:rodrigo@macieira.cc">
          <Icons name="mail" />
          <span>{i18n.t.hero.secondaryCta}</span>
        </a>
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
    </div>

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
    <a class="btn btn--ghost" href="/work">
      <span>{i18n.t.work.archiveCta}</span>
      <Icons name="arrow-up-right" class="icon icon--sm" />
    </a>
  </div>

  <div class="work-grid">
    {#each PROJECTS as project (project.slug)}
      <article class="project-card">
        <ProjectVisual slug={project.slug} compact />

        <div class="project-card__meta mono">
          <span>{project.year} · {project.categoryLabel[i18n.lang]}</span>
          <span class="project-card__metric">{project.metrics[0]?.value}</span>
        </div>

        <h3 class="project-card__title">
          <a href="/work/{project.slug}">{project.title}</a>
        </h3>

        <p class="project-card__summary">{project.summary[i18n.lang]}</p>

        <ul class="project-card__tags" aria-label="Tech stack">
          {#each project.stack.slice(0, 4) as tech}
            <li class="mono">{tech}</li>
          {/each}
        </ul>

        <div class="project-card__links">
          <a class="project-link project-link--primary mono" href="/work/{project.slug}">
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

  <div class="foundation-grid">
    <article class="surface-card">
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
    </article>

    <article class="surface-card">
      <p class="surface-card__label mono">{i18n.t.background.principlesLabel}</p>
      <h3 class="surface-card__title">{i18n.t.background.principlesTitle}</h3>
      <p class="surface-card__body">{i18n.t.background.principlesBody}</p>
    </article>
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
    padding-block: clamp(2.5rem, 6vh, 4.75rem) clamp(3.5rem, 8vh, 6rem);
  }

  .hero__grid {
    display: grid;
    grid-template-columns: minmax(0, 1.12fr) minmax(0, 0.88fr);
    align-items: center;
    gap: clamp(2rem, 4.5vw, 4.5rem);
  }

  .hero__copy {
    display: grid;
    justify-items: start;
    gap: clamp(1.1rem, 2.2vh, 1.6rem);
  }

  .hero__region {
    color: var(--ink-dim);
    text-transform: uppercase;
    letter-spacing: 0.14em;
  }

  .hero__name {
    font-size: clamp(2.6rem, 6.2vw, 5.75rem);
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
    padding-top: 1.05rem;
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
    width: 100%;
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 1rem;
    margin-top: 0.5rem;
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
    gap: 0.9rem;
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

  .project-card__meta {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    color: var(--ink-faint);
  }

  .project-card__metric {
    color: var(--acid);
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
    font-size: 0.95rem;
    line-height: 1.5;
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

  .foundation-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: clamp(1rem, 2vw, 1.35rem);
    margin-top: clamp(1rem, 2vw, 1.35rem);
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
    .hero__grid {
      grid-template-columns: 1fr;
    }

    .work-grid,
    .capability-grid {
      grid-template-columns: repeat(auto-fit, minmax(min(300px, 100%), 1fr));
    }

    .github-split {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 700px) {
    .hero-proof,
    .foundation-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
