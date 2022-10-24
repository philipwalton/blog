/**
 * @param {URL}
 * @returns {URL}
 */
export function getRedirectPath(path) {
  // Keep a copy of original path since redirected path may be modified.
  const originalPath = path;

  // First, handle URL changes first.
  // -------------------------------------------------------------------------

  // Rename old Google Analytics post.
  if (path.match(/^(.+)google-analytics(.+)$/)) {
    path = `${RegExp.$1}ga${RegExp.$2}`;
  }

  // Then, handle URL normalization after any changes.
  // -------------------------------------------------------------------------

  // Remove trailing index.html
  if (path.endsWith('index.html')) {
    path = path.slice(0, -10);
  }

  // Add missing trailing slash.
  if (!path.endsWith('/') && !path.endsWith('index.content.html')) {
    path += '/';
  }

  if (path !== originalPath) {
    return path;
  }
}
