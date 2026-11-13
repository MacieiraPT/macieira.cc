<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import '#lib/styles/tokens.css';
  import '#lib/styles/global.css';
  import { i18n } from '#lib/i18n/index.svelte.ts';
  import { workbench } from '#lib/state/workbench.svelte.ts';
  import Header from '#lib/components/Header.svelte';
  import Footer from '#lib/components/Footer.svelte';

  let { children } = $props();

  onMount(() => {
    i18n.syncFromClient();
    workbench.syncFromClient();

    const SECTION_MAP: Record<string, string> = {
      '1': 'work',
      '2': 'background',
      '3': 'github',
      '4': 'contact',
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return;
      }

      const key = e.key.toLowerCase();
      if (key in SECTION_MAP) {
        e.preventDefault();
        const id = SECTION_MAP[key];
        if (page.url.pathname === '/') {
          document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
          goto(`/#${id}`);
        }
        return;
      }

      if (key === 'p') {
        workbench.cycleTheme();
      } else if (key === 'b') {
        workbench.toggleMode();
      } else if (key === 'r') {
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
