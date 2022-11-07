/* global HTMLRewriter */

// eslint-disable-next-line max-len
const PENDING_BEACON_TOKEN = 'As/j5gJ50BNvCX2nrZLywnV5VGVEUWwbM5er761RvSNXVPg6VmPy7xufiqm5fRyzcVtuJr4fQwbrs7jDrDyewgAAAABaeyJvcmlnaW4iOiJodHRwczovL3BoaWxpcHdhbHRvbi5jb206NDQzIiwiZmVhdHVyZSI6IlBlbmRpbmdCZWFjb25BUEkiLCJleHBpcnkiOjE2NzgyMzM1OTl9';

const experiments = {
  pending_beacon: {
    range: [0, 0.5],
    transform: (res) => {
      return new HTMLRewriter()
        .on('head>script:first-of-type', new ExperimentScriptHandler())
        .transform(res);
    },
  },
};

/**
 * Responsible for adding a script tag to the page that sets the
 * `pending_beacon` experiment as a global variable.
 */
class ExperimentScriptHandler {
  /**
   * @param {Object} element
   */
  element(element) {
    // eslint-disable-next-line max-len
    element.before(`<meta http-equiv="origin-trial" content="${PENDING_BEACON_TOKEN}"><script>self.__x='pending_beacon'</script>`, {
      html: true,
    });
  }
}

/**
 * @param {string} xid
 * @returns {string}
 */
export function getExperiment(xid) {
  for (const [key, entry] of Object.entries(experiments)) {
    const [min, max] = entry.range;
    if (xid >= min && xid < max) {
      return key;
    }
  }
}

/**
 *
 * @param {string} experiment
 * @param {Response} response
 * @returns {Response}
 */
export function applyExperiment(experiment, response) {
  return experiments[experiment].transform(response);
}
