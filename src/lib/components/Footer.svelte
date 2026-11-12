<script lang="ts">
  import { onMount } from 'svelte';
  import { i18n } from '#lib/i18n/index.svelte.ts';
  import Icons from './Icons.svelte';

  let clockText = $state('--:--');
  let toastText = $state('');
  let toastVisible = $state(false);
  let copiedKey = $state<string | null>(null);

  let toastTimer: ReturnType<typeof setTimeout> | undefined;

  function showToast(msg: string) {
    toastText = msg;
    toastVisible = true;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toastVisible = false;
    }, 2200);
  }

  async function copyValue(key: string, val: string) {
    let ok = false;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(val);
        ok = true;
      }
    } catch {
      /* fallback below */
    }

    if (!ok) {
      try {
        const area = document.createElement('textarea');
        area.value = val;
        area.setAttribute('readonly', '');
        area.style.cssText = 'position:fixed;top:-1000px;opacity:0';
        document.body.appendChild(area);
        area.select();
        ok = document.execCommand('copy');
        area.remove();
      } catch {
        ok = false;
      }
    }

    if (!ok) {
      showToast(i18n.t.footer.copyFailedToast(val));
      return;
    }

    copiedKey = key;
    showToast(i18n.t.footer.copiedToast(val));
    setTimeout(() => {
      if (copiedKey === key) copiedKey = null;
    }, 2000);
  }

  onMount(() => {
    const updateClock = () => {
      try {
        clockText = new Intl.DateTimeFormat(i18n.locale, {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
          timeZone: 'Europe/Lisbon',
        }).format(new Date());
      } catch {
        clockText = '--:--';
      }
    };

    let timer: ReturnType<typeof setTimeout> | undefined;
    const schedule = () => {
      const now = new Date();
      const delay = 60_000 - (now.getSeconds() * 1000 + now.getMilliseconds());
      clearTimeout(timer);
      timer = setTimeout(() => {
        updateClock();
        schedule();
      }, delay);
    };

    const onVisibility = () => {
      if (!document.hidden) {
        updateClock();
        schedule();
      }
    };

    updateClock();
    schedule();
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      clearTimeout(timer);
      clearTimeout(toastTimer);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  });
</script>

<footer class="footer section" id="contact">
  <div class="wrap footer__wrap">
    <div class="footer__top">
      <p class="section-label">{i18n.t.footer.sectionIndex}</p>
      <h2 class="footer__big">{i18n.t.footer.heading}</h2>

      <div class="footer__actions">
        <a class="btn btn--solid" href="mailto:rodrigo@macieira.cc">
          <Icons name="mail" />
          <span>{i18n.t.footer.emailCta}</span>
        </a>

        <button
          class="btn btn--ghost"
          type="button"
          onclick={() => copyValue('email', 'rodrigo@macieira.cc')}
        >
          <Icons name={copiedKey === 'email' ? 'check' : 'copy'} class="icon icon--sm" />
          <span>{i18n.t.footer.copyEmailCta}</span>
        </button>

        <button
          class="btn btn--ghost"
          type="button"
          onclick={() => copyValue('discord', 'rvdi')}
        >
          <Icons name={copiedKey === 'discord' ? 'check' : 'copy'} class="icon icon--sm" />
          <span>{i18n.t.footer.discordCta}: rvdi</span>
        </button>

        <a
          class="btn btn--ghost"
          href="https://github.com/MacieiraPT"
          target="_blank"
          rel="me noopener"
        >
          <Icons name="github" />
          <span>{i18n.t.footer.githubCta} @MacieiraPT</span>
          <Icons name="arrow-up-right" class="icon icon--sm" />
        </a>
      </div>
    </div>

    <div class="colophon mono">
      <p>
        {i18n.t.footer.colophonTech}
        <span class="sep" aria-hidden="true">·</span>
        <a
          class="colophon__link"
          href="https://github.com/MacieiraPT/macieira.cc"
          target="_blank"
          rel="noopener"
        >
          {i18n.t.footer.colophonSource}
        </a>
      </p>

      <p class="colophon__meta">
        <span>{i18n.t.footer.localTimePrefix}: {clockText}</span>
        <span class="sep" aria-hidden="true">/</span>
        <a class="colophon__link" href="#top">{i18n.t.footer.backToTop}</a>
      </p>
    </div>
  </div>
</footer>

<div class="toast" class:is-visible={toastVisible} role="status" aria-live="polite">
  {toastText}
</div>

<style>
  .footer {
    padding-bottom: clamp(2.5rem, 5vh, 4rem);
  }

  .footer__wrap {
    display: grid;
    gap: clamp(2.5rem, 5vh, 4rem);
  }

  .footer__top {
    display: grid;
    justify-items: start;
    gap: 1.35rem;
  }

  .footer__big {
    font-size: clamp(1.65rem, 3.8vw, 3.25rem);
    font-weight: 700;
    font-variation-settings: 'wdth' 98;
    line-height: 1.06;
    letter-spacing: -0.03em;
    max-width: 24ch;
    text-wrap: balance;
  }

  .footer__actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.65rem;
    margin-top: 0.35rem;
  }

  .colophon {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 0.9rem 1.5rem;
    padding-top: 1.25rem;
    border-top: 1px solid var(--line);
    color: var(--ink-faint);
  }

  .colophon__meta {
    display: inline-flex;
    align-items: center;
    gap: 0.55rem;
  }

  .colophon__link {
    color: var(--ink-dim);
    border-bottom: 1px solid var(--line-strong);
    transition: color 0.2s var(--ease-out), border-color 0.2s var(--ease-out);
  }

  .colophon__link:hover {
    color: var(--ink);
    border-color: var(--acid);
  }

  .sep {
    color: var(--ink-faint);
    margin-inline: 0.2rem;
  }
</style>
