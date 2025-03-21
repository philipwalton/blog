function copyUserHeaders(oldHeaders) {
  const newHeaders = new Headers();
  for (const [key, value] of oldHeaders.entries()) {
    if (key === 'user-agent' || key.startsWith('sec-ch-ua')) {
      newHeaders.set(key, value);
    }
  }
  return newHeaders;
}

/**
 * @param {Request} request
 */
async function forwardRequest({request, env}) {
  const GA4_MEASUREMENT_ID = 'G-0DN98LQF0S';
  const LOG_ENDPOINT = env.CF_PAGES
    ? 'https://www.google-analytics.com/g/collect'
    : 'http://localhost:3001/log';

  const body = await request.text();
  const [paramsLine, ...eventsLines] = body.trim().split(/\s*\n\s*/);

  const queryParams = new URLSearchParams(
    [`v=2`, `tid=${GA4_MEASUREMENT_ID}`, paramsLine].join('&'),
  );

  const ua = request.headers.get('user-agent');
  const uach = request.headers.get('sec-ch-ua');

  const eventsParams = eventsLines.map((e) => {
    const params = new URLSearchParams(e);
    if (
      params.get('en') === 'page_view' &&
      Number(params.get('epn.measurement_version')) >= 99
    ) {
      if (ua) {
        params.set('ep.user_agent_1', ua.slice(0, 100));
        params.set('ep.user_agent_2', ua.slice(100));
      } else {
        params.set('ep.user_agent_1', '(empty)');
      }
      params.set('ep.ua_ch', uach || '(empty)');
    }
    return params;
  });

  const ip = request.headers.get('x-real-ip');

  // Set the `_uip` param to the IP address of the user, if available.
  if (ip) {
    queryParams.set('_uip', ip);
  }

  // If the query params contain _ss or _fv, and it also contains multiple
  // events where one of those events is a page_view event, split it out into
  // two separate requests, so the `page_view` event gets sent first
  // along with the _ss and _fv params.
  const newSessionPageviewEvent =
    (queryParams.has('_ss') || queryParams.has('_fv')) &&
    eventsParams.length > 1 &&
    eventsParams.find((e) => e.get('en') === 'page_view');

  const newSessionParams =
    newSessionPageviewEvent &&
    new URLSearchParams(`${queryParams}&${newSessionPageviewEvent}`);

  if (newSessionPageviewEvent) {
    queryParams.delete('_fv');
    queryParams.delete('_ss');
    eventsParams.splice(eventsParams.indexOf(newSessionPageviewEvent), 1);
  }

  const ga4SessionURL =
    newSessionParams && `${LOG_ENDPOINT}?${newSessionParams}`;

  const ga4URL = `${LOG_ENDPOINT}?${queryParams}`;
  const ga4Body = eventsParams.map(String).join('\n');
  const headers = copyUserHeaders(request.headers);

  /**
   * @param {string} url
   * @param {string} body
   */
  const beacon = (url, body) => {
    return fetch(url, {
      method: 'POST',
      headers,
      body,
    });
  };

  const requests = [];
  if (ga4SessionURL) {
    requests.push(beacon(ga4SessionURL));
  }
  requests.push(beacon(ga4URL, ga4Body));

  await Promise.all(requests);
  return new Response();
}

export async function onRequestPost(context) {
  const url = new URL(context.request.url);

  // return processLog(url, request, env);
  // Only process logs with the proper version specified.
  if (url.searchParams.get('v') === '3') {
    await forwardRequest(context);
  }

  return new Response(); // Empty 200.
}

export async function onRequestGet({request, env}) {
  return env.ASSETS.fetch(request);
}
