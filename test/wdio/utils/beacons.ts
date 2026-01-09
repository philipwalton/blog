import fs from 'fs-extra';

const LOG_FILE = 'beacons.log';

interface LogEntry {
  url: URL;
  headers: Headers;
  body: string;
  events: URLSearchParams[];
}

type ParamsObj = Record<string, string | RegExp>;

/**
 * @param {Object|Object[]} paramsList
 * @return {Promise<boolean|URLSearchParams>}
 *     A `URLSearchParams` object with the matching beacon if the params are
 *     found in any one of the beacons, false otherwise.
 */
export async function beaconsContain(
  paramsListOrObj: ParamsObj | ParamsObj[],
): Promise<boolean | URLSearchParams | URLSearchParams[]> {
  const beacons = await getBeacons();
  const matches: URLSearchParams[] = [];

  const paramsList = Array.isArray(paramsListOrObj)
    ? paramsListOrObj
    : [paramsListOrObj];

  for (const beacon of beacons) {
    const params = paramsList[matches.length]!; // Should always be defined.
    const paramsToCheck = new Set(Object.keys(params));

    for (const param of paramsToCheck) {
      const value = params[param];
      if (
        value === beacon.get(param) ||
        (value instanceof RegExp && value.test(beacon.get(param)!))
      ) {
        paramsToCheck.delete(param);
      }
    }
    if (paramsToCheck.size === 0) {
      matches.push(beacon);
      if (matches.length === paramsList.length) {
        return Array.isArray(paramsListOrObj) ? matches : matches[0]!;
      }
    }
  }
  return false;
}

async function processLogs(): Promise<LogEntry[]> {
  await fs.ensureFile(LOG_FILE);
  const log = await fs.readFile(LOG_FILE, 'utf-8');
  let idx = 0;

  return log
    .split(/\n--\n/)
    .filter(Boolean)
    .map((payload) => {
      idx++;

      const [urlString, headersString, ...eventStrings] = payload
        .trim()
        .split('\n');

      const body = eventStrings.join('\n');

      const url = new URL(urlString || '', 'https://localhost:3001');
      const headers = new Headers(
        Object.fromEntries(new URLSearchParams(headersString).entries()),
      );

      let events: URLSearchParams[];

      if (eventStrings.length) {
        events = eventStrings.map((e) => {
          return new URLSearchParams(url.search + `&${e}&__idx=${idx}`);
        });
      } else {
        events = [new URLSearchParams(url.search + `&__idx=${idx}`)];
      }

      return {url, headers, body, events};
    });
}

export async function getLogs({
  count = 1,
  timeout = 10000,
}: {
  count?: number;
  timeout?: number;
} = {}): Promise<LogEntry[]> {
  let logs: LogEntry[] = [];
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
export async function getBeacons(
  paramsFilter?: (params: URLSearchParams) => boolean,
): Promise<URLSearchParams[]> {
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
