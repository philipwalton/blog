/**
 * Returns the markup to generate an SVG icon.
 */
export const renderIcon = (id: string): string => {
  return `<svg class="Icon" viewBox="0 0 24 24">
    <use xmlns:xlink="http://www.w3.org/1999/xlink"
         xlink:href="#icon-${id}"></use></svg>`;
};
