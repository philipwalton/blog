import fs from 'fs';
import fetch from 'node-fetch';
import {convertGA4ParamsToUA} from './convertGA4ParamsToUA.js';
import {GA4_MEASUREMENT_ID} from '../constants.js';

/**
 *
 * @param {Object} request
 */
export async function v3(request) {
  const [paramsLine, ...eventsLines] = request.body.trim().split('\n');

  const queryParams = new URLSearchParams(
    [`v=2`, `tid=${GA4_MEASUREMENT_ID}`, paramsLine].join('&'),
  );

  // Set the `_uip` param to the IP address of the user.
  if (request.ip) {
    queryParams.set('_uip', request.ip);
  }

  const uaURL = 'https://www.google-analytics.com/batch';
  const uaBody = eventsLines
    .map((eventParams) => {
      const params = new URLSearchParams(queryParams + '&' + eventParams);
      convertGA4ParamsToUA(params);
      return params.toString();
    })
    .join('\n');

  // If the query params contain _ss or _fv, and it also contains multiple
  // events where one of those events is a page_view event, split it out into
  // two separate requests, so the `page_view` event gets sent first
  // along with the _ss and _fv params.
  const newSessionPageviewEvent =
    (queryParams.has('_ss') || queryParams.has('_fv')) &&
    eventsLines.length > 1 &&
    eventsLines.find((line) => line.trim().startsWith('en=page_view'));

  const newSessionParams =
    newSessionPageviewEvent &&
    new URLSearchParams(`${queryParams}&${newSessionPageviewEvent}`);

  if (newSessionPageviewEvent) {
    queryParams.delete('_fv');
    queryParams.delete('_ss');
    eventsLines.splice(eventsLines.indexOf(newSessionPageviewEvent), 1);
  }

  const ga4SessionURL =
    newSessionParams &&
    'https://www.google-analytics.com/g/collect?' + newSessionParams;

  const ga4URL = 'https://www.google-analytics.com/g/collect?' + queryParams;
  const ga4Body = eventsLines.join('\n');

  /**
   * @param {string} url
   * @param {string} body
   */
  const beacon = async (url, body) => {
    // Send beacons when running on Firebase, otherwise just log them.
    if (process.env.FIREBASE_CONFIG) {
      await fetch(url, {
        body,
        method: 'POST',
        headers: {
          'User-Agent': request.get('User-Agent'),
        },
      });
    } else {
      try {
        let contents = url + '\n';
        if (body) {
          contents += body + '\n';
        }
        fs.appendFileSync('beacons.log', contents + '\n');
      } catch (err) {
        console.error('Could not write to file `beacons.log`', err);
      }
    }
  };

  const requests = [];
  if (ga4SessionURL) {
    requests.push(beacon(ga4SessionURL));
  }
  requests.push(beacon(ga4URL, ga4Body));
  requests.push(beacon(uaURL, uaBody));

  await Promise.all(requests);
}
