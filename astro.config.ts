import {defineConfig} from 'astro/config';
import mdx from '@astrojs/mdx';
import {transformerMetaWordHighlight} from '@shikijs/transformers';
import {transformerMetaRangeHighlight} from './src/plugins/transformerMetaRangeHighlight.ts';

export default defineConfig({
  site: 'https://philipwalton.com',
  integrations: [mdx()],
  output: 'static',
  image: {
    layout: 'full-width',
  },
  markdown: {
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
