<script lang="ts">
  interface Props {
    slug: 'emuhub' | 'sgeep' | 'finsight';
    compact?: boolean;
  }

  let { slug, compact = false }: Props = $props();
</script>

<div class="schematic" class:is-compact={compact} aria-hidden="true">
  {#if slug === 'emuhub'}
    <svg viewBox="0 0 420 180" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="1" width="418" height="178" rx="8" fill="#09090c" stroke="rgb(255 255 255 / 0.1)" />

      <!-- Window top bar -->
      <line x1="1" y1="28" x2="419" y2="28" stroke="rgb(255 255 255 / 0.08)" />
      <rect x="14" y="11" width="6" height="6" fill="#e4392f" />
      <rect x="26" y="11" width="6" height="6" fill="#8b7b69" />
      <rect x="38" y="11" width="6" height="6" fill="#cdfb45" />
      <text x="58" y="18" fill="#7c7c89" font-family="JetBrains Mono, monospace" font-size="9" letter-spacing="1.2">
        EMUHUB :: 55 CONSOLES · ELECTRON IPC
      </text>

      <!-- Three-process isolation pipeline -->
      <rect x="16" y="42" width="118" height="44" rx="4" fill="#131318" stroke="rgb(255 255 255 / 0.14)" />
      <text x="26" y="60" fill="#cdfb45" font-family="JetBrains Mono, monospace" font-size="8.5">MAIN PROCESS</text>
      <text x="26" y="74" fill="#a3a3af" font-family="JetBrains Mono, monospace" font-size="8">argv spawn + fs</text>

      <path d="M138 64h18" stroke="#cdfb45" stroke-width="1.5" stroke-dasharray="3 2" />
      <polygon points="158,64 153,61 153,67" fill="#cdfb45" />

      <rect x="160" y="42" width="102" height="44" rx="4" fill="#131318" stroke="rgb(255 255 255 / 0.14)" />
      <text x="170" y="60" fill="#f3f1ec" font-family="JetBrains Mono, monospace" font-size="8.5">PRELOAD</text>
      <text x="170" y="74" fill="#a3a3af" font-family="JetBrains Mono, monospace" font-size="8">contextBridge</text>

      <path d="M266 64h18" stroke="#f3f1ec" stroke-width="1.5" stroke-dasharray="3 2" />
      <polygon points="286,64 281,61 281,67" fill="#f3f1ec" />

      <rect x="288" y="42" width="116" height="44" rx="4" fill="#131318" stroke="rgb(255 255 255 / 0.14)" />
      <text x="298" y="60" fill="#f3f1ec" font-family="JetBrains Mono, monospace" font-size="8.5">RENDERER</text>
      <text x="298" y="74" fill="#a3a3af" font-family="JetBrains Mono, monospace" font-size="8">~9.5 MB · 90 kB gz</text>

      <!-- Console strip + atomic store footer -->
      <rect x="16" y="100" width="388" height="24" rx="4" fill="#0f0f13" stroke="rgb(255 255 255 / 0.08)" />
      <rect x="24" y="107" width="36" height="10" rx="2" fill="#e4392f" fill-opacity="0.35" />
      <rect x="66" y="107" width="36" height="10" rx="2" fill="#cdfb45" fill-opacity="0.28" />
      <rect x="108" y="107" width="36" height="10" rx="2" fill="rgb(255 255 255 / 0.1)" />
      <rect x="150" y="107" width="36" height="10" rx="2" fill="rgb(255 255 255 / 0.1)" />
      <rect x="192" y="107" width="36" height="10" rx="2" fill="rgb(255 255 255 / 0.1)" />
      <text x="242" y="115" fill="#7c7c89" font-family="JetBrains Mono, monospace" font-size="8">
        +50 PLAYABLE CONSOLES
      </text>

      <rect x="16" y="136" width="232" height="26" rx="4" fill="#121217" stroke="rgb(255 255 255 / 0.1)" />
      <text x="24" y="152" fill="#a3a3af" font-family="JetBrains Mono, monospace" font-size="8">
        jsonStore: write .tmp -> rename + .bak
      </text>

      <rect x="258" y="136" width="146" height="26" rx="4" fill="#121217" stroke="rgb(255 255 255 / 0.1)" />
      <text x="268" y="152" fill="#cdfb45" font-family="JetBrains Mono, monospace" font-size="8">
        BOOT: 0.7–0.9 s PAINTED
      </text>
    </svg>
  {:else if slug === 'sgeep'}
    <svg viewBox="0 0 420 180" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="1" width="418" height="178" rx="8" fill="#09090c" stroke="rgb(255 255 255 / 0.1)" />
      <line x1="1" y1="28" x2="419" y2="28" stroke="rgb(255 255 255 / 0.08)" />
      <text x="16" y="18" fill="#7c7c89" font-family="JetBrains Mono, monospace" font-size="9" letter-spacing="1.2">
        SGEEP.WEB :: 4-LAYER CLEAN ARCHITECTURE (.NET 8)
      </text>

      <!-- Concentric architecture modules -->
      <rect x="16" y="42" width="184" height="120" rx="6" fill="#101016" stroke="rgb(255 255 255 / 0.14)" />
      <text x="26" y="58" fill="#7c7c89" font-family="JetBrains Mono, monospace" font-size="8">SGEEP.Web · MVC + Identity</text>
      <rect x="28" y="68" width="160" height="82" rx="5" fill="#14141c" stroke="rgb(255 255 255 / 0.14)" />
      <text x="38" y="84" fill="#a3a3af" font-family="JetBrains Mono, monospace" font-size="8">SGEEP.Infrastructure · PgSQL</text>
      <rect x="40" y="94" width="136" height="44" rx="4" fill="#191922" stroke="#cdfb45" stroke-opacity="0.5" />
      <text x="52" y="114" fill="#cdfb45" font-family="JetBrains Mono, monospace" font-size="8.5">SGEEP.Core</text>
      <text x="52" y="128" fill="#a3a3af" font-family="JetBrains Mono, monospace" font-size="7.5">Pure Entities &amp; Enums</text>

      <!-- Right column: 4 RBAC Scopes & Guards -->
      <rect x="214" y="42" width="90" height="36" rx="4" fill="#131318" stroke="rgb(255 255 255 / 0.12)" />
      <text x="224" y="58" fill="#f3f1ec" font-family="JetBrains Mono, monospace" font-size="8">ADMIN</text>
      <text x="224" y="70" fill="#7c7c89" font-family="JetBrains Mono, monospace" font-size="7.5">Full audit</text>

      <rect x="314" y="42" width="90" height="36" rx="4" fill="#131318" stroke="rgb(255 255 255 / 0.12)" />
      <text x="324" y="58" fill="#cdfb45" font-family="JetBrains Mono, monospace" font-size="8">TEACHER</text>
      <text x="324" y="70" fill="#7c7c89" font-family="JetBrains Mono, monospace" font-size="7.5">Own interns</text>

      <rect x="214" y="86" width="90" height="36" rx="4" fill="#131318" stroke="rgb(255 255 255 / 0.12)" />
      <text x="224" y="102" fill="#f3f1ec" font-family="JetBrains Mono, monospace" font-size="8">STUDENT</text>
      <text x="224" y="114" fill="#7c7c89" font-family="JetBrains Mono, monospace" font-size="7.5">Hours &amp; docs</text>

      <rect x="314" y="86" width="90" height="36" rx="4" fill="#131318" stroke="rgb(255 255 255 / 0.12)" />
      <text x="324" y="102" fill="#f3f1ec" font-family="JetBrains Mono, monospace" font-size="8">COMPANY</text>
      <text x="324" y="114" fill="#7c7c89" font-family="JetBrains Mono, monospace" font-size="7.5">Assigned only</text>

      <!-- Bottom controls -->
      <rect x="214" y="132" width="190" height="30" rx="4" fill="#121217" stroke="rgb(255 255 255 / 0.1)" />
      <text x="224" y="150" fill="#a3a3af" font-family="JetBrains Mono, monospace" font-size="7.8">
        NIF mod-11 · 10/min lock · xUnit
      </text>
    </svg>
  {:else}
    <svg viewBox="0 0 420 180" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="1" width="418" height="178" rx="8" fill="#09090c" stroke="rgb(255 255 255 / 0.1)" />
      <line x1="1" y1="28" x2="419" y2="28" stroke="rgb(255 255 255 / 0.08)" />
      <text x="16" y="18" fill="#7c7c89" font-family="JetBrains Mono, monospace" font-size="9" letter-spacing="1.2">
        FINSIGHT :: USER-ISOLATED LEDGER &amp; 2FA (POSTGRES 16)
      </text>

      <!-- Auth + UserId Gate -->
      <rect x="16" y="42" width="144" height="54" rx="4" fill="#131318" stroke="rgb(255 255 255 / 0.14)" />
      <text x="26" y="60" fill="#cdfb45" font-family="JetBrains Mono, monospace" font-size="8.5">AUTH + GUARD</text>
      <text x="26" y="74" fill="#a3a3af" font-family="JetBrains Mono, monospace" font-size="7.8">Google OAuth + QR TOTP</text>
      <text x="26" y="86" fill="#7c7c89" font-family="JetBrains Mono, monospace" font-size="7.5">UserId == owner scope</text>

      <!-- 6-Month Chart Mini Panel -->
      <rect x="174" y="42" width="230" height="82" rx="4" fill="#101016" stroke="rgb(255 255 255 / 0.12)" />
      <text x="186" y="58" fill="#a3a3af" font-family="JetBrains Mono, monospace" font-size="8">6-MONTH SPEND VS BUDGET</text>
      <!-- 6 clean histogram pairs -->
      <rect x="190" y="86" width="11" height="28" fill="#a3a3af" fill-opacity="0.4" />
      <rect x="203" y="76" width="11" height="38" fill="#cdfb45" />
      <rect x="224" y="80" width="11" height="34" fill="#a3a3af" fill-opacity="0.4" />
      <rect x="237" y="70" width="11" height="44" fill="#cdfb45" />
      <rect x="258" y="74" width="11" height="40" fill="#a3a3af" fill-opacity="0.4" />
      <rect x="271" y="92" width="11" height="22" fill="#cdfb45" />
      <rect x="292" y="82" width="11" height="32" fill="#a3a3af" fill-opacity="0.4" />
      <rect x="305" y="72" width="11" height="42" fill="#cdfb45" />
      <rect x="326" y="66" width="11" height="48" fill="#e4392f" />
      <rect x="339" y="78" width="11" height="36" fill="#cdfb45" />
      <rect x="360" y="88" width="11" height="26" fill="#a3a3af" fill-opacity="0.4" />
      <rect x="373" y="74" width="11" height="40" fill="#cdfb45" />

      <!-- Recurring + Export strips -->
      <rect x="16" y="106" width="144" height="56" rx="4" fill="#131318" stroke="rgb(255 255 255 / 0.12)" />
      <text x="26" y="124" fill="#f3f1ec" font-family="JetBrains Mono, monospace" font-size="8">RECURRING SERVICES</text>
      <text x="26" y="138" fill="#7c7c89" font-family="JetBrains Mono, monospace" font-size="7.5">DeleteBehavior.Restrict</text>
      <text x="26" y="150" fill="#7c7c89" font-family="JetBrains Mono, monospace" font-size="7.5">RegistoAuditoria</text>

      <rect x="174" y="134" width="230" height="28" rx="4" fill="#121217" stroke="rgb(255 255 255 / 0.1)" />
      <text x="186" y="151" fill="#cdfb45" font-family="JetBrains Mono, monospace" font-size="8">
        EXPORT PIPELINE: MATCHED CSV + .XLSX (CLOSEDXML)
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

  .schematic.is-compact {
    max-height: 170px;
  }
</style>
