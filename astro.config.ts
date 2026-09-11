import {defineConfig} from 'astro/config';
import {cloudflare} from '@cloudflare/vite-plugin';
import {unified} from '@astrojs/markdown-remark';
import mdx from '@astrojs/mdx';
import remarkGfmAlerts from 'remark-github-blockquote-alert';
import remarkExcerpt from './src/plugins/remarkExcerpt.ts';
import {transformerMetaWordHighlight} from '@shikijs/transformers';
import {transformerMetaRangeHighlight} from './src/plugins/transformerMetaRangeHighlight.ts';
import {transformerDiffLines} from './src/plugins/transformerDiffLines.ts';

export default defineConfig({
  site: 'https://philipwalton.com',
  integrations: [mdx()],
  output: 'static',
  compressHTML: true,
  devToolbar: {
    enabled: false,
  },
  server: {
    port: 3000,
  },
  build: {
    assets: 'static',
    inlineStylesheets: 'always',
  },
  image: {
    layout: 'full-width',
    breakpoints: [800, 1200, 1600],
  },
  markdown: {
    processor: unified({remarkPlugins: [remarkGfmAlerts, remarkExcerpt]}),
    shikiConfig: {
      defaultColor: false,
      // Languages used as the second word of a `diff` fence, which Astro
      // does not load on its own.
      langs: ['jsonc'],
      themes: {
        light: 'github-light',
        dark: 'github-dark',
      },
      transformers: [
        transformerMetaRangeHighlight(),
        transformerMetaWordHighlight(),
        transformerDiffLines(),
      ],
    },
  },
  vite: {
    plugins: [
      cloudflare({
        configPath: './wrangler.toml',
        config: {vars: {ENVIRONMENT: 'dev'}},
      }),
    ],
  },
});
