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

async function processLogs() {
  await fs.ensureFile(LOG_FILE);
  const log = await fs.readFile(LOG_FILE, 'utf-8');
  let idx = 0;

  return log
    .split(/\n--\n/)
    .filter(Boolean)
    .map((payload) => {
      idx++;

      let [url, headers, ...events] = payload.trim().split('\n');
      const body = events.join('\n');

      url = new URL(url, 'https://localhost:3001');
      headers = new Headers(new URLSearchParams(headers).entries());

      if (events.length) {
        events = events.map((e) => {
          return new URLSearchParams(url.search + `&${e}&__idx=${idx}`);
        });
      } else {
        events = [new URLSearchParams(url.search + `&__idx=${idx}`)];
      }

      return {url, headers, body, events};
    });
}

export async function getLogs({count = 1, timeout = 10000}) {
  let logs = [];
  const startTime = Date.now();
  while (Date.now() < startTime + timeout) {
    logs = await processLogs();
    if (logs.length >= count) {
      return logs;
    }
    // Wait 100ms before checking the logs again.
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error(`Timeout after ${timeout}ms waiting for log count: ${count}`);
}

/**
 * Gets the array of beacons sent for the current page load.
 * @return {Promise<Array>}
 */
export async function getBeacons(paramsFilter) {
  const log = await processLogs();
  const beacons = log.map((entry) => entry.events).flat();

  return paramsFilter ? beacons.filter(paramsFilter) : beacons;
}

/**
 * Clears the array of beacons on the page.
 * @return {Promise<void>}
 */
export async function clearBeacons() {
  await fs.remove(LOG_FILE);
}
