let dbPromise: Promise<IDBDatabase> | null = null;

/**
 * Gets or creates the IndexedDB database for the KV store.
 */
function getDB(): Promise<IDBDatabase> {
  if (!dbPromise) {
    dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
      const req = indexedDB.open('kv-store', 1);
      req.onupgradeneeded = () => req.result.createObjectStore('kv-store');
      req.onerror = () => reject(req.error);
      req.onsuccess = () => {
        // Close the connection to make the page eligible for bfcache.
        addEventListener(
          'pagehide',
          () => {
            if (req.result) {
              req.result.close();
            }
            dbPromise = null;
          },
          {once: true, capture: true},
        );
        resolve(req.result);
      };
    });
  }
  return dbPromise;
}

/**
 * Gets a value from the KV store, with an optional default value if the key
 * is not found.
 */
export async function get<T>(key: string, def?: T) {
  const db = await getDB();
  return new Promise<T>((resolve, reject) => {
    const txn = db.transaction('kv-store', 'readonly');
    const req = txn.objectStore('kv-store').get(key);
    txn.onabort = () => (def === undefined ? reject(txn.error) : resolve(def));
    txn.oncomplete = () => resolve(req.result !== undefined ? req.result : def);
  });
}

/**
 * Sets a value in the KV store, with an optional commit flag to control
 * whether the transaction should be committed immediately.
 */
export async function set<T>(key: string, value: T, commit?: boolean) {
  const db = await getDB();
  return new Promise<T>((resolve, reject) => {
    const txn = db.transaction('kv-store', 'readwrite');
    txn.onabort = () => reject(txn.error);
    txn.oncomplete = () => resolve(value);
    txn.objectStore('kv-store').put(value, key);
    if (commit && txn.commit) {
      txn.commit();
    }
  });
}
