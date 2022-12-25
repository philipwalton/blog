const PENDING_BEACON_TOKEN =
  // eslint-disable-next-line max-len
  'As/j5gJ50BNvCX2nrZLywnV5VGVEUWwbM5er761RvSNXVPg6VmPy7xufiqm5fRyzcVtuJr4fQwbrs7jDrDyewgAAAABaeyJvcmlnaW4iOiJodHRwczovL3BoaWxpcHdhbHRvbi5jb206NDQzIiwiZmVhdHVyZSI6IlBlbmRpbmdCZWFjb25BUEkiLCJleHBpcnkiOjE2NzgyMzM1OTl9';

const experiments = {
  pending_beacon: {
    range: [0, 0.5],
    init: (rewriter) => {
      rewriter.on('head>script:first-of-type', new ExperimentScriptHandler());
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
    element.before(
      // eslint-disable-next-line max-len
      `<meta http-equiv="origin-trial" content="${PENDING_BEACON_TOKEN}"><script>self.__x='pending_beacon'</script>`,
      {
        html: true,
      }
    );
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
 * @param {HTMLRewriter} rewriter
 * @returns {HTMLRewriter}
 */
export function applyExperiment(experiment, rewriter) {
  return experiments[experiment].init(rewriter);
}
