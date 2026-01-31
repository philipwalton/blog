import fs from 'node:fs';
import type {Plugin} from 'vite';
import {defineConfig} from 'astro/config';
import mdx from '@astrojs/mdx';
import remarkGfmAlerts from 'remark-github-blockquote-alert';
import {transformerMetaWordHighlight} from '@shikijs/transformers';
import {transformerMetaRangeHighlight} from './src/plugins/transformerMetaRangeHighlight.ts';

export default defineConfig({
  site: 'https://philipwalton.com',
  integrations: [mdx()],
  output: 'static',
  image: {
    layout: 'full-width',
    breakpoints: [800, 1200, 1600],
  },
  markdown: {
    remarkPlugins: [remarkGfmAlerts],
    shikiConfig: {
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
});
