export const cacheNames = {
  META: 'meta:v1',
  SHELL: 'shell:v1',
  CONTENT: 'content:v1',
  STATIC_ASSETS: 'static-assets:v1',
  THIRD_PARTY_ASSETS: 'third-party-assets:v1',
};

export const deleteUnusedCaches = async () => {
  const usedCacheNames = await caches.keys();
  const validCacheNames = new Set(Object.values(cacheNames));
  for (const usedCacheName of usedCacheNames) {
    if (!validCacheNames.has(usedCacheName)) {
      await caches.delete(usedCacheName);
    }
  }
};
