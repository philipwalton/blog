import {cloudflareTest} from '@cloudflare/vitest-pool-workers';
import {webdriverio} from '@vitest/browser-webdriverio';
import {defineConfig} from 'vitest/config';
import {stripContentLengthHeader} from './test/utils/strip-content-length.js';

export default defineConfig({
  test: {
    projects: [
      // Unit tests for the build plugins and other build-time helpers, run
      // in Node since that's where they run at build time.
      {
        test: {
          name: 'node',
          include: ['src/plugins/**/*.test.ts', 'src/utils/**/*.test.ts'],
        },
      },
      // Unit tests for the Cloudflare worker modules, run inside workerd
      // so `HTMLRewriter` and KV bindings are the real implementations.
      {
        plugins: [
          cloudflareTest({
            wrangler: {configPath: './wrangler.toml'},
          }),
        ],
        test: {
          name: 'worker',
          include: ['src/worker/**/*.test.ts'],
        },
      },
      // Unit tests for the client-side modules, run in headless Chrome so
      // browser APIs (IndexedDB, matchMedia, popovers) are the real
      // implementations.
      {
        test: {
          name: 'browser',
          include: ['src/javascript/**/*.test.ts'],
          browser: {
            enabled: true,
            // transformRequest works around a webdriverio bug on Node >= 26
            // (see test/utils/strip-content-length.js).
            provider: webdriverio({transformRequest: stripContentLengthHeader}),
            headless: true,
            screenshotFailures: false,
            // Parallel test files run in iframes sharing the page's origin,
            // and therefore its IndexedDB, which the kv-store and Logger
            // tests need exclusive access to.
            fileParallelism: false,
            instances: [{browser: 'chrome'}],
          },
        },
      },
      // Integration tests that require the production build to be served
      // on localhost:3000 (i.e. via `npm test`, not `npm run test:unit`).
      {
        test: {
          name: 'integration',
          include: ['test/integration/**/*'],
        },
      },
    ],
  },
});
