export const breakpoints = [
  {name: 'sm', media: 'all'},
  {name: 'md', media: '(min-width: 36em)'},
  {name: 'lg', media: '(min-width: 48em)'}
];


let activeBreakpoint;


function handleChanges() {
  for (let breakpoint of breakpoints) {
    if (breakpoint.mql.matches) {
      activeBreakpoint = breakpoint;
    }
  }
}


export function init() {
  for (let breakpoint of breakpoints) {
    breakpoint.mql = window.matchMedia(breakpoint.media);
    breakpoint.mql.addListener(handleChanges);
    if (breakpoint.mql.matches) {
      activeBreakpoint = breakpoint;
    }
  }
}


export function getActiveBreakpoint() {
  return activeBreakpoint;
}
