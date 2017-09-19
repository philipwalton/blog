const sauceConnectLauncher = require('sauce-connect-launcher');


const launch = () => {
  const opts = {
    username: process.env.SAUCE_USERNAME,
    accessKey: process.env.SAUCE_ACCESS_KEY,
    verbose: true,
    verboseDebugging: true,
  };
  sauceConnectLauncher(opts, (err, sauceConnectProcess) => {
    if (err) {
      throw err;
    } else {
      process.env.BASE_URL = 'http://localhost:5000';

      // TODO(philipwalton): re-add the logic to close the tunnel once this is
      // fixed: https://github.com/bermi/sauce-connect-launcher/issues/116
    }
  });

}


module.exports = {launch};

module.exports.launch();
