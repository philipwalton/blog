import {describe, expect, it} from 'vitest';
import {applyExperiment, getExperiment} from './experiments.ts';

describe('getExperiment', () => {
  it('assigns no experiment to any group while the registry is empty', () => {
    for (const xid of ['.0000', '.2500', '.4999', '.5000', '.9999']) {
      expect(getExperiment(xid)).toBeUndefined();
    }
  });
});

describe('applyExperiment', () => {
  it('leaves the response unchanged for retired or unknown experiments', async () => {
    for (const experiment of ['fetch_later', 'does_not_exist']) {
      const rewriter = new HTMLRewriter();
      applyExperiment(experiment, rewriter);

      const html = '<html><head><script></script></head><body></body></html>';
      expect(await rewriter.transform(new Response(html)).text()).toBe(html);
    }
  });
});
