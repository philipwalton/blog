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
        `<pre>${error.stack || error}</pre>`,
        `<script type="module">
          if (self.__e) {
            (self.__e.q = self.__e.q || []).push({
              type: 'error',
              error: {
                name: ${JSON.stringify(error.name)},
                stack: ${JSON.stringify(error.stack)},
              }
            });
          }
          async function updateSW() {
            const reg = await navigator.serviceWorker.getRegistration();
            reg.update();
          }
          updateSW();
        </script>`
      ].join(''), {status: 404});
    }
  }
}
