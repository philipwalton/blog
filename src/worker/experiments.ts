interface Experiment {
  range: [number, number];
  init: (rewriter: HTMLRewriter) => void;
}

const experiments: Record<string, Experiment> = {
  // No active experiments. To add one, copy this example and choose a unique
  // name and non-overlapping range (inclusive start, exclusive end). The worker
  // persists each visitor's xid cookie; values outside all ranges are controls.
  //
  // example: {
  //   range: [0, 0.5],
  //   init: (rewriter) => {
  //     rewriter.on('head>script:first-of-type', {
  //       element(element) {
  //         element.before("<script>self.__x='example'</script>", {html: true});
  //       },
  //     });
  //   },
  // },
  //
  // Logger reports self.__x as up.experiment. Gate experimental client behavior
  // on that value, or add HTML rewrites in init(). Update experiments.test.ts,
  // test/integration/worker.ts, and test/e2e/log.ts to cover both groups and
  // persistence across reloads (setExperimentCookie selects a group in e2e).
};

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
