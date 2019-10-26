const fetch = require('node-fetch');


async function log(request, response) {
  const params = new URLSearchParams(request.body);

  // Initially send this to the test property.
  params.set('tid', 'UA-21292978-3');

  // Set the `uip` param to the IP address of the user.
  const uip = request.ip;
  if (uip) {
    params.set('uip', request.ip);
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
