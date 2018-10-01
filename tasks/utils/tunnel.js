const sauceConnectLauncher = require('sauce-connect-launcher');

let tunnel;

const start = ({verbose = true} = {}) => {
  const opts = {
    username: process.env.SAUCE_USERNAME,
    accessKey: process.env.SAUCE_ACCESS_KEY,
    verbose: verbose,
    verboseDebugging: verbose,
  };

  return new Promise((resolve, reject) => {
    sauceConnectLauncher(opts, (err, sauceConnectProcess) => {
      if (err) {
        reject(err);
      } else {
        tunnel = sauceConnectProcess;
        // TODO(philipwalton): re-add this logic to close the tunnel once this
        // is fixed: https://github.com/bermi/sauce-connect-launcher/issues/116
        // process.on('exit', sshTunnel.close.bind(sshTunnel));
        resolve();
      }
    });
  });
};

const stop = () => {
  if (tunnel.close) {
    tunnel.close();
  }
  tunnel = null;
};

module.exports = {start, stop};
