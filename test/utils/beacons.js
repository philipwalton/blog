import {strict as assert} from 'assert';
import fs from 'fs-extra';


const LOG_FILE = 'beacons.log';

/**
 * @param {Object} params
 * @return {Promise<boolean>} True if the params are found in any one of the
 *     beacons.
 */
export async function beaconsContain(params) {
  const beacons = await getBeacons();

  for (const beacon of beacons) {
    const paramsToCheck = new Set(Object.keys(params));
    for (const param of paramsToCheck) {
      const value = params[param];
      if (value === beacon.get(param) ||
          value instanceof RegExp && value.test(beacon.get(param))) {
        paramsToCheck.delete(param);
      }
    }
    if (paramsToCheck.size === 0) {
      return beacon;
    }
  }
  return false;
}

/**
 * Gets the array of beacons sent for the current page load.
 * @return {Promise<Array>}
 */
export async function getBeacons() {
  await fs.ensureFile(LOG_FILE);
  const log = await fs.readFile(LOG_FILE, 'utf-8');

  return log.trim().split('\n\n').filter(Boolean).map((payload) => {
    let [url, ...events] = payload.split('\n');

    url = new URL(url);
    events = events.map((e) => new URLSearchParams(url.search + '&' + e));

    // Since this function only returns the beacon data,
    // assert the correct URL is used here.
    assert.strictEqual(url.origin, 'https://www.google-analytics.com');

    if (url.pathname === '/g/collect') {
      for (const event of events) {
        assert.strictEqual(event.get('v'), '2');
      }
    } else if (url.pathname === '/batch' || url.pathname === '/collect') {
      for (const event of events) {
        assert.strictEqual(event.get('v'), '1');
      }
    } else {
      throw new Error(
          `Incorrect Measurement Protocol pathname: ${url.pathname}`);
    }

    return events;
  }).flat();
}

/**
 * Clears the array of beacons on the page.
 * @return {Promise<void>}
 */
export async function clearBeacons() {
  await fs.remove(LOG_FILE);
}
