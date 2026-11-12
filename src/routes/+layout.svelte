<script lang="ts">
  import { onMount } from 'svelte';
  import '#lib/styles/tokens.css';
  import '#lib/styles/global.css';
  import { i18n } from '#lib/i18n/index.svelte.ts';
  import Header from '#lib/components/Header.svelte';
  import Footer from '#lib/components/Footer.svelte';

  let { children } = $props();

  onMount(() => {
    i18n.syncFromClient();
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
