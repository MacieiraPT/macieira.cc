export type ProjectCategory = 'desktop' | 'dotnet';

export interface LocalizedText {
  en: string;
  pt: string;
}

export interface ProjectMetric {
  value: string;
  label: LocalizedText;
}

export interface ProjectDecision {
  title: LocalizedText;
  body: LocalizedText;
}

export interface Project {
  slug: 'emuhub' | 'sgeep' | 'finsight';
  title: string;
  year: string;
  category: ProjectCategory;
  categoryLabel: LocalizedText;
  role: LocalizedText;
  repoUrl: string;
  repoName: string;
  license: string;
  headline: LocalizedText;
  summary: LocalizedText;
  problem: LocalizedText;
  constraints: LocalizedText;
  stack: string[];
  metrics: ProjectMetric[];
  decisions: ProjectDecision[];
  outcomes: LocalizedText;
  seoTitle: LocalizedText;
  seoDescription: LocalizedText;
}

export const PROJECTS: Project[] = [
  {
    slug: 'emuhub',
    title: 'EmuHub',
    year: '2026',
    category: 'desktop',
    categoryLabel: {
      en: 'Desktop Engineering',
      pt: 'Engenharia Desktop',
    },
    role: {
      en: 'Sole author · TypeScript & Electron',
      pt: 'Autor único · TypeScript e Electron',
    },
    repoUrl: 'https://github.com/MacieiraPT/EmuHub',
    repoName: 'MacieiraPT/EmuHub',
    license: 'MIT',
    headline: {
      en: 'Cross-platform desktop launcher centralizing installed emulators across 55 consoles.',
      pt: 'Launcher desktop multiplataforma que reúne emuladores instalados para 55 consolas.',
    },
    summary: {
      en: 'Discovers local emulators across 55 playable platforms, launches processes safely via OS argument vectors, and guards user libraries with atomic JSON backup storage.',
      pt: 'Deteta emuladores locais para 55 plataformas, lança processos de forma segura por vetores de argumentos do SO e protege bibliotecas com armazenamento JSON atómico.',
    },
    problem: {
      en: 'Managing separate standalone emulators across dozens of systems leads to scattered executables, brittle command-line flags, and corrupted JSON configs when desktop crashes occur mid-write.',
      pt: 'Gerir emuladores independentes para dezenas de sistemas resulta em executáveis dispersos, argumentos frágeis em linha de comandos e ficheiros JSON corrompidos quando há falhas a meio da escrita.',
    },
    constraints: {
      en: 'Never bundle third-party emulator binaries, avoid listing un-emulatable stubs, reject shell string interpolation on launch paths, and keep cold start plus memory footprint minimal on Windows, macOS, and Linux.',
      pt: 'Nunca incluir binários de emuladores de terceiros, evitar sistemas sem emulação viável, eliminar interpolação de shell nos lançamentos e manter arranque rápido e memória reduzida em Windows, macOS e Linux.',
    },
    stack: ['TypeScript 5.9', 'Electron 44', 'React 19', 'Vite 7', 'electron-vite 5', 'electron-builder 26'],
    metrics: [
      {
        value: '0.7–0.9 s',
        label: { en: 'Cold launch to painted 55-console grid', pt: 'Arranque até à grelha de 55 consolas' },
      },
      {
        value: '~9.5 MB',
        label: { en: 'Chromium renderer heap footprint', pt: 'Consumo de memória heap no renderer' },
      },
      {
        value: '90 kB gz',
        label: { en: 'Renderer JS bundle (312 kB unminified)', pt: 'Bundle JS do renderer (312 kB raw)' },
      },
      {
        value: '55 systems',
        label: { en: 'Curated playable platforms mapped', pt: 'Plataformas jogáveis mapeadas' },
      },
    ],
    decisions: [
      {
        title: {
          en: 'Three-process boundary with strict typed IPC',
          pt: 'Fronteira de três processos com IPC tipado',
        },
        body: {
          en: 'Filesystem access, emulator discovery, and spawning remain confined to src/main, bridged through an explicit contextBridge contract in src/preload/index.ts to the unprivileged React UI.',
          pt: 'O acesso ao sistema de ficheiros e o lançamento de processos ficam confinados a src/main, ligados por um contrato explícito no contextBridge em src/preload/index.ts.',
        },
      },
      {
        title: {
          en: 'OS argument-vector process spawning',
          pt: 'Lançamento via vetores de argumentos do SO',
        },
        body: {
          en: 'Executable and ROM paths never touch shell interpolation; launch parameters are normalized and passed strictly as discrete OS argv entries.',
          pt: 'Os caminhos para executáveis e ROMs nunca passam por uma shell; os argumentos são normalizados e passados estritamente em vetor argv do sistema.',
        },
      },
      {
        title: {
          en: 'Atomic JSON persistence with forensics recovery (jsonStore.ts)',
          pt: 'Persistência JSON atómica com recuperação (jsonStore.ts)',
        },
        body: {
          en: 'library.json and settings.json write to a temporary file before atomic rename, keeping a .bak copy and preserving malformed inputs as .corrupt-<date> alongside schema migrations.',
          pt: 'library.json e settings.json escrevem para ficheiro temporário antes da substituição atómica, mantendo cópia .bak e preservando ficheiros corrompidos em .corrupt-<date>.',
        },
      },
      {
        title: {
          en: 'Zero-dependency hash router & strict GPU hygiene',
          pt: 'Router hash próprio e disciplina de GPU',
        },
        body: {
          en: 'Replaced external router libraries with a tiny 3-route hash router, virtualized cards via CSS content-visibility, avoided continuous backdrop blurs, and debounced trailing-edge executable checks.',
          pt: 'Um router hash mínimo de 3 rotas substitui dependências pesadas, os cartões usam content-visibility, não há blurs contínuos de fundo e as verificações usam debounce.',
        },
      },
    ],
    outcomes: {
      en: 'Achieves sub-second startup and ~3 ms main-process CPU usage over 3 seconds of idle while surviving unexpected power loss on user configs without data loss.',
      pt: 'Atinge arranque abaixo de 1 segundo e ~3 ms de CPU em 3 segundos de repouso, protegendo configurações locais contra falhas inesperadas.',
    },
    seoTitle: {
      en: 'EmuHub Case Study — Desktop Electron Architecture · macieira.cc',
      pt: 'EmuHub · Estudo de Caso Arquitetura Electron · macieira.cc',
    },
    seoDescription: {
      en: 'Engineering breakdown of EmuHub: TypeScript/Electron launcher across 55 consoles, atomic JSON storage, argv spawning, and 9.5 MB renderer budget.',
      pt: 'Análise técnica do EmuHub: launcher TypeScript/Electron para 55 consolas com persistência JSON atómica, lançamento seguro e 9.5 MB de heap.',
    },
  },
  {
    slug: 'sgeep',
    title: 'SGEEP.Web',
    year: '2026',
    category: 'dotnet',
    categoryLabel: {
      en: 'Full-Stack Web · .NET',
      pt: 'Web Full-Stack · .NET',
    },
    role: {
      en: 'Full-stack Architect · C# / .NET 8 / PostgreSQL',
      pt: 'Arquiteto Full-Stack · C# / .NET 8 / PostgreSQL',
    },
    repoUrl: 'https://github.com/MacieiraPT/SGEEP.Web',
    repoName: 'MacieiraPT/SGEEP.Web',
    license: 'Open Source',
    headline: {
      en: 'Multi-role internship administration platform for Portuguese vocational schools.',
      pt: 'Plataforma de gestão de estágios para escolas profissionais portuguesas.',
    },
    summary: {
      en: 'Built across 4 Clean Architecture projects with ASP.NET Core 8 MVC, PostgreSQL, 4-role RBAC, NIF validation, PDF/Excel automation, and xUnit coverage.',
      pt: 'Desenvolvida em 4 camadas de Arquitetura Limpa com ASP.NET Core 8 MVC, PostgreSQL, RBAC para 4 perfis, validação de NIF, relatórios PDF/Excel e testes xUnit.',
    },
    problem: {
      en: 'Vocational school internships juggle coordinators, teachers, students, and partner companies over scattered spreadsheets, emails, and unsigned monthly attendance sheets.',
      pt: 'A gestão de estágios no ensino profissional obriga escolas, professores, alunos e empresas a coordenar dados dispersos por folhas soltas, emails e registos manuais.',
    },
    constraints: {
      en: 'Enforce strict per-role visibility (teachers only see their assigned students), validate Portuguese NIF checksums and uploaded file headers, prevent scheduling overlap, and emit formal print-ready documents.',
      pt: 'Garantir visibilidade estrita por perfil (docentes apenas acedem aos próprios alunos), validar dígitos de controlo NIF e assinaturas reais de ficheiros, impedir sobreposições e gerar documentos formais.',
    },
    stack: ['C#', '.NET 8', 'ASP.NET Core MVC', 'Entity Framework Core', 'PostgreSQL (Npgsql)', 'ASP.NET Identity', 'QuestPDF / DinkToPdf', 'ClosedXML', 'MailKit', 'xUnit + Moq'],
    metrics: [
      {
        value: '4 layers',
        label: { en: 'Core, Infrastructure, Web, and Tests solution layout', pt: 'Camadas Core, Infrastructure, Web e Tests' },
      },
      {
        value: '4 roles',
        label: { en: 'Admin, Teacher, Student & Company isolation', pt: 'Isolamento Admin, Professor, Aluno e Empresa' },
      },
      {
        value: '10 req/min',
        label: { en: 'Login throttling + 15-min lockout on 5 failures', pt: 'Limite de login + bloqueio de 15 min após 5 falhas' },
      },
      {
        value: 'xUnit + Moq',
        label: { en: 'Automated business-rule verification suite', pt: 'Suite de testes unitários para regras de domínio' },
      },
    ],
    decisions: [
      {
        title: {
          en: 'Four-project Clean Architecture solution',
          pt: 'Solução em Arquitetura Limpa com quatro projetos',
        },
        body: {
          en: 'SGEEP.Core owns zero-dependency domain models and enums; SGEEP.Infrastructure manages EF Core migrations and composite PostgreSQL indexes; SGEEP.Web hosts MVC, Identity, middleware, and PDF/mail services.',
          pt: 'SGEEP.Core mantém entidades puras sem dependências externas; SGEEP.Infrastructure gere migrações EF Core e índices compostos no PostgreSQL; SGEEP.Web orquestra MVC, Identity e serviços.',
        },
      },
      {
        title: {
          en: 'Role-scoped visibility & state-machine validation',
          pt: 'Visibilidade por perfil e validação de estados',
        },
        body: {
          en: 'Server policies restrict queries per role — enforcing Professor_SoVeEstagiosProprios and blocking overlapping date ranges, invalid internship transitions, or inconsistent logged hours.',
          pt: 'Políticas de servidor restringem queries por perfil — aplicando Professor_SoVeEstagiosProprios e impedindo sobreposições de datas, transições inválidas ou excessos de horas.',
        },
      },
      {
        title: {
          en: 'Hardened auth, upload magic-bytes & NIF checksums',
          pt: 'Autenticação reforçada, magic-bytes e checksum NIF',
        },
        body: {
          en: 'Checks Portuguese tax numbers modulo-11, inspects file magic bytes (.pdf, .docx, .doc) on upload, enforces forced first-login password change middleware, anti-CSRF tokens, rate limiting, and audit logs.',
          pt: 'Verifica NIF pelo algoritmo módulo 11, valida magic bytes no envio de ficheiros, obriga troca inicial de palavra-passe via middleware e regista ações críticas na tabela RegistoAuditoria.',
        },
      },
      {
        title: {
          en: 'Automated QuestPDF / ClosedXML / MailKit reporting',
          pt: 'Exportação PDF/Excel e notificações MailKit',
        },
        body: {
          en: 'Produces formal Portuguese internship protocols and monthly hour reports in PDF alongside clean .xlsx sheets and email alerts.',
          pt: 'Gera declarações e mapas mensais em PDF com QuestPDF/DinkToPdf, folhas Excel via ClosedXML e notificações transacionais com MailKit.',
        },
      },
    ],
    outcomes: {
      en: 'Replaces error-prone spreadsheets with an auditable multi-tenant .NET 8 application backed by PostgreSQL relational constraints and unit tests.',
      pt: 'Substitui processos manuais por uma aplicação .NET 8 auditável sobre PostgreSQL com integridade referencial e testes automatizados.',
    },
    seoTitle: {
      en: 'SGEEP.Web Case Study — .NET 8 Clean Architecture · macieira.cc',
      pt: 'SGEEP.Web · Estudo de Caso .NET 8 e PostgreSQL · macieira.cc',
    },
    seoDescription: {
      en: 'Architecture breakdown of SGEEP.Web: C#/.NET 8 MVC vocational internship platform on PostgreSQL with 4-role RBAC, QuestPDF, ClosedXML, and xUnit tests.',
      pt: 'Arquitetura da SGEEP.Web: plataforma .NET 8 MVC sobre PostgreSQL para gestão de estágios com RBAC, validação NIF, PDF/Excel e testes xUnit.',
    },
  },
  {
    slug: 'finsight',
    title: 'FinSight',
    year: '2026',
    category: 'dotnet',
    categoryLabel: {
      en: 'Full-Stack Web · .NET',
      pt: 'Web Full-Stack · .NET',
    },
    role: {
      en: 'Sole developer · C# / .NET 8 / PostgreSQL 16',
      pt: 'Desenvolvedor único · C# / .NET 8 / PostgreSQL 16',
    },
    repoUrl: 'https://github.com/MacieiraPT/FinSight',
    repoName: 'MacieiraPT/FinSight',
    license: 'MIT',
    headline: {
      en: 'Personal expense, recurring budget, and spending analytics platform.',
      pt: 'Plataforma de despesas pessoais, orçamentos recorrentes e análise financeira.',
    },
    summary: {
      en: 'Combines ASP.NET Core 8 MVC and PostgreSQL 16 with strict per-user data isolation, Google OAuth, TOTP 2FA QR onboarding, budget alerts, and Excel exports.',
      pt: 'Combina ASP.NET Core 8 MVC e PostgreSQL 16 com isolamento estrito por utilizador, Google OAuth, autenticação 2FA por QR, alertas de orçamento e exportação Excel.',
    },
    problem: {
      en: 'Consumer expense trackers often compromise privacy in third-party clouds or omit recurring payment scheduling and filter-consistent accounting exports.',
      pt: 'Ferramentas comuns de gestão pessoal ou expõem dados financeiros a terceiros ou carecem de despesas recorrentes automatizadas e exportações fiéis aos filtros aplicados.',
    },
    constraints: {
      en: 'Keep user ledgers strictly isolated at the ORM query layer, support frictionless Google OAuth alongside QR-based TOTP two-factor security, and keep dashboard totals aligned with exported spreadsheets.',
      pt: 'Garantir isolamento estrito na camada de queries, suportar Google OAuth com proteção TOTP 2FA por código QR e assegurar coerência exata entre gráficos no ecrã e ficheiros exportados.',
    },
    stack: ['C#', '.NET 8', 'ASP.NET Core MVC', 'EF Core 8', 'PostgreSQL 16', 'Google OAuth', 'QRCoder', 'ClosedXML', 'Chart.js'],
    metrics: [
      {
        value: 'EF Core 8',
        label: { en: 'Restrict foreign keys & user-owned predicates', pt: 'Chaves estrangeiras Restrict e filtros por utilizador' },
      },
      {
        value: 'TOTP + OAuth',
        label: { en: 'Google OAuth paired with QR-encoded 2FA', pt: 'Google OAuth combinado com 2FA por TOTP QR' },
      },
      {
        value: '6-mo trends',
        label: { en: 'Chart.js breakdowns & salary threshold warnings', pt: 'Tendências a 6 meses e alertas face ao rendimento' },
      },
      {
        value: 'CSV + .xlsx',
        label: { en: 'Shared query filters across UI and downloads', pt: 'Exportação CSV/Excel alinhada com filtros ativos' },
      },
    ],
    decisions: [
      {
        title: {
          en: 'Strict per-user ownership & Restrict delete protection',
          pt: 'Isolamento por utilizador e proteção contra eliminações em cascata',
        },
        body: {
          en: 'All expenses, incomes, budgets, recurring rules, and categories bind to UserId predicates at every endpoint, using DeleteBehavior.Restrict so historical ledger records stay intact.',
          pt: 'Todas as transações, orçamentos e categorias são filtradas por UserId em cada ação e protegidas com DeleteBehavior.Restrict para preservar o histórico financeiro.',
        },
      },
      {
        title: {
          en: 'Automated recurring expense & income processors',
          pt: 'Serviços dedicados para movimentos recorrentes',
        },
        body: {
          en: 'Separate DespesasRecorrentesService and ReceitasRecorrentesService evaluate due dates cleanly without blocking dashboard page reads.',
          pt: 'DespesasRecorrentesService e ReceitasRecorrentesService geram lançamentos periódicos automaticamente sem bloquear a renderização inicial.',
        },
      },
      {
        title: {
          en: 'Multi-provider auth with QR TOTP enrollment & audit log',
          pt: 'Autenticação multi-provedor com 2FA QR e auditoria',
        },
        body: {
          en: 'Integrates standard ASP.NET Identity and Google OAuth, generates TOTP provisioning secrets in-app via QRCoder, and traces sensitive changes in RegistoAuditoria.',
          pt: 'Integra Identity e Google OAuth com ativação de 2FA TOTP via QRCoder e registo de eventos sensíveis em RegistoAuditoria.',
        },
      },
      {
        title: {
          en: 'Unified filter pipeline for Chart.js & ClosedXML exports',
          pt: 'Pipeline partilhado entre Chart.js e exportação ClosedXML',
        },
        body: {
          en: 'Dashboard visualizations and CSV / .xlsx exports reuse the identical filtered dataset specification, preventing numeric discrepancies between visual summaries and downloaded tables.',
          pt: 'Os gráficos Chart.js a 6 meses e as exportações CSV e .xlsx partilham exatamente os mesmos predicados de filtragem para evitar divergências de totais.',
        },
      },
    ],
    outcomes: {
      en: 'Delivers an end-to-end self-hostable personal accounting suite backed by relational integrity, 2FA, recurring automation, and single-click Excel output.',
      pt: 'Entrega uma suíte de contabilidade pessoal auto-alojável com integridade relacional, 2FA, recorrência automática e exportação contabilística imediata.',
    },
    seoTitle: {
      en: 'FinSight Case Study — ASP.NET Core 8 & PostgreSQL · macieira.cc',
      pt: 'FinSight · Estudo de Caso .NET 8 e Finanças Pessoais · macieira.cc',
    },
    seoDescription: {
      en: 'Engineering overview of FinSight: C# / .NET 8 MVC and PostgreSQL 16 finance tracker featuring Google OAuth, QR TOTP 2FA, recurring schedules, and ClosedXML exports.',
      pt: 'Análise técnica do FinSight: aplicação .NET 8 e PostgreSQL 16 para gestão financeira com Google OAuth, 2FA TOTP por QR, recorrência e exportação Excel.',
    },
  },
];

export function getProjectBySlug(slug: string): Project | undefined {
  return PROJECTS.find((p) => p.slug === slug);
}

export function getNextProject(slug: string): Project {
  const index = PROJECTS.findIndex((p) => p.slug === slug);
  if (index === -1) return PROJECTS[0];
  return PROJECTS[(index + 1) % PROJECTS.length];
}
