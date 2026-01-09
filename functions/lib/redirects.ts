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

  // Add missing trailing slash.
  if (
    !path.endsWith('/') &&
    !(path.startsWith('/shell-') || path.endsWith('_index'))
  ) {
    path += '/';
  }

  if (path !== originalPath) {
    return path;
  }
}
