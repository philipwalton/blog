const fs = require('fs');
const uuid = require('uuid/v4')
const fetch = require('node-fetch');


const dimensions = {
  CD_BREAKPOINT: 'cd1',
  CD_PIXEL_DENSITY: 'cd2',
  CD_SITE_VERSION: 'cd3',
  CD_HIT_META: 'cd4',
  CD_EFFECTIVE_CONNECTION_TYPE: 'cd5',
  CD_METRIC_VALUE: 'cd6',
  CD_CLIENT_ID: 'cd7',
  CD_SERVICE_WORKER_REPLAY: 'cd8',
  CD_SERVICE_WORKER_STATE: 'cd9',
  CD_CACHE_HIT: 'cd10',
  CD_WINDOW_ID: 'cd11',
  CD_VISIBILITY_STATE: 'cd12',
  CD_HIT_TYPE: 'cd13',
  CD_HIT_ID: 'cd14',
  CD_HIT_TIME: 'cd15',
  CD_TRACKING_VERSION: 'cd16',
  CD_VISIT_ID: 'cd17',
  CD_NAVIGATION_TYPE: 'cd18',
};

const metrics = {
  CM_FCP: 'cm1',
  CM_FCP_SAMPLE: 'cm2',
  CM_NT_SAMPLE: 'cm3',
  CM_DOM_LOAD_TIME: 'cm4',
  CM_WINDOW_LOAD_TIME: 'cm5',
  CM_REQUEST_START_TIME: 'cm6',
  CM_RESPONSE_END_TIME: 'cm7',
  CM_RESPONSE_START_TIME: 'cm8',
  CM_WORKER_START_TIME: 'cm9',
  CM_FID: 'cm10',
  CM_FID_SAMPLE: 'cm11',
  CM_LCP: 'cm12',
  CM_LCP_SAMPLE: 'cm13',
  CM_CLS: 'cm14',
  CM_CLS_SAMPLE: 'cm15',
};

async function log(request, response) {
  const params = new URLSearchParams(request.body);

  // Set data not specific to the client
  params.set('v', '1');
  params.set('tid', 'UA-21292978-1');

  // Set a unique ID for every hit
  params.set(dimensions.CD_HIT_ID, uuid());

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
  params.set(dimensions.CD_HIT_TYPE, params.get('t'));

  // Ensure a custom dimension shadows the client ID
  params.set(dimensions.CD_CLIENT_ID, params.get('cid'));

  // Ensure all custom dimensions have a value
  for (const value of Object.values(dimensions)) {
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

module.exports = {
  log,
  dimensions,
  metrics,
};
