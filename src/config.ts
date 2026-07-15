/**
 * Site-wide metadata.
 */
export const site = {
  title: 'Philip Walton',
  // Appended to page-specific titles to build `document.title`.
  // NOTE: Logger.ts strips this suffix back off via the regex
  // `/\s+—.*$/` when logging the title, so the leading em dash here
  // must stay in sync with that pattern.
  titleSuffix: ' — Philip Walton',
  slug: 'philipwalton',
  description:
    'Thoughts on web development, open source, software architecture, and the future.',
  // Astro also knows the site origin via `astro.config.ts`'s `site` option
  // (exposed at runtime as `Astro.site`), but that's a URL object intended
  // for resolving canonical/absolute URLs, not a plain string. Duplicating
  // it here as a string keeps callers that just want to concatenate a
  // origin (e.g. building share links or feed URLs) simple, at the cost of
  // needing to keep this value in sync with `astro.config.ts`.
  baseUrl: 'https://philipwalton.com',
};
