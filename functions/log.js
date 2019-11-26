const fs = require('fs');
const uuid = require('uuid/v4')
const fetch = require('node-fetch');


const cd = {
  BREAKPOINT: 'cd1',
  PIXEL_DENSITY: 'cd2',
  SITE_VERSION: 'cd3',
  HIT_SOURCE: 'cd4',
  EFFECTIVE_CONNECTION_TYPE: 'cd5',
  METRIC_VALUE: 'cd6',
  CLIENT_ID: 'cd7',
  SERVICE_WORKER_REPLAY: 'cd8',
  SERVICE_WORKER_STATE: 'cd9',
  CACHE_HIT: 'cd10',
  WINDOW_ID: 'cd11',
  VISIBILITY_STATE: 'cd12',
  HIT_TYPE: 'cd13',
  HIT_ID: 'cd14',
  HIT_TIME: 'cd15',
  TRACKING_VERSION: 'cd16',
};


async function log(request, response) {
  const params = new URLSearchParams(request.body);

  // Set data not specific to the client
  params.set('v', '1');
  params.set('tid', 'UA-21292978-1');

  // Set a unique ID for every hit
  params.set(cd.HIT_ID, uuid());

  // Set the `uip` param to the IP address of the user.
  const uip = request.ip;
  if (uip) {
    params.set('uip', request.ip);
  }

  // Convert `ht` (hit time) to `qt` (queue time).
  const hitTime = params.get('ht');
  if (hitTime) {
    params.delete('ht');
    params.set('qt', Date.now() - Number(hitTime));
  }

  // Ensure a custom dimension shadows the hit type.
  params.set(cd.HIT_TYPE, params.get('t'));

  // Ensure a custom dimension shadows the client ID
  params.set(cd.CLIENT_ID, params.get('cid'));

  // Ensure all custom dimensions have a value
  for (const value of Object.values(cd)) {
    if (!params.has(value)) {
      params.set(value, '(not set)');
    }
  }

  // Ensure (for event hits), all event dimensions have a value
  if (params.get('t') === 'event') {
    for (const value of ['ec', 'ea', 'el']) {
      if (!params.has(value)) {
        params.set(value, '(not set)');
      }
    }
  }

  const body = params.toString();

  // Record logs when running locally.
  if (!process.env.FIREBASE_CONFIG) {
    try {
      fs.appendFileSync('beacons.log', body + '\n');
    } catch (err) {
      console.error('Could not write to file `log.txt`', err);
    }
  }

  await fetch('https://www.google-analytics.com/collect', {
    method: 'POST',
    body: params.toString(),
    headers: {
      'User-Agent': request.get('User-Agent'),
    },
  });

  response.end();
}

module.exports = {log};
