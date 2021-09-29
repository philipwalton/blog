import {v1} from './log/v1.js';
import {v2} from './log/v2.js';
import {v3} from './log/v3.js';

/**
 * @param {Object} request
 * @param {Object} response
 */
export async function log(request, response) {
  const version = Number(request.query.v);
  switch (version) {
    case 3:
      await v3(request);
      break;
    case 2:
      await v2(request);
      break;
    default:
      await v1(request);
      break;
  }
  response.end();
}
