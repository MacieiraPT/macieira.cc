<script lang="ts">
  import { SITE } from '#lib/data/site.ts';
  import { i18n } from '#lib/i18n/index.svelte.ts';
  import { PROJECTS, resolveText } from '#lib/data/projects.ts';
  import SeoHead from '#lib/components/SeoHead.svelte';
  import Icons from '#lib/components/Icons.svelte';
</script>

<SeoHead
  title={i18n.t.meta.cvTitle}
  description={i18n.t.meta.cvDescription}
  path="/cv"
  ogType="profile"
/>

<article class="cv wrap">
  <div class="cv-toolbar">
    <a class="crumb-link mono" href={i18n.href('/')}>
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
      <div class="cv-header__id">
        <h1 class="cv-header__name">{i18n.t.hero.name}</h1>
        <p class="cv-header__role">{i18n.t.cv.roleTitle}</p>
        <p class="cv-header__meta mono">{i18n.t.cv.location}</p>
      </div>

      <dl class="cv-contact mono">
        <div>
          <dt>{i18n.t.cv.contactWeb}</dt>
          <dd><a href={SITE.origin}>{SITE.name}</a></dd>
        </div>
        <div>
          <dt>{i18n.t.cv.contactEmail}</dt>
          <dd><a href={`mailto:${SITE.email}`}>{SITE.email}</a></dd>
        </div>
        <div>
          <dt>{i18n.t.cv.contactGitHub}</dt>
          <dd>
            <a href={SITE.githubUrl} target="_blank" rel="noopener">
              github.com/{SITE.githubUser}
            </a>
          </dd>
        </div>
        <div>
          <dt>{i18n.t.cv.contactLanguages}</dt>
          <dd>{i18n.t.cv.languagesValue}</dd>
        </div>
        <div>
          <dt>{i18n.t.cv.contactStatus}</dt>
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
                <a href={i18n.href(`/work/${project.slug}`)}>{project.title}</a>
                <span class="cv-project__role mono"> · {project.role[i18n.lang]}</span>
              </h3>
              <span class="cv-project__right mono">
                <a class="cv-project__repo" href={project.repoUrl} target="_blank" rel="noopener">
                  github.com/{project.repoName}
                </a>
                <span> · {project.year}</span>
              </span>
            </div>
            <p class="cv-project__headline">{project.headline[i18n.lang]}</p>
            <p class="cv-project__outcomes">{project.outcomes[i18n.lang]}</p>
            <p class="cv-project__metrics mono">
              {project.metrics.map((m) => resolveText(m.value, i18n.lang)).join(' · ')}
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
          <p class="cv-edu__meta mono">{i18n.t.cv.educationCredentialMeta}</p>
          <p>{i18n.t.background.qualificationBody}</p>
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
    max-width: 960px;
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
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, auto);
    align-items: start;
    gap: 1.5rem 2rem;
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
    font-size: 0.72rem;
  }

  .cv-contact > div {
    display: flex;
    gap: 0.75rem;
  }

  .cv-contact dt {
    width: 5.75rem;
    flex: none;
    color: var(--ink-faint);
    text-transform: uppercase;
  }

  .cv-contact a:hover {
    color: var(--acid);
  }

  .cv-section {
    display: grid;
    align-content: start;
    gap: 0.75rem;
  }

  .cv-section__h {
    color: var(--acid);
    text-transform: uppercase;
    letter-spacing: 0.14em;
    font-size: 0.7rem;
  }

  .cv-summary {
    color: var(--ink-dim);
    max-width: 74ch;
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
    font-size: 0.72rem;
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
    flex-wrap: wrap;
    gap: 0.35rem 1rem;
  }

  .cv-project__head h3 {
    font-size: 1.05rem;
    font-weight: 700;
  }

  .cv-project__head h3 a:hover,
  .cv-project__repo:hover {
    color: var(--acid);
  }

  .cv-project__role,
  .cv-project__right {
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
    font-size: 0.72rem;
    margin-top: 0.2rem;
  }

  .cv-split {
    display: grid;
    grid-template-columns: minmax(0, 0.88fr) minmax(0, 1.12fr);
    align-items: start;
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

  .cv-edu__meta {
    color: var(--ink-faint);
    font-size: 0.72rem;
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
    font-size: 0.72rem;
  }

  .cv-principles span {
    color: var(--ink-dim);
    font-size: 0.9rem;
  }

  @media screen and (max-width: 780px) {
    .cv-header,
    .cv-skills__row,
    .cv-split {
      grid-template-columns: 1fr;
    }
  }

  @media print {
    @page {
      size: A4 portrait;
      margin: 10mm 11mm;
    }

    :global(.masthead),
    :global(.footer),
    :global(.atmosphere),
    :global(.skip-link),
    :global(.toast),
    .cv-toolbar {
      display: none !important;
    }

    :global(html),
    :global(body) {
      background: #fff !important;
      color: #111 !important;
      font-size: 8.6pt !important;
      line-height: 1.34 !important;
      width: auto !important;
      max-width: 100% !important;
      min-height: 0 !important;
      margin: 0 !important;
      padding: 0 !important;
      overflow: visible !important;
    }

    :global(.wrap.cv) {
      display: block !important;
      width: 100% !important;
      max-width: 100% !important;
      padding: 0 !important;
      margin: 0 !important;
    }

    .cv-sheet {
      display: block !important;
      width: 100% !important;
      max-width: 100% !important;
      border: 0 !important;
      border-radius: 0 !important;
      padding: 0 !important;
      background: #fff !important;
      color: #111 !important;
    }

    .cv-header {
      display: flex !important;
      flex-wrap: nowrap !important;
      justify-content: space-between !important;
      align-items: flex-start !important;
      gap: 12pt !important;
      padding-bottom: 8pt !important;
      margin-bottom: 9pt !important;
      border-bottom: 1px solid #d4d4d8 !important;
    }

    .cv-header__id {
      flex: 1 1 52%;
      min-width: 0;
    }

    .cv-header__name {
      font-size: 20pt !important;
      line-height: 1 !important;
    }

    .cv-header__role {
      margin-top: 3pt !important;
      font-size: 9.8pt !important;
    }

    .cv-header__meta {
      margin-top: 2pt !important;
      font-size: 7.2pt !important;
    }

    .cv-contact {
      display: block !important;
      flex: 0 1 46%;
      min-width: 0;
      font-size: 7pt !important;
      line-height: 1.4 !important;
    }

    .cv-contact > div {
      display: flex !important;
      gap: 6pt !important;
      margin-bottom: 1.5pt !important;
    }

    .cv-contact dt {
      width: 48pt !important;
      flex: none !important;
    }

    .cv-contact dd {
      min-width: 0;
      overflow-wrap: break-word;
    }

    .cv-section {
      display: block !important;
      margin-bottom: 9pt !important;
      break-inside: avoid;
    }

    .cv-section__h {
      font-size: 7pt !important;
      margin-bottom: 4pt !important;
    }

    .cv-summary {
      font-size: 8.6pt !important;
      max-width: none !important;
    }

    .cv-skills {
      display: block !important;
    }

    .cv-skills__row {
      display: flex !important;
      align-items: baseline !important;
      gap: 10pt !important;
      padding-top: 3.5pt !important;
      margin-top: 3.5pt !important;
      border-top: 1px solid #e4e4e7 !important;
    }

    .cv-skills__row dt {
      width: 96pt !important;
      flex: none !important;
      font-size: 7.2pt !important;
    }

    .cv-skills__row dd {
      flex: 1 1 auto !important;
      font-size: 8.4pt !important;
    }

    .cv-projects {
      display: block !important;
    }

    .cv-project {
      display: block !important;
      padding-top: 5.5pt !important;
      margin-top: 5.5pt !important;
      border-top: 1px solid #e4e4e7 !important;
      break-inside: avoid;
    }

    .cv-project__head {
      display: flex !important;
      justify-content: space-between !important;
      align-items: baseline !important;
      flex-wrap: nowrap !important;
      gap: 8pt !important;
      margin-bottom: 2pt !important;
    }

    .cv-project__head h3 {
      font-size: 9.4pt !important;
    }

    .cv-project__role,
    .cv-project__right {
      font-size: 7pt !important;
      white-space: nowrap;
    }

    .cv-project__headline {
      font-size: 8.5pt !important;
      margin-bottom: 1.5pt !important;
    }

    .cv-project__outcomes {
      font-size: 8.2pt !important;
      margin-bottom: 2pt !important;
    }

    .cv-project__metrics {
      font-size: 7pt !important;
      margin-top: 0 !important;
    }

    .cv-split {
      display: flex !important;
      gap: 16pt !important;
      padding-top: 8pt !important;
      margin-top: 8pt !important;
      border-top: 1px solid #d4d4d8 !important;
      break-inside: avoid;
    }

    .cv-split > .cv-section {
      flex: 1 1 50% !important;
      min-width: 0 !important;
      margin-bottom: 0 !important;
    }

    .cv-split > .cv-section:first-child {
      flex: 0 1 42% !important;
    }

    .cv-edu {
      display: block !important;
    }

    .cv-edu h3 {
      font-size: 9.2pt !important;
      margin-bottom: 2pt !important;
    }

    .cv-edu p {
      font-size: 8.1pt !important;
      margin-bottom: 3pt !important;
    }

    .cv-edu__meta {
      font-size: 7pt !important;
    }

    .cv-principles {
      display: block !important;
    }

    .cv-principles li {
      display: block !important;
      margin-bottom: 4.5pt !important;
    }

    .cv-principles strong {
      display: block !important;
      font-size: 7pt !important;
      margin-bottom: 1pt !important;
    }

    .cv-principles span {
      display: block !important;
      font-size: 8pt !important;
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
    .cv-project__right,
    .cv-project__metrics,
    .cv-edu__meta,
    .cv-contact dt {
      color: #3f3f46 !important;
    }
  }
</style>
