import {describe, expect, it} from 'vitest';
import {applyExperiment, getExperiment} from './experiments.ts';

describe('getExperiment', () => {
  it('assigns xids below .5 to the fetch_later experiment', () => {
    expect(getExperiment('.0000')).toBe('fetch_later');
    expect(getExperiment('.2500')).toBe('fetch_later');
    expect(getExperiment('.4999')).toBe('fetch_later');
  });

  it('assigns xids of .5 and above to no experiment', () => {
    expect(getExperiment('.5000')).toBeUndefined();
    expect(getExperiment('.9999')).toBeUndefined();
  });
});

describe('applyExperiment', () => {
  it('injects the experiment script before the first script in <head>', async () => {
    const rewriter = new HTMLRewriter();
    applyExperiment('fetch_later', rewriter);

    const html =
      '<html><head><script src="/js/main.js"></script>' +
      '<script src="/js/other.js"></script></head><body></body></html>';
    const result = await rewriter.transform(new Response(html)).text();

    expect(result).toContain(
      `<script>self.__x='fetch_later'</script><script src="/js/main.js">`,
    );
    expect(result).toContain('<meta http-equiv="origin-trial"');
    expect(result.match(/self\.__x/g)).toHaveLength(1);
  });

  it('leaves the response unchanged for unknown experiments', async () => {
    const rewriter = new HTMLRewriter();
    applyExperiment('does_not_exist', rewriter);

    const html = '<html><head><script></script></head><body></body></html>';
    expect(await rewriter.transform(new Response(html)).text()).toBe(html);
  });
});
