import { defineParams } from '@sveltejs/kit/params';

export const params = defineParams({
  lang: (param) => (param === 'pt' ? 'pt' : undefined),
});
