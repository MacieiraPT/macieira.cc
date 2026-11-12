import { error } from '@sveltejs/kit';
import { getNextProject, getProjectBySlug, PROJECTS } from '#lib/data/projects.ts';

export function entries() {
  return PROJECTS.map((p) => ({ slug: p.slug }));
}

export function load({ params }: { params: { slug: string } }) {
  const project = getProjectBySlug(params.slug);
  if (!project) {
    error(404, 'Case study not found');
  }
  return {
    project,
    nextProject: getNextProject(project.slug),
  };
}
