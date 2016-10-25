const GA_LOCAL_STORAGE_KEY = '_ga';


// Schema:
// ---------------------
// {
//   clientId: String(),
//   trackers: {
//     [name]: {
//       index: Number,
//       time: Number,
//       payload: String
//     }
//   }
// }


/**
 * Gets the ga metadata stored in localStorage.
 * @return {Object} The ga metadata.
 */
export function getStoredData() {
  let data;
  try {
    data = JSON.parse(window.localStorage.getItem(GA_LOCAL_STORAGE_KEY));
  } catch (err) {
    // Do nothing...
  }
  data = data || {};
  data.trackers = data.trackers || {};
  return data;
}


/**
 * Gets the just the stored metadata for the passed tracker.
 * @param {string} name The tracker name.
 * @return {Object} The tracker metadata.
 */
export function getStoredTrackerData(name) {
  const data = getStoredData();
  return data.trackers[name] || {};
}


/**
 * Writes the passed data object to localStorage.
 * @param {Object} data The data to store.
 */
export function setStoredData(data) {
  try {
    window.localStorage.setItem(GA_LOCAL_STORAGE_KEY, JSON.stringify(data));
  } catch(err) {
    // Do nothing...
  }
}


/**
 * Writes the passed data for the specified tracker.
 * @param {string} name The tracker name.
 * @param {Object} trackerData The data to store.
 */
export function setStoredTrackerData(name, trackerData) {
  const data = getStoredData();
  data.trackers[name] = trackerData;
  setStoredData(data);
}
