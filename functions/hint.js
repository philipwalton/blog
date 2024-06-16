import {storePriorityHints} from './lib/performance.js';

export async function onRequestPost({request, env}) {
  await storePriorityHints(request, env.PRIORITY_HINTS);
  return new Response(); // Empty 200.
}

export async function onRequestGet({request, env}) {
  return env.ASSETS.fetch(request);
}
