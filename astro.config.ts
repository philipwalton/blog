import fs from 'node:fs';
import type {IncomingMessage, ServerResponse} from 'node:http';
import {defineConfig} from 'astro/config';
import mdx from '@astrojs/mdx';
import remarkGfmAlerts from 'remark-github-blockquote-alert';
import remarkExcerpt from './src/plugins/remarkExcerpt.ts';
import {transformerMetaWordHighlight} from '@shikijs/transformers';
import {transformerMetaRangeHighlight} from './src/plugins/transformerMetaRangeHighlight.ts';

const LOG_FILE = 'beacons.log';

// TODO: replace with `import type {ViteDevServer} from 'vite'` once Astro 6 is out
interface DevServer {
  middlewares: {
    use(
      path: string,
      handler: (
        req: IncomingMessage,
        res: ServerResponse,
        next: () => void,
      ) => void,
    ): void;
  };
}

function beaconLoggerPlugin() {
  return {
    name: 'beacon-logger',
    configureServer(server: DevServer) {
      server.middlewares.use('/log', (req, res, next) => {
        if (req.method !== 'POST') {
          return next();
        }

        let body = '';
        req.on('data', (chunk: Buffer) => (body += chunk));
        req.on('end', () => {
          const contents = [
            req.url,
            [...Object.entries(req.headers)]
              .map((e) => `${e[0]}=${encodeURIComponent(String(e[1] || ''))}`)
              .join('&'),
            body,
          ].join('\n');

          fs.appendFileSync(LOG_FILE, contents + '\n--\n', 'utf-8');
          res.end();
        });
      });
    },
  };
}

export default defineConfig({
  site: 'https://philipwalton.com',
  integrations: [mdx()],
  output: 'static',
  build: {
    assets: 'static',
    inlineStylesheets: 'always',
  },
  image: {
    layout: 'full-width',
    breakpoints: [800, 1200, 1600],
  },
  markdown: {
    remarkPlugins: [remarkGfmAlerts, remarkExcerpt],
    shikiConfig: {
      defaultColor: false,
      themes: {
        light: 'github-light',
        dark: 'github-dark',
      },
      transformers: [
        transformerMetaRangeHighlight(),
        transformerMetaWordHighlight(),
      ],
    },
  },
  vite: {
    plugins: [beaconLoggerPlugin()],
    server: {
      proxy: {
        '/hint': 'http://localhost:3000',
      },
    },
  },
});
