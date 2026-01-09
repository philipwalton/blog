import {storePriorityHints} from './lib/performance.js';

interface Env extends Cloudflare.Env {
  ASSETS: Fetcher;
}

export async function onRequestPost({
  request,
  env,
}: EventContext<Env, string, unknown>): Promise<Response> {
  await storePriorityHints(request, env.PRIORITY_HINTS);
  return new Response(); // Empty 200.
}

export async function onRequestGet({
  request,
  env,
}: EventContext<Env, string, unknown>): Promise<Response> {
  return env.ASSETS.fetch(request);
}
