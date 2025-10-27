interface Breakpoint {
  name: string;
  media: string;
  mql?: MediaQueryList;
}

export const breakpoints: Breakpoint[] = [
  {name: 'sm', media: 'all'},
  {name: 'md', media: '(min-width: 36em)'},
  {name: 'lg', media: '(min-width: 48em)'},
];

// Set a default initially, which will be overridden at `init()` time
// if anything matches.
let activeBreakpoint: Breakpoint = breakpoints[0]!;

/**
 * A callback for each MediaQueryList that handles detecting the active
 * media query and stores that on the `activeBreakpoint` variable.
 */
function handleChanges() {
  for (const breakpoint of breakpoints) {
    if (breakpoint.mql!.matches) {
      activeBreakpoint = breakpoint;
    }
  }
}

/**
 * Initializes listening for changes to breakpoints as well as determining the
 * current active breakpoint.
 */
export function init() {
  for (const breakpoint of breakpoints) {
    breakpoint.mql = window.matchMedia(breakpoint.media);
    breakpoint.mql.addEventListener('change', handleChanges);
    if (breakpoint.mql!.matches) {
      activeBreakpoint = breakpoint;
    }
  }
}

/**
 * Returns the currently active breakpoint.
 */
export function getActiveBreakpoint() {
  return activeBreakpoint;
}
