const getCapabilities = () => {
  // https://wiki.saucelabs.com/display/DOCS/Platform+Configurator#/
  let capabilities;
  if (!(process.env.SAUCE_USERNAME && process.env.SAUCE_ACCESS_KEY)) {
    capabilities = [
      {browserName: 'chrome'},
      // {browserName: 'firefox'},
      // {browserName: 'safari'},
    ];
  } else {
    capabilities = [
      // {
      //   browserName: 'chrome',
      //   platform: 'Windows 10',
      //   version: 'latest',
      // },
      // TODO(philipwalton): other browsers have been too flaky to run on
      // every push. Uncomment and test manually before making releases, but
      // for now there's too much failure noise to run on these browsers.
      // {
      //   browserName: 'firefox',
      //   platform: 'OS X 10.11',
      //   version: 'latest',
      // },
      // {
      //   browserName: 'safari',
      //   platform: 'macOS 10.13',
      //   version: '11.1',
      // },
      // {
      //   browserName: 'safari',
      //   platform: 'OS X 10.11',
      //   version: '9',
      // },
      // {
      //   browserName: 'internet explorer',
      //   platform: 'Windows 8.1',
      //   version: '11',
      // },
      // TODO(philipwalton) Edge webdriver does not fully support enough of the
      // webdriver features to rely on. Wait for full support and then re-add:
      // https://dev.windows.com/en-us/microsoft-edge/platform/status/webdriver/details/
      // {
      //   browserName: 'MicrosoftEdge',
      //   platform: 'Windows 10'
      // },
    ];

    capabilities.forEach(function(cap) {
      cap['name'] = 'philipwalton.com tests - ' + cap.browserName +
                    ' - ' + (cap.version || 'latest');

      cap['build'] = process.env.TRAVIS_BUILD_NUMBER;
    });
  }

  return capabilities;
};

exports.config = {
  specs: [
    './test/*.js',
  ],
  maxInstances: 1,
  capabilities: getCapabilities(),
  sync: true,
  logLevel: 'error', // silent | verbose | command | data | result | error
  coloredLogs: true,
  baseUrl: process.env.BASE_URL || 'http://localhost:5000',
  waitforTimeout: 5000,
  connectionRetryTimeout: 3e4,
  connectionRetryCount: 3,
  services: ['sauce'],
  user: process.env.SAUCE_USERNAME,
  key: process.env.SAUCE_ACCESS_KEY,
  framework: 'mocha',
  mochaOpts: {
    ui: 'bdd',
    timeout: 120000, // The test that loads every page can take a while....
  },
};
