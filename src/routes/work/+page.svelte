<script lang="ts">
  import { i18n } from '#lib/i18n/index.svelte.ts';
  import { PROJECTS, type ProjectCategory } from '#lib/data/projects.ts';
  import ProjectVisual from '#lib/components/ProjectVisual.svelte';
  import Icons from '#lib/components/Icons.svelte';

  type Filter = 'all' | ProjectCategory;

  let activeFilter = $state<Filter>('all');

  let filteredProjects = $derived(
    activeFilter === 'all' ? PROJECTS : PROJECTS.filter((p) => p.category === activeFilter)
  );
</script>

<svelte:head>
  <title>{i18n.t.meta.workTitle}</title>
  <meta name="description" content={i18n.t.meta.workDescription} />
  <link rel="canonical" href="https://macieira.cc/work" />
  <link rel="alternate" hreflang="en" href="https://macieira.cc/work" />
  <link rel="alternate" hreflang="pt-PT" href="https://macieira.cc/work?lang=pt" />
  <link rel="alternate" hreflang="x-default" href="https://macieira.cc/work" />
</svelte:head>

<section class="archive wrap">
  <header class="archive__head">
    <p class="section-label">{i18n.t.work.filterTitle}</p>
    <h1 class="archive__title">{i18n.t.work.filterHeading}</h1>
    <p class="prose">{i18n.t.work.filterSub}</p>

    <div class="filters" role="group" aria-label="Filter projects by technology">
      <button
        type="button"
        class="filter-btn mono"
        class:is-active={activeFilter === 'all'}
        aria-pressed={activeFilter === 'all'}
        onclick={() => (activeFilter = 'all')}
      >
        {i18n.t.work.filterAll}
      </button>
      <button
        type="button"
        class="filter-btn mono"
        class:is-active={activeFilter === 'desktop'}
        aria-pressed={activeFilter === 'desktop'}
        onclick={() => (activeFilter = 'desktop')}
      >
        {i18n.t.work.filterDesktop}
      </button>
      <button
        type="button"
        class="filter-btn mono"
        class:is-active={activeFilter === 'dotnet'}
        aria-pressed={activeFilter === 'dotnet'}
        onclick={() => (activeFilter = 'dotnet')}
      >
        {i18n.t.work.filterDotnet}
      </button>
    </div>
  </header>

  <div class="archive__list">
    {#each filteredProjects as project (project.slug)}
      <article class="archive-card">
        <div class="archive-card__visual">
          <ProjectVisual slug={project.slug} />
        </div>

        <div class="archive-card__content">
          <div class="archive-card__meta mono">
            <span>{project.year} · {project.categoryLabel[i18n.lang]}</span>
            <span>{project.license}</span>
          </div>

          <h2 class="archive-card__title">
            <a href="/work/{project.slug}">{project.title}</a>
          </h2>

          <p class="archive-card__headline">{project.headline[i18n.lang]}</p>
          <p class="archive-card__summary">{project.summary[i18n.lang]}</p>

          <dl class="archive-card__metrics">
            {#each project.metrics.slice(0, 3) as metric}
              <div>
                <dt class="mono">{metric.value}</dt>
                <dd>{metric.label[i18n.lang]}</dd>
              </div>
            {/each}
          </dl>

          <ul class="archive-card__tags">
            {#each project.stack as tech}
              <li class="mono">{tech}</li>
            {/each}
          </ul>

          <div class="archive-card__actions">
            <a class="btn btn--solid" href="/work/{project.slug}">
              <span>{i18n.t.work.caseStudyLink}</span>
              <Icons name="arrow-up-right" class="icon icon--sm" />
            </a>
            <a class="btn btn--ghost" href={project.repoUrl} target="_blank" rel="noopener">
              <Icons name="github" />
              <span>{project.repoName}</span>
            </a>
          </div>
        </div>
      </article>
    {/each}
  </div>
</section>

<style>
  .archive {
    padding-block: clamp(2.5rem, 6vh, 4.5rem) var(--section-y);
    display: grid;
    gap: clamp(2.5rem, 5vh, 4rem);
  }

  .archive__head {
    display: grid;
    justify-items: start;
    gap: 1rem;
  }

  .archive__title {
    font-size: clamp(2.1rem, 4.8vw, 4rem);
    font-weight: 800;
    font-variation-settings: 'wdth' 112;
    line-height: 1;
    letter-spacing: -0.035em;
  }

  .filters {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-top: 0.5rem;
  }

  :global(html.no-js) .filters {
    display: none;
  }

  .filter-btn {
    padding: 0.48rem 0.9rem;
    border-radius: 999px;
    border: 1px solid var(--line-strong);
    color: var(--ink-dim);
    cursor: pointer;
    transition: background-color 0.2s var(--ease-out), color 0.2s var(--ease-out),
      border-color 0.2s var(--ease-out);
  }

  .filter-btn:hover {
    color: var(--ink);
    border-color: var(--ink);
  }

  .filter-btn.is-active {
    background: var(--acid);
    border-color: var(--acid);
    color: var(--acid-ink);
    font-weight: 600;
  }

  .archive__list {
    display: grid;
    gap: clamp(1.5rem, 3vh, 2.25rem);
  }

  .archive-card {
    display: grid;
    grid-template-columns: minmax(0, 5fr) minmax(0, 7fr);
    gap: clamp(1.5rem, 3vw, 2.75rem);
    align-items: center;
    padding: clamp(1.25rem, 2.5vw, 2rem);
    border: 1px solid var(--line);
    border-radius: var(--radius);
    background: var(--bg-raise);
  }

  .archive-card__content {
    display: grid;
    gap: 0.9rem;
  }

  .archive-card__meta {
    display: flex;
    justify-content: space-between;
    color: var(--ink-faint);
  }

  .archive-card__title {
    font-size: clamp(1.45rem, 2.4vw, 2.15rem);
    font-weight: 700;
    letter-spacing: -0.025em;
    line-height: 1.1;
  }

  .archive-card__title a:hover {
    color: var(--acid);
  }

  .archive-card__headline {
    color: var(--ink);
    font-weight: 500;
  }

  .archive-card__summary {
    color: var(--ink-dim);
    font-size: 0.96rem;
  }

  .archive-card__metrics {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.85rem;
    padding-block: 0.9rem;
    border-block: 1px solid var(--line);
  }

  .archive-card__metrics dt {
    color: var(--acid);
    font-weight: 600;
    font-size: 0.82rem;
  }

  .archive-card__metrics dd {
    color: var(--ink-dim);
    font-size: 0.8rem;
    margin-top: 0.2rem;
  }

  .archive-card__tags {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
  }

  .archive-card__tags li {
    padding: 0.22rem 0.55rem;
    border-radius: 999px;
    border: 1px solid var(--line);
    color: var(--ink-dim);
    font-size: 0.64rem;
  }

  .archive-card__actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.65rem;
    margin-top: 0.35rem;
  }

  @media (max-width: 960px) {
    .archive-card {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 600px) {
    .archive-card__metrics {
      grid-template-columns: 1fr;
    }
  }
</style>
