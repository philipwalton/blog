export function getRedirectPath(path: string): string | undefined {
  // Keep a copy of original path since redirected path may be modified.
  const originalPath = path;

  // Rename old Google Analytics post.
  const match = path.match(/^(.+)google-analytics(.+)$/);
  if (match) {
    path = `${match[1]}ga${match[2]}`;
  }

  // TODO: add other redirect logic here as it comes up...

  if (path !== originalPath) {
    return path;
  }
}
