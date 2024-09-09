// TODO: add a test for this (both on page load and after a soft nav).
export const init = () => {
  // Currently the deepest heading is <h4>.
  const headings = document.querySelectorAll(
    '#content [id]:is(h2, h3, h4):not(.LinkableHeading)',
  );

  for (const heading of Array.from(headings)) {
    heading.classList.add('LinkableHeading');
    const anchor = Object.assign(document.createElement('a'), {
      className: 'LinkableHeading-anchor',
      innerHTML: '#',
      href: `#${heading.id}`,
    });
    heading.appendChild(anchor);
  }
};
