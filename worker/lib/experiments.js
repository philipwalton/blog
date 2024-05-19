const FETCH_LATER_TOKEN =
  // eslint-disable-next-line max-len
  'AiFbmKao6wuKvoETvcxO14nv9Ksg8/r1rB7W5e2psy13ZKFHas0yWJXVW0ymUZAfVTI7A40ulLPGF2K9IM9EzQMAAABXeyJvcmlnaW4iOiJodHRwczovL3BoaWxpcHdhbHRvbi5jb206NDQzIiwiZmVhdHVyZSI6IkZldGNoTGF0ZXJBUEkiLCJleHBpcnkiOjE3MjU0MDc5OTl9';

const experiments = {
  fetch_later: {
    range: [0, 0.5],
    init: (rewriter) => {
      rewriter.on('head>script:first-of-type', new ExperimentScriptHandler());
    },
  },
};

/**
 * Responsible for adding a script tag to the page that sets the
 * `fetch_later` experiment as a global variable.
 */
class ExperimentScriptHandler {
  /**
   * @param {Object} element
   */
  element(element) {
    element.before(
      // eslint-disable-next-line max-len
      `<meta http-equiv="origin-trial" content="${FETCH_LATER_TOKEN}"><script>self.__x='fetch_later'</script>`,
      {
        html: true,
      },
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
