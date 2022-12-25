import fs from 'fs';
import {v4 as uuid} from 'uuid';
import fetch from 'node-fetch';
import {dimensions, UA_MEASUREMENT_ID} from '../constants.js';

/**
 * @param {Object} request
 */
export async function v1(request) {
  const params = new URLSearchParams(request.body);

  // Set data not specific to the client
  params.set('v', '1');
  params.set('tid', UA_MEASUREMENT_ID);

  // Set a unique ID for every hit
  params.set(dimensions.CD_HIT_ID, uuid());

  // Set the `uip` param to the IP address of the user.
  if (request.ip) {
    params.set('uip', request.ip);
  }

  // Convert `ht` (hit time) to `qt` (queue time).
  const hitTime = params.get('ht');
  if (hitTime) {
    params.delete('ht');
    params.set('qt', Date.now() - Number(hitTime));
  }

  // Ensure a custom dimension shadows the hit type.
  params.set(dimensions.CD_HIT_TYPE, params.get('t'));

  // Ensure a custom dimension shadows the client ID
  params.set(dimensions.CD_CLIENT_ID, params.get('cid'));

  // Ensure all custom dimensions have a value
  for (const dimensionValue of Object.values(dimensions)) {
    if (!params.has(dimensionValue)) {
      params.set(dimensionValue, '(not set)');
    }
  }

  // Ensure (for event hits), all event dimension have a value
  if (params.get('t') === 'event') {
    for (const param of ['ec', 'ea', 'el']) {
      if (!params.has(param)) {
        params.set(param, '(not set)');
      }
    }
  }

  const url = 'https://www.google-analytics.com/collect';
  const body = params.toString();

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
      fs.appendFileSync('beacons.log', [url, body, '\n'].join('\n'));
    } catch (err) {
      console.error('Could not write to file `beacons.log`', err);
    }
  }
}
