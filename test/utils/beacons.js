import {strict as assert} from 'assert';
import fs from 'fs-extra';

const LOG_FILE = 'beacons.log';

/**
 * @param {Object|Object[]} paramsList
 * @return {Promise<boolean|URLSearchParams>}
 *     A `URLSearchParams` object with the matching beacon if the params are
 *     found in any one of the beacons, false otherwise.
 */
export async function beaconsContain(paramsListOrObj) {
  const beacons = await getBeacons();
  const matches = [];

  const paramsList = Array.isArray(paramsListOrObj)
    ? paramsListOrObj
    : [paramsListOrObj];

  for (const beacon of beacons) {
    const params = paramsList[matches.length];
    const paramsToCheck = new Set(Object.keys(params));

    for (const param of paramsToCheck) {
      const value = params[param];
      if (
        value === beacon.get(param) ||
        (value instanceof RegExp && value.test(beacon.get(param)))
      ) {
        paramsToCheck.delete(param);
      }
    }
    if (paramsToCheck.size === 0) {
      matches.push(beacon);
      if (matches.length === paramsList.length) {
        return Array.isArray(paramsListOrObj) ? matches : matches[0];
      }
    }
  }
  return false;
}

/**
 * Gets the array of beacons sent for the current page load.
 * @return {Promise<Array>}
 */
export async function getBeacons(paramsFilter) {
  await fs.ensureFile(LOG_FILE);
  const log = await fs.readFile(LOG_FILE, 'utf-8');
  let idx = 0;

  const beacons = log
    .trim()
    .split('\n\n')
    .filter(Boolean)
    .map((payload) => {
      let [url, ...events] = payload.split('\n');
      url = new URL(url);

      idx++;

      if (events.length) {
        events = events.map((e) => {
          return new URLSearchParams(url.search + `&${e}&__idx=${idx}`);
        });
      } else {
        events = [new URLSearchParams(url.search + `&__idx=${idx}`)];
      }

      // Since this function only returns the beacon data,
      // assert the correct URL is used here.
      assert.strictEqual(url.origin, 'https://www.google-analytics.com');

      if (url.pathname === '/g/collect') {
        for (const event of events) {
          assert.strictEqual(event.get('v'), '2');
        }
      } else {
        throw new Error(
          `Incorrect Measurement Protocol pathname: ${url.pathname}`,
        );
      }

      return events;
    })
    .flat();

  return paramsFilter ? beacons.filter(paramsFilter) : beacons;
}

/**
 * Clears the array of beacons on the page.
 * @return {Promise<void>}
 */
export async function clearBeacons() {
  await fs.remove(LOG_FILE);
}
