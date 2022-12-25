import fs from 'fs';
import fetch from 'node-fetch';
import {convertGA4ParamsToUA} from './convertGA4ParamsToUA.js';
import {GA4_MEASUREMENT_ID} from '../constants.js';

/**
 *
 * @param {Object} request
 */
export async function v2(request) {
  const queryParams = new URLSearchParams(request.query);

  queryParams.set('tid', GA4_MEASUREMENT_ID);

  // Set the `_uip` param to the IP address of the user.
  if (request.ip) {
    queryParams.set('_uip', request.ip);
  }

  const ga4URL = 'https://www.google-analytics.com/g/collect?' + queryParams;
  const ga4Body = request.body;

  const uaURL = 'https://www.google-analytics.com/batch';
  const uaBody = request.body
    .split(/\n/)
    .map((eventParams) => {
      const params = new URLSearchParams(queryParams + '&' + eventParams);
      convertGA4ParamsToUA(params);
      return params.toString();
    })
    .join('\n');

  // Send beacons when running on Firebase, otherwise just log them.
  if (process.env.FIREBASE_CONFIG) {
    /**
     * @param {string} url
     * @param {string} body
     */
    const beacon = async (url, body) => {
      await fetch(url, {
        body,
        method: 'POST',
        headers: {
          'User-Agent': request.get('User-Agent'),
        },
      });
    };

    await Promise.all([beacon(ga4URL, ga4Body), beacon(uaURL, uaBody)]);
  } else {
    try {
      fs.appendFileSync(
        'beacons.log',
        [ga4URL, ga4Body, '', uaURL, uaBody, '\n'].join('\n')
      );
    } catch (err) {
      console.error('Could not write to file `beacons.log`', err);
    }
  }
}
