import * as breakpoints from './breakpoints.ts';
import * as contentLoader from './content-loader.ts';
import * as linkableHeadings from './linkable-headings.ts';
import * as log from './log.ts';

/**
 * The main script entry point for the site. Initializes all the sub modules
 * and log tracking.
 */
const main = () => {
  breakpoints.init();
  contentLoader.init();
  linkableHeadings.init();
  log.init();
};

main();
