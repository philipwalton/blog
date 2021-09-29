export const streamErrorPlugin = {
  async handlerDidError({error, event, request}) {
    if (event.type === 'fetch') {
      // Always return a response if an error happens so that the request can
      // complete. Otherwise the user will see an incomplete response will
      // will look very broken.
      return new Response([
        `<h3>Error:</h3>`,
        `<p>There was an error requesting URL: <em>${request.url}</em>.</p>`,
        `<p>Ensure you're still connected to the internet and not using any `,
        `plugins (e.g. adblock, ublock) that might block this request.</p>`,
        `<pre>${error.stack || error.toString()}</pre>`,
      ].join(''), {status: 404});
    }
  }
}
