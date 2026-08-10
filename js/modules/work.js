/**
 * work.js — renders js/data/projects.js into the "Selected work" grid.
 *
 * While the list is empty the markup that shipped in index.html stays exactly
 * as it is (three honest placeholder slots). The moment the list has entries,
 * the placeholders are replaced by real cards. That way the empty state is
 * server-rendered HTML rather than something JS has to draw.
 */

import { projects } from '../data/projects.js';

export function initWork() {
  const grid = document.querySelector('[data-work-grid]');
  const note = document.querySelector('.work__note');
  if (!grid || !projects.length) return;

  grid.replaceChildren(
    ...projects.map((project) => {
      // Linked entries become anchors; unlinked ones stay plain articles.
      const card = document.createElement(project.url ? 'a' : 'article');
      card.className = 'work-card work-card--real';
      if (project.url) {
        card.href = project.url;
        card.target = '_blank';
        card.rel = 'noopener';
      }

      if (project.year) {
        const year = document.createElement('p');
        year.className = 'work-card__slot mono';
        year.textContent = String(project.year);
        card.append(year);
      }

      const title = document.createElement('p');
      title.className = 'work-card__title';
      title.textContent = project.title;

      const summary = document.createElement('p');
      summary.className = 'work-card__text';
      summary.textContent = project.summary;
      card.append(title, summary);

      if (project.tags?.length) {
        const tags = document.createElement('p');
        tags.className = 'work-card__tags';
        project.tags.forEach((label) => {
          const tag = document.createElement('span');
          tag.className = 'work-card__tag';
          tag.textContent = label;
          tags.append(tag);
        });
        card.append(tags);
      }

      return card;
    })
  );

  if (note) note.remove(); // the "empty on purpose" line has outlived its usefulness
}
