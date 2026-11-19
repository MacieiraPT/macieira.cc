import type { TranslationShape } from './en.ts';

export const pt = {
  meta: {
    homeTitle: 'Rodrigo Macieira · Programador Full-Stack & Web Criativa | macieira.cc',
    homeDescription:
      'Rodrigo Macieira (MacieiraPT): programador full-stack e web criativa em Portugal. Aplicações desktop TypeScript/Electron, sistemas C#/.NET + PostgreSQL e WebGL interativo.',
    ogLocale: 'pt_PT',
    ogLocaleAlt: 'en_GB',
    ogImageAlt: 'macieira.cc: Rodrigo Macieira, Full-Stack & WebGL, Portugal.',
    workTitle: 'Projetos Escolhidos e Estudos de Caso | macieira.cc',
    workDescription:
      'Estudos de caso técnicos do EmuHub (TypeScript/Electron), SGEEP.Web (Arquitetura Limpa .NET 8) e FinSight (ASP.NET Core + PostgreSQL).',
    cvTitle: 'Currículo / CV · Rodrigo Macieira | macieira.cc',
    cvDescription:
      'Currículo técnico e resumo de engenharia de Rodrigo Macieira: TypeScript, C# / .NET 8, PostgreSQL, SvelteKit, Electron e WebGL nativo.',
  },
  nav: {
    skip: 'Saltar para o conteúdo',
    brandAria: 'macieira.cc início',
    sectionsAria: 'Navegação principal',
    work: 'projetos',
    background: 'percurso',
    github: 'github',
    cv: 'cv',
    contact: 'contacto',
    langAria: 'Selecionar idioma',
    githubButton: 'GitHub',
    menuOpenAria: 'Abrir menu de navegação',
    menuCloseAria: 'Fechar menu de navegação',
    themeCycleAria: (label: string) => `Tema: ${label}. Clica para alternar paleta`,
    themeToast: (label: string) => `Tema: ${label}`,
  },
  hero: {
    regionLine: 'Portugal · Full-Stack & Web Interativa',
    availabilityPill: 'Disponível para propostas',
    name: 'Rodrigo Macieira',
    ledeLead: 'Software desktop em TypeScript/Electron e sistemas web em C#/.NET com PostgreSQL.',
    ledeSub:
      'Combinado com WebGL Bayer sem dependências na página inicial, construído sem peso desnecessário.',
    primaryCta: 'Ver projetos escolhidos',
    secondaryCta: 'Enviar email',
    cvCta: 'Currículo / CV',
    proofStackLabel: 'Stack Principal',
    proofStackValue: 'TypeScript · C#\u00A0/\u00A0.NET\u00A08 · SvelteKit · WebGL',
    proofCredentialLabel: 'Qualificação',
    proofCredentialValue: 'Programador de Informática · QNQ\u00A04 (EQF\u00A04)',
    proofFocusLabel: 'Foco',
    proofFocusValue: 'Arquitetura limpa, I/O seguro & GLSL 16-bit',
    shaderCaption: 'Maçã 3D WebGL nativa com dithering Bayer (arrasta, duplo clique ou tecla R)',
    shaderMode16: '16-BIT',
    shaderMode8: '8-BIT',
    shaderModeGroupAria: 'Modo de quantização de píxeis',
    shaderCanvasAria: 'Ilustração 3D interativa de maçã em estilo retro com dithering Bayer',
    shaderStatusIdle: 'Arrasta ou roda',
    shaderStatusReduced: 'Movimento reduzido · arrasta manualmente',
    workbenchTag: 'ESPÉCIME 01 // APPLE.GLSL',
    crtToggleLabel: 'CRT',
    crtToggleAria: 'Alternar camada subtil de scanlines CRT',
    spinCta: 'RODAR',
    spinAria: 'Aplicar impulso rotacional à maçã 3D',
    telemetryIdle: (tris: number, fps: number) => `${tris} TRIS · ${fps} FPS`,
    telemetryStatic: (tris: number) => `${tris} TRIS · ESTÁTICO`,
    telemetrySpins: (n: string, raw: number, fps?: number) =>
      fps
        ? `${n} ${raw === 1 ? 'VOLTA' : 'VOLTAS'} · ${fps} FPS`
        : `${n} ${raw === 1 ? 'VOLTA' : 'VOLTAS'}`,
    themeGroupAria: 'Predefinições de paleta retro e tema',
  },
  work: {
    sectionIndex: '01 · trabalho escolhido',
    heading: 'Sistemas desktop e backend publicados, com detalhe arquitetural.',
    intro:
      'Três repositórios principais entre fronteiras de processos Electron e plataformas C#/.NET em Arquitetura Limpa.',
    archiveCta: 'Explorar estudos de caso',
    filterGroupAria: 'Filtrar projetos por tecnologia',
    filterAll: (n: number) => `Todos (${n})`,
    filterDesktop: (n: number) => `TypeScript / Electron (${n})`,
    filterDotnet: (n: number) => `C# / .NET (${n})`,
    filterTitle: 'Arquivo & Notas de Arquitetura',
    filterHeading: 'Estudos de caso técnicos.',
    filterSub:
      'Cada página documenta restrições de domínio, separação de camadas, controlos de segurança e métricas medidas.',
    caseStudyLink: 'Estudo de caso',
    sourceLink: 'Código',
    backToWork: 'Voltar a trabalho escolhido',
    breadcrumbAria: 'Caminho de navegação',
    metricsAria: 'Indicadores medidos',
    techStackAria: 'Tecnologias utilizadas',
    architectureLabel: 'Arquitetura',
    nextProject: 'Próximo projeto',
    problemHeading: 'Problema',
    constraintsHeading: 'Restrições técnicas',
    decisionsHeading: 'Arquitetura e decisões principais',
    outcomesHeading: 'Resultados medidos',
    metaRole: 'Função',
    metaYear: 'Ano',
    metaLicense: 'Licença',
    metaRepo: 'Repositório',
    metaStack: 'Stack',
  },
  background: {
    sectionIndex: '02 · percurso e stack',
    heading: 'Base sólida, execução atual.',
    capabilities: [
      {
        label: 'Sistemas & Backend',
        title: 'C# / .NET 8 e SQL Relacional',
        body: 'ASP.NET Core MVC, Entity Framework Core, indexação em PostgreSQL, RBAC com Identity, auditoria, middleware de rate-limiting e testes automatizados em xUnit.',
      },
      {
        label: 'Cliente & Desktop',
        title: 'TypeScript, SvelteKit e Electron',
        body: 'Contratos IPC tipados entre processos, interfaces em React e Svelte 5, persistência atómica de ficheiros, cache na Cloudflare Workers e HTML acessível.',
      },
      {
        label: 'Gráficos & Detalhe',
        title: 'WebGL Nativo e Shaders GLSL',
        body: 'Render targets offscreen em WebGL sem dependências externas, shaders de dithering Bayer 4x4, orçamento rigoroso de bundle e fallbacks SVG nítidos sem JS.',
      },
    ],
    tabsAria: 'Detalhes do percurso',
    tabHowIWork: 'Como Trabalho',
    tabTrackRecord: 'Trajeto e Projetos',
    tabEducation: 'Formação',
    principlesLabel: 'Como trabalho',
    principlesTitle: 'Engenharia guiada por restrições.',
    howIWorkBullets: [
      {
        label: '01 · Fronteiras tipadas primeiro',
        detail:
          'Isolar I/O atrás de contratos explícitos: lançamento por vetor argv e contextBridge em Electron, Arquitetura Limpa e políticas por perfil em .NET 8.',
      },
      {
        label: '02 · Peso medido e orçamento',
        detail:
          'Entregar apenas o runtime necessário: a maçã Bayer corre em ~5 kB gz de WebGL sem dependências, as páginas EN e PT são pré-renderizadas em build e bundles mantêm-se leves.',
      },
      {
        label: '03 · Resiliência e verificação',
        detail:
          'Contar com falhas de disco ou rede: escrita JSON atómica via .tmp + .bak, snapshots verificados na API, testes xUnit e acessibilidade antes do detalhe visual.',
      },
    ],
    trackRecordLabel: 'Sistemas entregues',
    trackRecordTitle: 'Arquitetura ponta a ponta em 4 repositórios.',
    trackRecordItems: [
      {
        period: '2026',
        name: 'macieira.cc (v2)',
        scope: 'SvelteKit 3 · Cloudflare Workers · WebGL Nativo',
        detail:
          'Portfólio bilingue EN/PT pré-renderizado com proxy GitHub na edge, CSP por hashes, CV imprimível em 1 página e shaders Bayer 4x4 sem dependências.',
        href: '/',
      },
      {
        period: '2026',
        name: 'EmuHub',
        scope: 'TypeScript · Electron 44 · React 19',
        detail:
          'Launcher para 55 consolas com arranque em 0.7–0.9 s, ~9.5 MB de heap, lançamento seguro sem shell e persistência JSON atómica.',
        href: '/work/emuhub',
      },
      {
        period: '2026',
        name: 'SGEEP.Web',
        scope: 'C# / .NET 8 · PostgreSQL · xUnit',
        detail:
          'Plataforma escolar em Arquitetura Limpa de 4 camadas com RBAC para 4 perfis, validação NIF módulo 11, PDF/Excel e rate limiting.',
        href: '/work/sgeep',
      },
      {
        period: '2026',
        name: 'FinSight',
        scope: 'ASP.NET Core 8 · PostgreSQL 16',
        detail:
          'Aplicação financeira com Google OAuth + TOTP 2FA por QR, proteção DeleteBehavior.Restrict e exportação .xlsx coerente com gráficos.',
        href: '/work/finsight',
      },
    ],
    qualificationLabel: 'Qualificação Nacional',
    qualificationTitle: 'Programador de Informática',
    qualificationBody:
      'Curso profissional de desenvolvimento de software concluído ao longo de três anos: nível 4 do Quadro Nacional de Qualificações (EQF 4) com diploma do ensino secundário.',
    qualificationCta: 'Ver qualificação 481040',
    qualificationMeta: 'Registo oficial no Catálogo Nacional de Qualificações (SNQ 7382).',
  },
  github: {
    sectionIndex: '03 · código aberto e atividade',
    heading: 'Repositórios públicos com cache na Worker.',
    prose:
      'Os dados são lidos através de /api/github em Cloudflare Workers com cache de 30 minutos na edge e fallback imediato para registo local verificado se a API limitar pedidos.',
    visitProfile: 'github.com/MacieiraPT',
    panelTitle: '@MacieiraPT',
    panelSubFallback: 'Programador full-stack & web criativa · Portugal',
    statsRepos: 'Repos públicos',
    statsLanguages: 'Linguagens',
    statsLatestPush: 'Último push',
    langMixLabel: 'Linguagens nos repositórios',
    latestPushLabel: 'Último push',
    activityLabel: 'Atividade pública',
    connecting: 'a sincronizar…',
    liveBadge: 'em direto pela Worker',
    cachedBadge: 'cache na edge',
    snapshotBadge: (date: string) => `arquivo · ${date}`,
    snapshotNote: (date: string, rateLimited?: boolean) =>
      rateLimited
        ? `Limite de pedidos do GitHub atingido; a mostrar o registo verificado de ${date}.`
        : `API do GitHub inacessível neste momento; a mostrar o registo verificado de ${date}.`,
    cacheNote:
      'Em cache na edge Cloudflare via /api/github para evitar bloqueios de limite por visitante.',
    activityCount: (count: number, days: number) =>
      `${count} evento${count === 1 ? '' : 's'} · últimos ${days} dias`,
    activityQuietSince: (days: number, ago: string) =>
      `último push ${ago} · sem eventos nos últimos ${days} dias`,
    activityQuiet: (days: number) => `sem atividade · últimos ${days} dias`,
    dayTooltip: (day: string, count: number) =>
      `${day}: ${count} evento${count === 1 ? '' : 's'} público${count === 1 ? '' : 's'}`,
    activityAria: (count: number, days: number) =>
      `${count} eventos públicos no GitHub nos últimos ${days} dias`,
    noRepos: 'Sem repositórios públicos devolvidos.',
    forksOnly: 'Apenas forks públicos de momento.',
    justNow: 'agora mesmo',
  },
  footer: {
    sectionIndex: '04 · contacto',
    heading: 'Disponível para equipas de engenharia e projetos freelance selecionados.',
    emailCta: 'Email rodrigo@macieira.cc',
    copyEmailCta: 'Copiar email',
    cvCta: 'Ver CV / Imprimir',
    discordCta: 'Copiar Discord',
    githubCta: 'GitHub',
    colophonTech:
      'Feito com SvelteKit, TypeScript e WebGL sem dependências na Cloudflare Workers.',
    colophonSource: 'Código no GitHub',
    hostedOn: 'Cloudflare Workers',
    shortcutsHint: 'Teclas: [1-5] secções · [P] tema · [B] bits · [R] rodar',
    localTimePrefix: 'Hora em Lisboa',
    backToTop: 'Voltar ao topo',
    copiedToast: (val: string) => `${val} copiado`,
    copyFailedToast: (val: string) => `Não deu para copiar: ${val}`,
  },
  cv: {
    backHome: 'Voltar ao portfólio',
    printCta: 'Imprimir / Guardar PDF',
    roleTitle: 'Programador Full-Stack & Web Criativa',
    location: 'Portugal · Remoto & Híbrido (UE / Fuso de Lisboa)',
    status: 'Disponível para equipas full-stack e projetos freelance selecionados',
    contactWeb: 'Web',
    contactEmail: 'Email',
    contactGitHub: 'GitHub',
    contactStatus: 'Estado',
    contactLanguages: 'Idiomas',
    languagesValue: 'Português (Nativo) · Inglês (Fluente)',
    summaryHeading: 'Perfil',
    summaryBody:
      'Programador full-stack em Portugal dedicado a software desktop TypeScript / Electron, sistemas C# / .NET 8 com PostgreSQL em Arquitetura Limpa e frontends leves com WebGL nativo.',
    skillsHeading: 'Stack Técnica',
    skillGroups: [
      {
        label: 'Backend & Dados',
        items:
          'C# · .NET 8 · ASP.NET Core MVC · EF Core · PostgreSQL · ASP.NET Identity · xUnit + Moq',
      },
      {
        label: 'Frontend & Desktop',
        items:
          'TypeScript · SvelteKit · Svelte 5 · React 19 · Electron · HTML/CSS acessível',
      },
      {
        label: 'WebGL & Infra Edge',
        items:
          'WebGL Nativo · Shaders GLSL ES · Dithering Bayer · Cloudflare Workers · Cache Edge',
      },
    ],
    projectsHeading: 'Projetos Principais',
    educationHeading: 'Qualificação',
    educationCredentialMeta: 'QNQ Nível 4 (EQF 4) · Catálogo Nacional de Qualificações (SNQ 7382)',
    ethosHeading: 'Princípios de Engenharia',
  },
  errorPage: {
    code: 'Erro',
    title: 'Nada neste ramo.',
    body: 'Esta página não está aqui. Pode ter mudado de sítio durante a migração para SvelteKit ou o endereço não existe.',
    homeCta: 'Voltar ao início',
    workCta: 'Ver estudos de caso',
  },
} as const satisfies TranslationShape;
