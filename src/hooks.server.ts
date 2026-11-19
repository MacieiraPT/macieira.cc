import type { Handle } from '@sveltejs/kit/hooks';
import { building } from '$app/env';

const BASE_SECURITY_HEADERS: Record<string, string> = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-Frame-Options': 'DENY',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
};

const API_CSP =
  "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'";

export const handle: Handle = async ({ event, resolve }) => {
  const { pathname } = event.url;
  const isPt = pathname === '/pt' || pathname.startsWith('/pt/');

  // Backwards-compatible ?lang= redirect for dynamic/non-asset runtime requests
  if (!building && !pathname.startsWith('/api/')) {
    const { searchParams } = event.url;
    const qLang = searchParams.get('lang')?.slice(0, 2).toLowerCase();
    if (qLang === 'pt' || qLang === 'en') {
      const cleanParams = new URLSearchParams(searchParams);
      cleanParams.delete('lang');
      const qs = cleanParams.toString();
      const suffix = qs ? `?${qs}` : '';

      if (qLang === 'pt' && !isPt) {
        const target = pathname === '/' ? '/pt' : `/pt${pathname}`;
        return new Response(null, { status: 302, headers: { Location: `${target}${suffix}` } });
      }
      if (qLang === 'en' && isPt) {
        const stripped = pathname === '/pt' ? '/' : pathname.slice(3) || '/';
        return new Response(null, { status: 302, headers: { Location: `${stripped}${suffix}` } });
      }
    }
  }

  const htmlLang = isPt ? 'pt-PT' : 'en';
  const dataLang = isPt ? 'pt' : 'en';

  const response = await resolve(event, {
    transformPageChunk: ({ html }) =>
      html.replace('%lang%', htmlLang).replace('%dataLang%', dataLang),
  });

  for (const [header, value] of Object.entries(BASE_SECURITY_HEADERS)) {
    if (!response.headers.has(header)) {
      response.headers.set(header, value);
    }
  }

  const contentType = response.headers.get('content-type') ?? '';
  if (contentType.includes('text/html')) {
    const existingCsp = response.headers.get('content-security-policy');
    if (existingCsp && !existingCsp.includes('frame-ancestors')) {
      response.headers.set('content-security-policy', `${existingCsp}; frame-ancestors 'none'`);
    } else if (!existingCsp) {
      response.headers.set(
        'content-security-policy',
        "frame-ancestors 'none'; object-src 'none'; base-uri 'none'; form-action 'none'"
      );
    }
  } else if (!response.headers.has('content-security-policy')) {
    response.headers.set('content-security-policy', API_CSP);
  }

  return response;
};
