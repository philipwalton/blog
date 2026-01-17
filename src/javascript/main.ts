import * as breakpoints from './breakpoints.ts';
import * as contentLoader from './content-loader.ts';
import * as linkableHeadings from './linkable-headings.ts';
import * as log from './log.ts';

/**
 * Unregisters all service workers and deletes all caches.
 * This is used to clean up after removing service worker support.
 */
const cleanupServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map((r) => r.unregister()));
  }
  if ('caches' in self) {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map((name) => caches.delete(name)));
  }
};

/**
 * The main script entry point for the site. Initializes all the sub modules
 * and log tracking.
 */
const main = async () => {
  breakpoints.init();
  contentLoader.init();
  linkableHeadings.init();

  // Clean up any existing service workers and caches from previous versions.
  await cleanupServiceWorker();

  log.init();
};

main();
