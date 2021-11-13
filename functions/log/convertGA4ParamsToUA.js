import {v4 as uuid} from 'uuid';
import {dimensions, metrics, UA_MEASUREMENT_ID} from '../constants.js';

/**
 * @param {string} string
 * @return {number}
 */
function round(string) {
  return Math.round(Number(string));
}

/**
 * @param {Object} params
 */
export function convertGA4ParamsToUA(params) {
  // Set data not specific to the client
  params.set('v', '1');
  params.set('tid', UA_MEASUREMENT_ID);

  // Delete private v2 params.
  params.delete('_p');
  params.delete('_s');
  params.delete('_ss');
  params.delete('_fv');

  // Set the event name (or convert to a pageview).
  const en = params.get('en');
  if (en === 'page_view') {
    params.set('t', 'pageview');
  } else {
    params.set('t', 'event');
    params.set('ea', en.replace('-', '_'));
  }
  params.delete('en');

  // Set the page path
  const pagePath = params.get('ep.page_path');
  if (pagePath) {
    params.set('dp', pagePath);
    params.delete('ep.page_path');
  }

  // Set a unique ID for every hit
  params.set(dimensions.CD_HIT_ID, uuid());

  // Set the `uip` param to the IP address of the user.
  const _uip = params.get('_uip');
  if (_uip) {
    params.delete('_uip');
    params.set('uip', _uip);
  }

  // Convert `ht` (hit time) to `qt` (queue time).
  const ht = params.get('ht');
  if (ht) {
    params.delete('ht');
    params.set('qt', Date.now() - Number(ht));
    params.set(dimensions.CD_HIT_TIME, ht);
  }

  const swReplay = params.get('ep.sw_replay');
  if (swReplay) {
    params.set(dimensions.CD_SERVICE_WORKER_REPLAY, swReplay);
    params.delete('ep.sw_replay');
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

  // Convert user params to their equivalent custom dimensions.
  const experiment = params.get('up.experiment');
  params.set(dimensions.CD_EXPERIMENT, experiment || '(not set)');

  const breakpoint = params.get('up.breakpoint');
  params.set(dimensions.CD_BREAKPOINT, breakpoint);

  const pixelDensity = params.get('up.pixel_density');
  params.set(dimensions.CD_PIXEL_DENSITY, pixelDensity);

  const ect = params.get('up.effective_connection_type');
  params.set(dimensions.CD_EFFECTIVE_CONNECTION_TYPE, ect);

  const swState = params.get('up.service_worker_state');
  params.set(dimensions.CD_SERVICE_WORKER_STATE, swState);

  const contentSource = params.get('ep.content_source');
  params.set(dimensions.CD_HIT_META, contentSource);

  const measurementVersion = params.get('epn.measurement_version');
  params.set(dimensions.CD_TRACKING_VERSION, measurementVersion);

  const navigationType = params.get('ep.navigation_type');
  params.set(dimensions.CD_NAVIGATION_TYPE, navigationType || '(not set)');

  const windowId = params.get('ep.page_id');
  params.set(dimensions.CD_WINDOW_ID, windowId);

  const visitId = windowId + '-' + params.get('epn.pageshow_count');
  params.set(dimensions.CD_VISIT_ID, visitId);

  const siteVersion = params.get('ep.site_version');
  params.set(dimensions.CD_SITE_VERSION, siteVersion);

  const visibilityState = params.get('ep.visibility_state');
  params.set(dimensions.CD_VISIBILITY_STATE, visibilityState || '(not set)');

  // Ensure event values are set and always integers.
  let value = params.get('epn.value');
  if (value) {
    // For CLS, multiply by 1000.
    if (en === 'CLS') {
      value = value * 1000;
    }
    params.set('ev', round(value));
  }

  // Convert event params to their equivalent custom dimensions/metrics.
  switch (en) {
    case 'LCP':
    case 'FID':
    case 'CLS':
    case 'FCP':
    case 'TTFB': {
      params.set('ec', 'Web Vitals');
      params.set('ni', '1');

      const rating = params.get('ep.metric_rating');
      params.set('el', rating);

      const originalPagePath = params.get('ep.original_page_path');
      params.set('dp', originalPagePath);

      const debugTarget = params.get('ep.debug_target');
      if (debugTarget) {
        params.set(dimensions.CD_HIT_META, debugTarget);

        const debugEvent = params.get('ep.debug_event');
        if (debugEvent) {
          params.set(dimensions.CD_HIT_META, `${debugEvent}(${debugTarget})`);
        }
      }

      if (en === 'TTFB') {
        const requestStart = params.get('epn.request_start');
        params.set(metrics.CM_REQUEST_START_TIME, round(requestStart));

        const responseStart = params.get('epn.response_start');
        params.set(metrics.CM_RESPONSE_START_TIME, round(responseStart));

        const responseEnd = params.get('epn.response_end');
        params.set(metrics.CM_RESPONSE_END_TIME, round(responseEnd));

        const domLoadEnd = params.get('epn.dom_load_end');
        params.set(metrics.CM_DOM_LOAD_TIME, round(domLoadEnd));

        const windowLoadEnd = params.get('epn.window_load_end');
        params.set(metrics.CM_WINDOW_LOAD_TIME, round(windowLoadEnd));

        const workerStart = params.get('epn.worker_start');
        if (workerStart) {
          params.set(metrics.CM_WORKER_START_TIME, round(workerStart));
        }
      }
      break;
    }
    case 'error': {
      params.set('ec', 'Error');
      params.set('ni', '1');

      const name = params.get('ep.error_name');
      params.set('ea', name);

      const message = params.get('ep.error_message');
      params.set('el', message);
      break;
    }
    case 'sw_update': {
      params.set('ec', 'Service Worker');
      params.set('ni', '1');

      const oldVersion = params.get('en.old_version');
      const newVersion = params.get('en.new_version');
      if (newVersion) {
        params.set('el', `${oldVersion || '(not set)'} => ${newVersion}`);
      }
      break;
    }
    case 'sw_update_reload':
    case 'sw_update_dismiss':
    case 'sw_update_notify': {
      params.set('ec', 'Messages');
      params.set('ni', '1');
      break;
    }
  }

  // Delete any leftover event or user params.
  // Make sure to copy the iterable first since we're deleting keys.
  for (const param of [...params.keys()]) {
    if (param.match(/^[eu]pn?\.(\w)+$/)) {
      params.delete(param);
    }
  }
}
