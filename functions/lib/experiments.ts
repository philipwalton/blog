const FETCH_LATER_TOKEN =
  'Ao1ryfd8fdqfiAsCIPw8u/hg/poMifRObWWqJcgoUH1kmUYLdQXZA1vMT1hqitwdlvdG7vrdVUfTAmxQ11PqywIAAABXeyJvcmlnaW4iOiJodHRwczovL3BoaWxpcHdhbHRvbi5jb206NDQzIiwiZmVhdHVyZSI6IkZldGNoTGF0ZXJBUEkiLCJleHBpcnkiOjE3NDIyNTYwMDB9';

interface Experiment {
  range: [number, number];
  init: (rewriter: HTMLRewriter) => void;
}

const experiments: Record<string, Experiment> = {
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
  element(element: Element) {
    element.before(
      `<meta http-equiv="origin-trial" content="${FETCH_LATER_TOKEN}"><script>self.__x='fetch_later'</script>`,
      {
        html: true,
      },
    );
  }
}

export function getExperiment(xid: string): string | undefined {
  const x = Number(xid);
  for (const [key, entry] of Object.entries(experiments)) {
    const [min, max] = entry.range;
    if (x >= min && x < max) {
      return key;
    }
  }
}

export function applyExperiment(
  experiment: string,
  rewriter: HTMLRewriter,
): void {
  const exp = experiments[experiment];
  if (exp) {
    exp.init(rewriter);
  }
}
