/**
 * Returns the markup to generate an SVG icon.
 */
export const renderIcon = (id: string): string => {
  return `<svg class="Icon" viewBox="0 0 24 24">
    <use href="#icon-${id}"></use></svg>`;
};
