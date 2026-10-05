interface Breakpoint {
  name: string;
  media: string;
}

interface BreakpointWithMql extends Breakpoint {
  mql: MediaQueryList;
}

export const breakpoints: Breakpoint[] = [
  {name: 'sm', media: 'all'},
  {name: 'md', media: '(min-width: 36em)'},
  {name: 'lg', media: '(min-width: 48em)'},
];

// Populated by `init()`, pairing each breakpoint with its live
// MediaQueryList.
let breakpointsWithMql: BreakpointWithMql[] = [];

// Set a default initially, which will be overridden at `init()` time
// if anything matches.
let activeBreakpoint: Breakpoint = breakpoints[0]!;

/**
 * A callback for each MediaQueryList that handles detecting the active
 * media query and stores that on the `activeBreakpoint` variable.
 */
function handleChanges() {
  for (const breakpoint of breakpointsWithMql) {
    if (breakpoint.mql.matches) {
      activeBreakpoint = breakpoint;
    }
  }
}

/**
 * Initializes listening for changes to breakpoints as well as determining the
 * current active breakpoint.
 */
export function init() {
  breakpointsWithMql = breakpoints.map((breakpoint) => {
    const mql = window.matchMedia(breakpoint.media);
    mql.addEventListener('change', handleChanges);
    return {...breakpoint, mql};
  });
  handleChanges();
}

/**
 * Returns the currently active breakpoint.
 */
export function getActiveBreakpoint() {
  return activeBreakpoint;
}
