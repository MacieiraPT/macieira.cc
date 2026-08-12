/**
 * work.js — renders js/data/projects.js into the "Selected work" grid.
 *
 * The markup that ships in index.html is the grid as it stands: real cards,
 * written out, so the work section is not blank for a crawler or for a visitor
 * with JavaScript off. This replaces it with the same list rendered from data,
 * which is what makes adding a project a one-object edit — and what lets the
 * cards follow a language switch, since the markup can only carry one `data-pt`
 * per element and a project's fields are not always translated.
 *
 * Nothing is lost when this never runs: the first entry here is also the card
 * in the HTML. Keep the two in step.
 */

import { projects } from '../data/projects.js';
import { language, onLanguageChange } from './lang.js';

export function initWork() {
  const grid = document.querySelector('[data-work-grid]');
  if (!grid || !projects.length) return;

  render(grid);
  // Entries may carry a `pt` block; the ones that don't simply stay as they
  // were written, which is the right default for a project name.
  onLanguageChange(() => render(grid));
}

function render(grid) {
  const pt = language() === 'pt';

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
      title.textContent = (pt && project.pt?.title) || project.title;

      const summary = document.createElement('p');
      summary.className = 'work-card__text';
      summary.textContent = (pt && project.pt?.summary) || project.summary;
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
}
