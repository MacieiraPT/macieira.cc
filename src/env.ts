import { defineEnvVars } from '@sveltejs/kit/env';

export const variables = defineEnvVars({
  GITHUB_TOKEN: {
    schema: (value) => value?.trim() || undefined,
    description: 'Optional GitHub personal access token for elevated /api/github upstream rate limits.',
  },
});
