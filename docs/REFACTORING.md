# Repository Refactoring Record

This document records the structural cleanup completed during the 2026-08 refactoring pass. The goal was to improve maintainability without changing the generated site, page appearance, URLs, or user-facing behavior.

## Changes made

### Build system

- Renamed `scripts/build_site.py` to `scripts/build_entities.py` because its responsibility is Entity-page generation, not the entire site build.
- Kept `scripts/build.py` as the single production build entry point.
- Kept `scripts/build_data.py` responsible for shared CSV data loading and URL-ID normalization.
- Kept `scripts/build_html.py` responsible for shared HTML/layout helpers.
- Kept `scripts/build_glossary.py` as the dedicated Glossary builder.
- Did **not** split `prepare_site()` out of `build_entities.py`; its current scope is small and it is a natural prerequisite of Entity generation. Splitting it would add dependencies without improving clarity.

### JavaScript

- Renamed the CSV loader from `assets/js/data.js` to `assets/js/csv.js`.
- Separated Entity card rendering into `assets/js/entity-cards.js`.
- Separated Entity list data grouping into `assets/js/entity-list-data.js`.
- Kept `assets/js/entity-pages.js` focused on Entity list-page rendering.
- Unified JavaScript URL normalization on the shared `urlId()` helper while preserving the existing normalization rule.
- Kept Character, Song, Work, Glossary, and language-specific page logic in their dedicated files.
- Removed the redundant `menu-ui.js` experiment. `menu.js` was intentionally kept self-contained for its UI-building logic after dependency-based splitting caused regressions.
- Kept Glossary list sorting self-contained in `glossary-pages.js`. An attempted dependency on `glossary-sort.js` was reverted because it made the list page unnecessarily dependent on another script and caused a regression where only the search field remained.

### CSS

- Moved Entity-list CSS out of JavaScript and into `assets/css/entity-pages.css`.
- Kept shared Entity card styles in `assets/css/entity-cards.css`.
- Renamed remaining Character-detail CSS selectors that still used the historical `092` preview name.
- Removed unused legacy stylesheets `assets/css/font-comparison.css` and `assets/css/viewport-lock.css`.
- Did not merge visually similar page-specific styles into larger shared stylesheets when doing so would blur page responsibilities or increase cascade risk.

### Other cleanup

- Removed obsolete `preview/` content after confirming it was not referenced by the production build.
- Kept templates as page-specific HTML skeletons. No forced template unification was introduced because the current Character, Song, Work, and Glossary templates have meaningfully different responsibilities.

## Intentionally unchanged

The following areas were deliberately left alone because changing them would create more risk than maintenance benefit:

- Existing page URLs and URL-ID semantics.
- The public visual design and generated HTML structure.
- The self-contained Glossary list sorter.
- The self-contained `menu.js` UI implementation.
- Page-specific CSS files whose differences are intentional.
- `prepare_site()` inside `build_entities.py`.
- Template structure and placeholder IDs.

## Maintenance rules

1. Preserve generated output unless a visual or behavioral change is explicitly requested.
2. Treat existing URLs and `url_id` values as stable public interfaces.
3. Prefer removing duplicated logic over adding abstraction layers.
4. Do not split a module merely because it is large; split only when the resulting dependency graph becomes simpler.
5. When sharing a helper across page families, verify that every generated page loads the dependency in the required order.
6. CI success is necessary but not sufficient for front-end refactors; page-specific runtime dependencies can still produce blank or partially rendered UI.
7. Glossary navigation and menu code are deliberately somewhat specialized because their UI structure is more complex than ordinary Entity pages.

## Validation

For each refactoring change, the expected validation order is:

1. Confirm the source-level dependency graph.
2. Confirm generated files/build success.
3. Confirm GitHub Pages deployment success.
4. Spot-check affected pages in the deployed site, especially pages with dedicated builders or unusual script dependencies.

This record is a design-history document, not a specification for future changes. Future refactoring should re-evaluate these decisions against the current code before changing them.
