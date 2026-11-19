<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import '#lib/styles/tokens.css';
  import '#lib/styles/global.css';
  import { applyDocumentLang, i18n } from '#lib/i18n/index.svelte.ts';
  import { workbench } from '#lib/state/workbench.svelte.ts';
  import Header from '#lib/components/Header.svelte';
  import Footer from '#lib/components/Footer.svelte';

  let { children } = $props();

  $effect(() => {
    applyDocumentLang(i18n.lang);
  });

  onMount(() => {
    workbench.syncFromClient();

    const SECTION_MAP: Record<string, string> = {
      '1': 'work',
      '2': 'background',
      '3': 'github',
      '5': 'contact',
    };

    const isInteractiveFocus = (target: HTMLElement | null): boolean => {
      if (!target) return false;
      const tag = target.tagName;
      if (
        tag === 'INPUT' ||
        tag === 'TEXTAREA' ||
        tag === 'SELECT' ||
        tag === 'BUTTON' ||
        tag === 'A' ||
        target.isContentEditable
      ) {
        return true;
      }
      return Boolean(target.closest('button, a, [role="tab"], [role="button"]'));
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
      if (isInteractiveFocus(e.target as HTMLElement | null)) return;

      const key = e.key.toLowerCase();

      if (key === '4') {
        e.preventDefault();
        goto(i18n.href('/cv'));
        return;
      }

      if (key in SECTION_MAP) {
        e.preventDefault();
        const id = SECTION_MAP[key];
        if (i18n.isHome) {
          document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
          goto(i18n.href(`/#${id}`));
        }
        return;
      }

      if (key === 'p') {
        const next = workbench.cycleTheme();
        workbench.showToast(i18n.t.nav.themeToast(next.label));
      } else if (key === 'b' && i18n.isHome) {
        workbench.toggleMode();
      } else if (key === 'r' && i18n.isHome) {
        workbench.triggerSpin();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  });
</script>

<div class="atmosphere" aria-hidden="true">
  <div class="atmosphere__glow"></div>
  <div class="atmosphere__grain"></div>
</div>

<div class="page-shell">
  <a class="skip-link" href="#top">{i18n.t.nav.skip}</a>

  <Header />

  <main id="top" tabindex="-1">
    {@render children()}
  </main>

  <Footer />
</div>
