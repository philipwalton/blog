let dbPromise;

/**
 * @return {Promise<IDBDatabase>}
 */
function getDB() {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
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
          {once: true, capture: true}
        );
        resolve(req.result);
      };
    });
  }
  return dbPromise;
}

/**
 * @param {string} key
 * @return {Promise<any>}
 */
export async function get(key, def) {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const txn = db.transaction('kv-store', 'readonly');
    const req = txn.objectStore('kv-store').get(key);
    txn.onabort = () => (def === undefined ? reject(txn.error) : resolve(def));
    txn.oncomplete = () => resolve(req.result !== undefined ? req.result : def);
  });
}

/**
 *
 * @param {*} key
 * @param {*} value
 * @return {Promise<void>}
 */
export async function set(key, value, commit) {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const txn = db.transaction('kv-store', 'readwrite');
    txn.onabort = () => reject(txn.error);
    txn.oncomplete = () => resolve(value);
    txn.objectStore('kv-store').put(value, key);
    if (commit && txn.commit) {
      txn.commit();
    }
  });
}
