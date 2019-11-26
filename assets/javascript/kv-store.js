let db;

/**
 * @return {Promise<IDBDatabase>}
 */
function openDB() {
  return new Promise((resolve, reject) => {
    if (db) {
      resolve(db);
    } else {
      const req = indexedDB.open('kv-store', 1);
      req.onsuccess = () => resolve(db = req.result);
      req.onerror = () => reject(req.error);
      req.onupgradeneeded = () => req.result.createObjectStore('kv-store');
    }
  });
}


/**
 * @param {string} key
 * @return {Promise<any>}
 */
export async function get(key) {
  db = await openDB();
  return new Promise((resolve, reject) => {
    const txn = db.transaction('kv-store', 'readonly');
    const req = txn.objectStore('kv-store').get(key);
    txn.onabort = () => reject(txn.error);
    req.onsuccess = () => resolve(req.result);
  });
}

/**
 *
 * @param {*} key
 * @param {*} value
 * @return {Promise<void>}
 */
export async function set(key, value) {
  db = await openDB();
  return new Promise((resolve, reject) => {
    const txn = db.transaction('kv-store', 'readwrite');
    txn.onabort = () => reject(txn.error);
    txn.oncomplete = () => resolve(value);
    txn.objectStore('kv-store').put(value, key);
  });
}

