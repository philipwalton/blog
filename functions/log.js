const {log: v1} = require('./v1/log');
const {log: v2} = require('./v2/log');

/**
 * @param {Object} request
 * @param {Object} response
 */
async function log(request, response) {
  const version = Number(request.query.v);
  switch (version) {
    case 2:
      await v2(request);
      break;
    default:
      await v1(request);
      break;
  }
  response.end();
}

module.exports = {
  log,
};
