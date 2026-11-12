<script lang="ts">
  import { i18n } from '#lib/i18n/index.svelte.ts';
  import ProjectVisual from '#lib/components/ProjectVisual.svelte';
  import Icons from '#lib/components/Icons.svelte';

  let { data } = $props();
  let project = $derived(data.project);
  let nextProject = $derived(data.nextProject);
</script>

<svelte:head>
  <title>{project.seoTitle[i18n.lang]}</title>
  <meta name="description" content={project.seoDescription[i18n.lang]} />
  <link rel="canonical" href="https://macieira.cc/work/{project.slug}" />
  <link rel="alternate" hreflang="en" href="https://macieira.cc/work/{project.slug}" />
  <link rel="alternate" hreflang="pt-PT" href="https://macieira.cc/work/{project.slug}?lang=pt" />
  <link rel="alternate" hreflang="x-default" href="https://macieira.cc/work/{project.slug}" />

  <meta property="og:type" content="article" />
  <meta property="og:url" content="https://macieira.cc/work/{project.slug}" />
  <meta property="og:site_name" content="macieira.cc" />
  <meta property="og:title" content={project.seoTitle[i18n.lang]} />
  <meta property="og:description" content={project.seoDescription[i18n.lang]} />
  <meta property="og:locale" content={i18n.t.meta.ogLocale} />
  <meta property="og:image" content="https://macieira.cc/assets/og.png" />
  <meta name="twitter:card" content="summary_large_image" />
</svelte:head>

<article class="case-study wrap">
  <nav class="case-study__crumb" aria-label="Breadcrumb">
    <a class="crumb-link mono" href="/work">
      <Icons name="arrow-left" class="icon icon--sm" />
      <span>{i18n.t.work.backToWork}</span>
    </a>
  </nav>

  <header class="case-study__hero">
    <div class="case-study__intro">
      <p class="section-label">{project.year} · {project.categoryLabel[i18n.lang]}</p>
      <h1 class="case-study__title">{project.title}</h1>
      <p class="case-study__headline">{project.headline[i18n.lang]}</p>
      <p class="prose">{project.summary[i18n.lang]}</p>

      <div class="case-study__actions">
        <a class="btn btn--solid" href={project.repoUrl} target="_blank" rel="noopener">
          <Icons name="github" />
          <span>{project.repoName}</span>
          <Icons name="arrow-up-right" class="icon icon--sm" />
        </a>
        <a class="btn btn--ghost" href="/#contact">
          <Icons name="mail" />
          <span>{i18n.t.hero.secondaryCta}</span>
        </a>
      </div>
    </div>

    <div class="case-study__visual">
      <ProjectVisual slug={project.slug} />
    </div>
  </header>

  <dl class="meta-strip">
    <div>
      <dt class="mono">{i18n.t.work.metaRole}</dt>
      <dd>{project.role[i18n.lang]}</dd>
    </div>
    <div>
      <dt class="mono">{i18n.t.work.metaYear}</dt>
      <dd>{project.year}</dd>
    </div>
    <div>
      <dt class="mono">{i18n.t.work.metaLicense}</dt>
      <dd>{project.license}</dd>
    </div>
    <div>
      <dt class="mono">{i18n.t.work.metaRepo}</dt>
      <dd>
        <a class="meta-link" href={project.repoUrl} target="_blank" rel="noopener">
          {project.repoName}
        </a>
      </dd>
    </div>
  </dl>

  <section class="metrics-band" aria-label="Measured indicators">
    {#each project.metrics as metric}
      <div class="metric-tile">
        <p class="metric-tile__val">{metric.value}</p>
        <p class="metric-tile__label">{metric.label[i18n.lang]}</p>
      </div>
    {/each}
  </section>

  <section class="narrative-pair">
    <div class="narrative-block">
      <h2 class="narrative-block__h">{i18n.t.work.problemHeading}</h2>
      <p class="prose">{project.problem[i18n.lang]}</p>
    </div>
    <div class="narrative-block">
      <h2 class="narrative-block__h">{i18n.t.work.constraintsHeading}</h2>
      <p class="prose">{project.constraints[i18n.lang]}</p>
    </div>
  </section>

  <section class="decisions" aria-labelledby="decisions-title">
    <div class="section__head">
      <p class="section-label">ARCHITECTURE</p>
      <h2 class="h2" id="decisions-title">{i18n.t.work.decisionsHeading}</h2>
    </div>

    <div class="decisions__grid">
      {#each project.decisions as item, index}
        <article class="decision-card">
          <p class="decision-card__idx mono">0{index + 1}</p>
          <h3 class="decision-card__title">{item.title[i18n.lang]}</h3>
          <p class="decision-card__body">{item.body[i18n.lang]}</p>
        </article>
      {/each}
    </div>
  </section>

  <section class="outcomes">
    <div class="outcomes__box">
      <div>
        <p class="section-label">{i18n.t.work.outcomesHeading}</p>
        <p class="outcomes__text">{project.outcomes[i18n.lang]}</p>
      </div>
      <div class="outcomes__stack">
        <p class="section-label">{i18n.t.work.metaStack}</p>
        <ul class="stack-pills">
          {#each project.stack as tech}
            <li class="mono">{tech}</li>
          {/each}
        </ul>
      </div>
    </div>
  </section>

  <nav class="next-nav" aria-label={i18n.t.work.nextProject}>
    <a class="next-card" href="/work/{nextProject.slug}">
      <span class="section-label">{i18n.t.work.nextProject}</span>
      <span class="next-card__row">
        <span class="next-card__title">{nextProject.title}</span>
        <Icons name="arrow-up-right" />
      </span>
      <span class="next-card__sub">{nextProject.headline[i18n.lang]}</span>
    </a>
  </nav>
</article>

<style>
  .case-study {
    padding-block: clamp(2rem, 5vh, 3.5rem) var(--section-y);
    display: grid;
    gap: clamp(2.5rem, 5vh, 4rem);
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

  .case-study__hero {
    display: grid;
    grid-template-columns: minmax(0, 1.05fr) minmax(0, 0.95fr);
    gap: clamp(1.75rem, 4vw, 3.5rem);
    align-items: center;
  }

  .case-study__intro {
    display: grid;
    justify-items: start;
    gap: 1rem;
  }

  .case-study__title {
    font-size: clamp(2.5rem, 5.5vw, 4.75rem);
    font-weight: 800;
    font-variation-settings: 'wdth' 116;
    line-height: 0.98;
    letter-spacing: -0.04em;
  }

  .case-study__headline {
    font-size: clamp(1.12rem, 1.6vw, 1.35rem);
    color: var(--ink);
    font-weight: 500;
    max-width: 44ch;
  }

  .case-study__actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.65rem;
    margin-top: 0.4rem;
  }

  .meta-strip {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 1rem;
    padding: 1.25rem;
    border: 1px solid var(--line);
    border-radius: var(--radius);
    background: var(--bg-raise);
  }

  .meta-strip dt {
    color: var(--ink-faint);
    text-transform: uppercase;
    letter-spacing: 0.14em;
    font-size: 0.62rem;
    margin-bottom: 0.35rem;
  }

  .meta-strip dd {
    font-size: 0.95rem;
    font-weight: 500;
  }

  .meta-link {
    border-bottom: 1px solid var(--line-strong);
  }

  .meta-link:hover {
    color: var(--acid);
    border-color: var(--acid);
  }

  .metrics-band {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 1rem;
  }

  .metric-tile {
    padding: 1.25rem;
    border: 1px solid var(--line);
    border-radius: var(--radius);
    background: var(--bg-raise);
  }

  .metric-tile__val {
    font-size: clamp(1.35rem, 2.3vw, 1.85rem);
    font-weight: 700;
    color: var(--acid);
    letter-spacing: -0.03em;
  }

  .metric-tile__label {
    margin-top: 0.4rem;
    color: var(--ink-dim);
    font-size: 0.9rem;
  }

  .narrative-pair {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: clamp(1.25rem, 3vw, 2.5rem);
    padding-top: 1.5rem;
    border-top: 1px solid var(--line);
  }

  .narrative-block {
    display: grid;
    align-content: start;
    gap: 0.65rem;
  }

  .narrative-block__h {
    font-size: var(--step-h3);
    font-weight: 700;
    letter-spacing: -0.02em;
  }

  .decisions__grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 1rem;
  }

  .decision-card {
    display: grid;
    align-content: start;
    gap: 0.65rem;
    padding: clamp(1.2rem, 2.2vw, 1.65rem);
    border: 1px solid var(--line);
    border-radius: var(--radius);
    background: var(--bg-raise);
  }

  .decision-card__idx {
    color: var(--acid);
  }

  .decision-card__title {
    font-size: 1.15rem;
    font-weight: 700;
    letter-spacing: -0.015em;
  }

  .decision-card__body {
    color: var(--ink-dim);
    font-size: 0.95rem;
  }

  .outcomes__box {
    display: grid;
    grid-template-columns: minmax(0, 1.1fr) minmax(0, 0.9fr);
    gap: clamp(1.5rem, 3vw, 2.5rem);
    padding: clamp(1.25rem, 2.5vw, 2rem);
    border: 1px solid var(--line);
    border-radius: var(--radius);
    background: var(--bg-raise);
  }

  .outcomes__text {
    margin-top: 0.65rem;
    font-size: 1.05rem;
    color: var(--ink);
  }

  .stack-pills {
    margin-top: 0.75rem;
    display: flex;
    flex-wrap: wrap;
    gap: 0.45rem;
  }

  .stack-pills li {
    padding: 0.25rem 0.6rem;
    border: 1px solid var(--line);
    border-radius: 999px;
    color: var(--ink-dim);
    font-size: 0.68rem;
  }

  .next-card {
    display: grid;
    gap: 0.5rem;
    padding: clamp(1.25rem, 2.5vw, 1.85rem);
    border: 1px solid var(--line);
    border-radius: var(--radius);
    background: var(--bg-raise);
    transition: border-color 0.25s var(--ease-out), transform 0.25s var(--ease-out);
  }

  .next-card:hover {
    border-color: var(--acid);
    transform: translateY(-2px);
  }

  .next-card__row {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .next-card__title {
    font-size: clamp(1.35rem, 2.8vw, 2.1rem);
    font-weight: 700;
    letter-spacing: -0.025em;
  }

  .next-card__sub {
    color: var(--ink-dim);
  }

  @media (max-width: 960px) {
    .case-study__hero,
    .narrative-pair,
    .decisions__grid,
    .outcomes__box {
      grid-template-columns: 1fr;
    }

    .meta-strip,
    .metrics-band {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @media (max-width: 560px) {
    .meta-strip,
    .metrics-band {
      grid-template-columns: 1fr;
    }
  }
</style>
