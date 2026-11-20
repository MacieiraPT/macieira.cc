<script lang="ts">
  import { SITE } from '#lib/data/site.ts';
  import { i18n } from '#lib/i18n/index.svelte.ts';

  interface Props {
    title: string;
    description: string;
    /** Clean unlocalized route path, e.g. '/', '/work', '/work/emuhub', '/cv' */
    path: string;
    ogType?: 'website' | 'article' | 'profile';
    jsonLd?: string;
  }

  let { title, description, path, ogType = 'website', jsonLd }: Props = $props();

  let enUrl = $derived(`${SITE.origin}${path}`);
  let ptUrl = $derived(path === '/' ? `${SITE.origin}/pt` : `${SITE.origin}/pt${path}`);
  let canonicalUrl = $derived(i18n.lang === 'pt' ? ptUrl : enUrl);
</script>

<svelte:head>
  <title>{title}</title>
  <meta name="description" content={description} />
  <link rel="canonical" href={canonicalUrl} />
  <link rel="alternate" hreflang="en" href={enUrl} />
  <link rel="alternate" hreflang="pt-PT" href={ptUrl} />
  <link rel="alternate" hreflang="x-default" href={enUrl} />

  <meta property="og:type" content={ogType} />
  <meta property="og:url" content={canonicalUrl} />
  <meta property="og:site_name" content={SITE.name} />
  <meta property="og:title" content={title} />
  <meta property="og:description" content={description} />
  <meta property="og:locale" content={i18n.t.meta.ogLocale} />
  <meta property="og:locale:alternate" content={i18n.t.meta.ogLocaleAlt} />
  <meta property="og:image" content={SITE.ogImage} />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:image:alt" content={i18n.t.meta.ogImageAlt} />
  <meta name="twitter:card" content="summary_large_image" />
  {#if jsonLd}
    {@html `<script type="application/ld+json">${jsonLd}</script>`}
  {/if}
</svelte:head>
