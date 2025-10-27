/**
 * Returns the markup to generate an SVG icon.
 * @param {string} id The icon id from the main icons file.
 * @return {string} The icon markup.
 */
export const renderIcon = (id) => {
  return `<svg class="Icon" viewBox="0 0 24 24">
    <use xmlns:xlink="http://www.w3.org/1999/xlink"
         xlink:href="#icon-${id}"></use></svg>`;
};
