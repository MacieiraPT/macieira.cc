import type { RequestHandler } from '@sveltejs/kit';
import { PROJECTS } from '#lib/data/projects.ts';

export const prerender = true;

const ORIGIN = 'https://macieira.cc';
const LASTMOD = '2026-11-19';

const BASE_PATHS = ['/', '/work', '/cv', ...PROJECTS.map((p) => `/work/${p.slug}`)];

function buildUrlBlock(enPath: string): string {
  const enUrl = `${ORIGIN}${enPath}`;
  const ptUrl = enPath === '/' ? `${ORIGIN}/pt` : `${ORIGIN}/pt${enPath}`;

  const alternates = [
    `    <xhtml:link rel="alternate" hreflang="en" href="${enUrl}"/>`,
    `    <xhtml:link rel="alternate" hreflang="pt-PT" href="${ptUrl}"/>`,
    `    <xhtml:link rel="alternate" hreflang="x-default" href="${enUrl}"/>`,
  ].join('\n');

  return [
    `  <url>\n    <loc>${enUrl}</loc>\n    <lastmod>${LASTMOD}</lastmod>\n${alternates}\n  </url>`,
    `  <url>\n    <loc>${ptUrl}</loc>\n    <lastmod>${LASTMOD}</lastmod>\n${alternates}\n  </url>`,
  ].join('\n');
}

export const GET: RequestHandler = () => {
  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"',
    '        xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    ...BASE_PATHS.map(buildUrlBlock),
    '</urlset>',
    '',
  ].join('\n');

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
    },
  });
};
