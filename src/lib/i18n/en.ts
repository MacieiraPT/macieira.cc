export const en = {
  meta: {
    homeTitle: 'Rodrigo Macieira · Full-Stack & Creative Web Developer | macieira.cc',
    homeDescription:
      'Rodrigo Macieira (MacieiraPT): Full-stack and creative web developer in Portugal. TypeScript and Electron desktop tools, C# / .NET + PostgreSQL systems, and interactive WebGL.',
    ogLocale: 'en_GB',
    ogLocaleAlt: 'pt_PT',
    ogImageAlt: 'macieira.cc: Rodrigo Macieira, Full-Stack & WebGL, Portugal.',
    workTitle: 'Selected Work & Case Studies | macieira.cc',
    workDescription:
      'Technical case studies covering EmuHub (TypeScript/Electron), SGEEP.Web (.NET 8 Clean Architecture), and FinSight (ASP.NET Core + PostgreSQL).',
    cvTitle: 'CV / Resume · Rodrigo Macieira | macieira.cc',
    cvDescription:
      'Printable CV and technical summary for Rodrigo Macieira: TypeScript, C# / .NET 8, PostgreSQL, SvelteKit, Electron, and raw WebGL.',
  },
  nav: {
    skip: 'Skip to content',
    brandAria: 'macieira.cc home',
    sectionsAria: 'Primary navigation',
    work: 'work',
    background: 'background',
    github: 'github',
    cv: 'cv',
    contact: 'contact',
    langAria: 'Language selector',
    githubButton: 'GitHub',
    menuOpenAria: 'Open navigation menu',
    menuCloseAria: 'Close navigation menu',
    themeCycleAria: (label: string) => `Theme: ${label}. Click to cycle palette`,
    themeToast: (label: string) => `Theme: ${label}`,
  },
  hero: {
    regionLine: 'Portugal · Full-Stack & Interactive Web',
    availabilityPill: 'Available for hire',
    name: 'Rodrigo Macieira',
    ledeLead: 'Building TypeScript/Electron desktop software and C#/.NET + PostgreSQL systems.',
    ledeSub:
      'Paired with zero-dependency Bayer WebGL on the front page, engineered without bloat or framework lock-in.',
    primaryCta: 'View selected work',
    secondaryCta: 'Email me',
    cvCta: 'CV / Resume',
    proofStackLabel: 'Core Stack',
    proofStackValue: 'TypeScript · C#\u00A0/\u00A0.NET\u00A08 · SvelteKit · WebGL',
    proofCredentialLabel: 'Qualification',
    proofCredentialValue: 'Programador de Informática · EQF\u00A04',
    proofFocusLabel: 'Focus',
    proofFocusValue: 'Clean architecture, safe I/O & pixel GLSL',
    shaderCaption: 'Interactive raw-WebGL Bayer apple (drag, double-click, or press R)',
    shaderMode16: '16-BIT',
    shaderMode8: '8-BIT',
    shaderModeGroupAria: 'Pixel quantization mode',
    shaderCanvasAria: 'Interactive retro 3D apple artwork rendered with Bayer ordered dithering',
    shaderStatusIdle: 'Drag or spin',
    shaderStatusReduced: 'Reduced motion · drag manually',
    workbenchTag: 'SPECIMEN 01 // APPLE.GLSL',
    crtToggleLabel: 'CRT',
    crtToggleAria: 'Toggle subtle CRT scanline overlay',
    spinCta: 'SPIN',
    spinAria: 'Apply rotational spin impulse to the 3D apple',
    telemetryIdle: (tris: number, fps: number) => `${tris} TRIS · ${fps} FPS`,
    telemetryStatic: (tris: number) => `${tris} TRIS · STATIC`,
    telemetrySpins: (n: string, raw: number, fps?: number) =>
      fps ? `${n} ${raw === 1 ? 'SPIN' : 'SPINS'} · ${fps} FPS` : `${n} ${raw === 1 ? 'SPIN' : 'SPINS'}`,
    themeGroupAria: 'Retro shader and site palette presets',
  },
  work: {
    sectionIndex: '01 · selected work',
    heading: 'Shipped desktop and backend systems, with architectural proof.',
    intro:
      'Three flagship repositories spanning Electron process boundaries and Clean Architecture C#/.NET web platforms.',
    archiveCta: 'Inspect all case studies',
    filterGroupAria: 'Filter projects by technology',
    filterAll: (n: number) => `All (${n})`,
    filterDesktop: (n: number) => `TypeScript / Electron (${n})`,
    filterDotnet: (n: number) => `C# / .NET (${n})`,
    filterTitle: 'Archive & Architecture Notes',
    filterHeading: 'Engineering case studies.',
    filterSub:
      'Each entry documents domain constraints, system boundaries, security controls, and measured performance outcomes.',
    caseStudyLink: 'Case study',
    sourceLink: 'Source',
    backToWork: 'Back to selected work',
    breadcrumbAria: 'Breadcrumb',
    metricsAria: 'Measured indicators',
    techStackAria: 'Tech stack',
    architectureLabel: 'Architecture',
    nextProject: 'Next case study',
    problemHeading: 'Problem',
    constraintsHeading: 'Technical constraints',
    decisionsHeading: 'Architecture & key decisions',
    outcomesHeading: 'Measured outcomes',
    metaRole: 'Role',
    metaYear: 'Year',
    metaLicense: 'License',
    metaRepo: 'Repository',
    metaStack: 'Stack',
  },
  background: {
    sectionIndex: '02 · background & stack',
    heading: 'Verified foundation, modern execution.',
    capabilities: [
      {
        label: 'Systems & Backend',
        title: 'C# / .NET 8 & Relational SQL',
        body: 'ASP.NET Core MVC, Entity Framework Core, PostgreSQL indexing, Identity RBAC, audit trails, rate-limiting middleware, and xUnit automated test suites.',
      },
      {
        label: 'Client & Desktop',
        title: 'TypeScript, SvelteKit & Electron',
        body: 'Strict multi-process IPC contracts, React and Svelte 5 interfaces, atomic config persistence, Cloudflare Workers edge caching, and accessibility-first HTML.',
      },
      {
        label: 'Graphics & Craft',
        title: 'Raw WebGL & GLSL Shaders',
        body: 'Zero-dependency WebGL offscreen render targets, 4x4 ordered Bayer dithering shaders, strict bundle budgets, and crisp SVG fallbacks for zero-JS visitors.',
      },
    ],
    tabsAria: 'Background details',
    tabHowIWork: 'How I Work',
    tabTrackRecord: 'Track Record',
    tabEducation: 'Education',
    principlesLabel: 'Engineering ethos',
    principlesTitle: 'Constraint-driven full-stack craft.',
    howIWorkBullets: [
      {
        label: '01 · Typed boundaries first',
        detail:
          'Isolate unsafe I/O behind explicit contracts: argv process spawning and contextBridge in Electron, Clean Architecture layers and Query/Role policies in .NET 8.',
      },
      {
        label: '02 · Measured weight & budgets',
        detail:
          'Ship only the runtime a page actually uses: the 3D Bayer apple runs on ~5 kB gz of zero-dependency WebGL, pages prerender in EN and PT at build time, and desktop bundles avoid router bloat.',
      },
      {
        label: '03 · Resilient fallbacks & ownership',
        detail:
          'Expect crashes and upstream limits: atomic .tmp-to-rename JSON saves, verified offline API snapshots, xUnit business-rule tests, and accessibility before visual polish.',
      },
    ],
    trackRecordLabel: 'Shipped systems',
    trackRecordTitle: 'End-to-end architecture across 4 repositories.',
    trackRecordItems: [
      {
        period: '2026',
        name: 'macieira.cc (v2)',
        scope: 'SvelteKit 3 · Cloudflare Workers · Raw WebGL',
        detail:
          'Prerendered bilingual EN/PT portfolio with edge-cached GitHub proxy, hash-mode CSP, 1-page printable CV, and zero-dependency 4x4 Bayer shaders.',
        href: '/',
      },
      {
        period: '2026',
        name: 'EmuHub',
        scope: 'TypeScript · Electron 44 · React 19',
        detail:
          'Architected 55-console launcher hitting 0.7–0.9 s cold boot, ~9.5 MB heap usage, argv-safe process spawning, and atomic JSON backups.',
        href: '/work/emuhub',
      },
      {
        period: '2026',
        name: 'SGEEP.Web',
        scope: 'C# / .NET 8 · PostgreSQL · xUnit',
        detail:
          'Designed 4-layer Clean Architecture internship platform with 4-role RBAC, NIF modulo-11 checksums, QuestPDF/ClosedXML reports, and rate-limited Identity.',
        href: '/work/sgeep',
      },
      {
        period: '2026',
        name: 'FinSight',
        scope: 'ASP.NET Core 8 · PostgreSQL 16',
        detail:
          'Built multi-provider personal ledger combining Google OAuth + QR TOTP 2FA, DeleteBehavior.Restrict integrity, and filter-synced .xlsx exports.',
        href: '/work/finsight',
      },
    ],
    qualificationLabel: 'National Qualification',
    qualificationTitle: 'Programador de Informática',
    qualificationBody:
      'Three-year Portuguese vocational software engineering track completed at EQF Level 4 (Quadro Nacional de Qualificações) alongside full secondary education.',
    qualificationCta: 'Catalog entry 481040',
    qualificationMeta: 'Public Portuguese National Qualifications syllabus reference (SNQ 7382).',
  },
  github: {
    sectionIndex: '03 · open source & activity',
    heading: 'Public repositories, edge-cached via Worker.',
    prose:
      'Data loads via /api/github on Cloudflare Workers with edge caching (30-minute TTL) and falls back immediately to a curated local snapshot if upstream rate limits hit.',
    visitProfile: 'github.com/MacieiraPT',
    panelTitle: '@MacieiraPT',
    panelSubFallback: 'Full-stack & creative web developer · Portugal',
    statsRepos: 'Public repos',
    statsLanguages: 'Languages',
    statsLatestPush: 'Latest push',
    langMixLabel: 'Owned repo languages',
    latestPushLabel: 'Latest push',
    activityLabel: 'Public activity',
    connecting: 'syncing…',
    liveBadge: 'live via edge proxy',
    cachedBadge: 'edge-cached snapshot',
    snapshotBadge: (date: string) => `snapshot · ${date}`,
    snapshotNote: (date: string, rateLimited?: boolean) =>
      rateLimited
        ? `GitHub upstream rate limit hit; displaying verified ${date} snapshot.`
        : `GitHub upstream unreachable right now; displaying verified ${date} snapshot.`,
    cacheNote: 'Cached at the Cloudflare edge via /api/github to avoid per-visitor API lockouts.',
    activityCount: (count: number, days: number) =>
      `${count} event${count === 1 ? '' : 's'} · last ${days} days`,
    activityQuietSince: (days: number, ago: string) =>
      `latest push ${ago} · quiet last ${days} days`,
    activityQuiet: (days: number) => `quiet · last ${days} days`,
    dayTooltip: (day: string, count: number) =>
      `${day}: ${count} public event${count === 1 ? '' : 's'}`,
    activityAria: (count: number, days: number) =>
      `${count} public GitHub events over the last ${days} days`,
    noRepos: 'No public repositories returned.',
    forksOnly: 'Only forked repositories public.',
    justNow: 'just now',
  },
  footer: {
    sectionIndex: '04 · contact',
    heading: 'Open to full-stack engineering roles and select freelance work.',
    emailCta: 'Email rodrigo@macieira.cc',
    copyEmailCta: 'Copy email',
    cvCta: 'View CV / Print',
    discordCta: 'Copy Discord',
    githubCta: 'GitHub',
    colophonTech: 'Built with SvelteKit, TypeScript, and zero-dependency WebGL on Cloudflare Workers.',
    colophonSource: 'Source on GitHub',
    hostedOn: 'Cloudflare Workers',
    shortcutsHint: 'Keys: [1-5] sections · [P] theme · [B] bit · [R] spin',
    localTimePrefix: 'Lisbon time',
    backToTop: 'Back to top',
    copiedToast: (val: string) => `Copied ${val}`,
    copyFailedToast: (val: string) => `Copy failed: ${val}`,
  },
  cv: {
    backHome: 'Back to portfolio',
    printCta: 'Print / Save PDF',
    roleTitle: 'Full-Stack & Creative Web Developer',
    location: 'Portugal · Remote & Hybrid (EU / Lisbon TZ)',
    status: 'Available for full-stack roles and select freelance',
    contactWeb: 'Web',
    contactEmail: 'Email',
    contactGitHub: 'GitHub',
    contactStatus: 'Status',
    contactLanguages: 'Languages',
    languagesValue: 'Portuguese (Native) · English (Fluent)',
    summaryHeading: 'Profile',
    summaryBody:
      'Portuguese full-stack software developer building TypeScript / Electron desktop software, Clean Architecture C# / .NET 8 + PostgreSQL backends, and lean zero-dependency WebGL frontends.',
    skillsHeading: 'Technical Stack',
    skillGroups: [
      {
        label: 'Backend & Data',
        items:
          'C# · .NET 8 · ASP.NET Core MVC · EF Core · PostgreSQL · ASP.NET Identity · xUnit + Moq',
      },
      {
        label: 'Frontend & Desktop',
        items:
          'TypeScript · SvelteKit · Svelte 5 · React 19 · Electron · Accessible HTML/CSS',
      },
      {
        label: 'WebGL & Edge Infra',
        items:
          'Raw WebGL · GLSL ES shaders · Bayer dithering · Cloudflare Workers · Edge Cache',
      },
    ],
    projectsHeading: 'Selected Engineering Work',
    educationHeading: 'Qualification',
    educationCredentialMeta: 'EQF Level 4 · Quadro Nacional de Qualificações (SNQ 7382)',
    ethosHeading: 'Engineering Principles',
  },
  errorPage: {
    code: 'Error',
    title: 'Nothing on this branch.',
    body: "That page isn't here. It may have moved during the SvelteKit migration, or the route doesn't exist.",
    homeCta: 'Return home',
    workCta: 'Browse case studies',
  },
} as const;

type DeepWiden<T> = T extends (...args: infer A) => infer R
  ? (...args: A) => R extends string ? string : R
  : T extends string
    ? string
    : T extends readonly (infer U)[]
      ? readonly DeepWiden<U>[]
      : T extends object
        ? { readonly [K in keyof T]: DeepWiden<T[K]> }
        : T;

export type TranslationShape = DeepWiden<typeof en>;
