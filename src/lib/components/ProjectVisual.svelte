<script lang="ts">
  import { i18n } from '#lib/i18n/index.svelte.ts';

  interface Props {
    slug: 'emuhub' | 'sgeep' | 'finsight';
  }

  let { slug }: Props = $props();
  let isPt = $derived(i18n.lang === 'pt');
</script>

<div class="schematic" aria-hidden="true">
  {#if slug === 'emuhub'}
    <svg viewBox="0 0 420 180" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="1" width="418" height="178" rx="8" fill="var(--bg)" stroke="var(--line)" />

      <!-- Window top bar -->
      <line x1="1" y1="28" x2="419" y2="28" stroke="var(--line)" />
      <rect x="14" y="11" width="6" height="6" fill="var(--apple)" />
      <rect x="26" y="11" width="6" height="6" fill="var(--bark)" />
      <rect x="38" y="11" width="6" height="6" fill="var(--acid)" />
      <text x="58" y="18" fill="var(--ink-faint)" class="svg-mono" font-size="9.5" letter-spacing="1">
        {isPt ? 'EMUHUB :: 55 CONSOLAS · IPC ELECTRON' : 'EMUHUB :: 55 CONSOLES · ELECTRON IPC'}
      </text>

      <!-- Three-process isolation pipeline -->
      <rect x="16" y="42" width="118" height="46" rx="4" fill="var(--bg-elev)" stroke="var(--line-strong)" />
      <text x="24" y="61" fill="var(--acid)" class="svg-mono" font-size="9.5" font-weight="600">MAIN</text>
      <text x="24" y="76" fill="var(--ink-dim)" class="svg-mono" font-size="8.8">argv spawn + fs</text>

      <path d="M138 65h18" stroke="var(--acid)" stroke-width="1.5" stroke-dasharray="3 2" />
      <polygon points="158,65 153,62 153,68" fill="var(--acid)" />

      <rect x="160" y="42" width="102" height="46" rx="4" fill="var(--bg-elev)" stroke="var(--line-strong)" />
      <text x="168" y="61" fill="var(--ink)" class="svg-mono" font-size="9.5" font-weight="600">PRELOAD</text>
      <text x="168" y="76" fill="var(--ink-dim)" class="svg-mono" font-size="8.8">contextBridge</text>

      <path d="M266 65h18" stroke="var(--ink)" stroke-width="1.5" stroke-dasharray="3 2" />
      <polygon points="286,65 281,62 281,68" fill="var(--ink)" />

      <rect x="288" y="42" width="116" height="46" rx="4" fill="var(--bg-elev)" stroke="var(--line-strong)" />
      <text x="296" y="61" fill="var(--ink)" class="svg-mono" font-size="9.5" font-weight="600">RENDERER</text>
      <text x="296" y="76" fill="var(--ink-dim)" class="svg-mono" font-size="8.5">~9.5 MB · 90 kB</text>

      <!-- Console strip + atomic store footer -->
      <rect x="16" y="100" width="388" height="24" rx="4" fill="var(--bg-raise)" stroke="var(--line)" />
      <rect x="24" y="107" width="34" height="10" rx="2" fill="var(--apple)" fill-opacity="0.5" />
      <rect x="64" y="107" width="34" height="10" rx="2" fill="var(--acid)" fill-opacity="0.4" />
      <rect x="104" y="107" width="34" height="10" rx="2" fill="var(--line)" />
      <rect x="144" y="107" width="34" height="10" rx="2" fill="var(--line)" />
      <rect x="184" y="107" width="34" height="10" rx="2" fill="var(--line)" />
      <text x="232" y="115" fill="var(--ink-faint)" class="svg-mono" font-size="8.8">
        {isPt ? '+50 CONSOLAS JOGÁVEIS' : '+50 PLAYABLE CONSOLES'}
      </text>

      <rect x="16" y="135" width="232" height="28" rx="4" fill="var(--bg-elev)" stroke="var(--line)" />
      <text x="24" y="153" fill="var(--ink-dim)" class="svg-mono" font-size="8.6">
        jsonStore: .tmp -> rename + .bak
      </text>

      <rect x="256" y="135" width="148" height="28" rx="4" fill="var(--bg-elev)" stroke="var(--line)" />
      <text x="266" y="153" fill="var(--acid)" class="svg-mono" font-size="8.8" font-weight="600">
        {isPt ? 'ARRANQUE: 0.7–0.9 s' : 'BOOT: 0.7–0.9 s'}
      </text>
    </svg>
  {:else if slug === 'sgeep'}
    <svg viewBox="0 0 420 180" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="1" width="418" height="178" rx="8" fill="var(--bg)" stroke="var(--line)" />
      <line x1="1" y1="28" x2="419" y2="28" stroke="var(--line)" />
      <text x="16" y="18" fill="var(--ink-faint)" class="svg-mono" font-size="9.5" letter-spacing="1">
        {isPt ? 'SGEEP.WEB :: ARQUITETURA LIMPA (.NET 8)' : 'SGEEP.WEB :: CLEAN ARCHITECTURE (.NET 8)'}
      </text>

      <!-- Concentric architecture modules -->
      <rect x="16" y="42" width="186" height="122" rx="6" fill="var(--bg-raise)" stroke="var(--line-strong)" />
      <text x="26" y="59" fill="var(--ink-faint)" class="svg-mono" font-size="8.8">SGEEP.Web · MVC + Auth</text>
      <rect x="28" y="69" width="162" height="83" rx="5" fill="var(--bg-elev)" stroke="var(--line-strong)" />
      <text x="38" y="86" fill="var(--ink-dim)" class="svg-mono" font-size="8.8">Infrastructure · PgSQL</text>
      <rect x="40" y="96" width="138" height="44" rx="4" fill="var(--bg)" stroke="var(--acid)" stroke-opacity="0.7" />
      <text x="50" y="115" fill="var(--acid)" class="svg-mono" font-size="9.5" font-weight="600">SGEEP.Core</text>
      <text x="50" y="130" fill="var(--ink-dim)" class="svg-mono" font-size="8.2">
        {isPt ? 'Entidades & Enums' : 'Pure Entities & Enums'}
      </text>

      <!-- Right column: 4 RBAC Scopes & Guards -->
      <rect x="214" y="42" width="90" height="37" rx="4" fill="var(--bg-elev)" stroke="var(--line-strong)" />
      <text x="223" y="58" fill="var(--ink)" class="svg-mono" font-size="9" font-weight="600">ADMIN</text>
      <text x="223" y="71" fill="var(--ink-faint)" class="svg-mono" font-size="8.2">
        {isPt ? 'Auditoria' : 'Full audit'}
      </text>

      <rect x="314" y="42" width="90" height="37" rx="4" fill="var(--bg-elev)" stroke="var(--line-strong)" />
      <text x="323" y="58" fill="var(--acid)" class="svg-mono" font-size="9" font-weight="600">
        {isPt ? 'DOCENTE' : 'TEACHER'}
      </text>
      <text x="323" y="71" fill="var(--ink-faint)" class="svg-mono" font-size="8.2">
        {isPt ? 'Seus alunos' : 'Own interns'}
      </text>

      <rect x="214" y="87" width="90" height="37" rx="4" fill="var(--bg-elev)" stroke="var(--line-strong)" />
      <text x="223" y="103" fill="var(--ink)" class="svg-mono" font-size="9" font-weight="600">
        {isPt ? 'ALUNO' : 'STUDENT'}
      </text>
      <text x="223" y="116" fill="var(--ink-faint)" class="svg-mono" font-size="8.2">
        {isPt ? 'Horas e docs' : 'Hours & docs'}
      </text>

      <rect x="314" y="87" width="90" height="37" rx="4" fill="var(--bg-elev)" stroke="var(--line-strong)" />
      <text x="323" y="103" fill="var(--ink)" class="svg-mono" font-size="9" font-weight="600">
        {isPt ? 'EMPRESA' : 'COMPANY'}
      </text>
      <text x="323" y="116" fill="var(--ink-faint)" class="svg-mono" font-size="8.2">
        {isPt ? 'Atribuídos' : 'Assigned'}
      </text>

      <!-- Bottom controls -->
      <rect x="214" y="134" width="190" height="30" rx="4" fill="var(--bg-elev)" stroke="var(--line)" />
      <text x="223" y="153" fill="var(--ink-dim)" class="svg-mono" font-size="8.5">
        NIF mod-11 · 10/min · xUnit
      </text>
    </svg>
  {:else}
    <svg viewBox="0 0 420 180" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="1" width="418" height="178" rx="8" fill="var(--bg)" stroke="var(--line)" />
      <line x1="1" y1="28" x2="419" y2="28" stroke="var(--line)" />
      <text x="16" y="18" fill="var(--ink-faint)" class="svg-mono" font-size="9.5" letter-spacing="1">
        {isPt ? 'FINSIGHT :: CONTAS ISOLADAS (PG 16)' : 'FINSIGHT :: USER-ISOLATED LEDGER (PG 16)'}
      </text>

      <!-- Auth + UserId Gate -->
      <rect x="16" y="42" width="146" height="54" rx="4" fill="var(--bg-elev)" stroke="var(--line-strong)" />
      <text x="25" y="60" fill="var(--acid)" class="svg-mono" font-size="9.2" font-weight="600">AUTH + GUARD</text>
      <text x="25" y="74" fill="var(--ink-dim)" class="svg-mono" font-size="8.2">OAuth + QR TOTP 2FA</text>
      <text x="25" y="87" fill="var(--ink-faint)" class="svg-mono" font-size="8">
        {isPt ? 'Filtro por UserId' : 'UserId owner scope'}
      </text>

      <!-- 6-Month Chart Mini Panel -->
      <rect x="174" y="42" width="230" height="82" rx="4" fill="var(--bg-raise)" stroke="var(--line-strong)" />
      <text x="186" y="59" fill="var(--ink-dim)" class="svg-mono" font-size="8.8">
        {isPt ? 'DESPESA VS ORÇAMENTO (6M)' : '6-MONTH SPEND VS BUDGET'}
      </text>
      <rect x="190" y="86" width="11" height="28" fill="var(--ink-dim)" fill-opacity="0.45" />
      <rect x="203" y="76" width="11" height="38" fill="var(--acid)" />
      <rect x="224" y="80" width="11" height="34" fill="var(--ink-dim)" fill-opacity="0.45" />
      <rect x="237" y="70" width="11" height="44" fill="var(--acid)" />
      <rect x="258" y="74" width="11" height="40" fill="var(--ink-dim)" fill-opacity="0.45" />
      <rect x="271" y="92" width="11" height="22" fill="var(--acid)" />
      <rect x="292" y="82" width="11" height="32" fill="var(--ink-dim)" fill-opacity="0.45" />
      <rect x="305" y="72" width="11" height="42" fill="var(--acid)" />
      <rect x="326" y="66" width="11" height="48" fill="var(--apple)" />
      <rect x="339" y="78" width="11" height="36" fill="var(--acid)" />
      <rect x="360" y="88" width="11" height="26" fill="var(--ink-dim)" fill-opacity="0.45" />
      <rect x="373" y="74" width="11" height="40" fill="var(--acid)" />

      <!-- Recurring + Export strips -->
      <rect x="16" y="106" width="146" height="58" rx="4" fill="var(--bg-elev)" stroke="var(--line)" />
      <text x="25" y="124" fill="var(--ink)" class="svg-mono" font-size="8.8" font-weight="600">
        {isPt ? 'RECORRÊNCIA' : 'RECURRING JOBS'}
      </text>
      <text x="25" y="139" fill="var(--ink-faint)" class="svg-mono" font-size="8">DeleteBehavior.Restrict</text>
      <text x="25" y="153" fill="var(--ink-faint)" class="svg-mono" font-size="8">RegistoAuditoria</text>

      <rect x="174" y="134" width="230" height="30" rx="4" fill="var(--bg-elev)" stroke="var(--line)" />
      <text x="184" y="153" fill="var(--acid)" class="svg-mono" font-size="8.5" font-weight="600">
        {isPt ? 'EXPORTAÇÃO: CSV + .XLSX' : 'EXPORT: CSV + .XLSX (CLOSEDXML)'}
      </text>
    </svg>
  {/if}
</div>

<style>
  .schematic {
    width: 100%;
    overflow: hidden;
    border-radius: 8px;
  }

  .schematic svg {
    width: 100%;
    height: auto;
    display: block;
  }

  .schematic :global(.svg-mono) {
    font-family: var(--font-mono);
  }
</style>
