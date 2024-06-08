import {v3} from './log/v3.js';

/**
 * @param {Object} request
 * @param {Object} response
 */
export async function log(request, response) {
  const version = Number(request.query.v);

  // Process v3 log requests, if the version is explicitly set.
  // Otherwise ignore them (older version are now more than a year old).
  if (version === 3) {
    await v3(request);
  }

  response.end();
}
