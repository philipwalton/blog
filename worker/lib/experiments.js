/* global HTMLRewriter */

const experiments = {
  pending_beacon: {
    range: [0, 0.5],
    transform: (response) => {
      return new HTMLRewriter()
        .on('head>script:first-of-type', new ExperimentScriptHandler())
        .transform(response);
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
    element.before(`<script>self.__x='pending_beacon'</script>`, {
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
