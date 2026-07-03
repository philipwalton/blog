import {defineConfig} from 'astro/config';
import {cloudflare} from '@cloudflare/vite-plugin';
import mdx from '@astrojs/mdx';
import remarkGfmAlerts from 'remark-github-blockquote-alert';
import remarkExcerpt from './src/plugins/remarkExcerpt.ts';
import {transformerMetaWordHighlight} from '@shikijs/transformers';
import {transformerMetaRangeHighlight} from './src/plugins/transformerMetaRangeHighlight.ts';

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
    plugins: [
      // The repo has two Vite majors installed (Astro bundles v6, vitest
      // pulls in v7), so @cloudflare/vite-plugin's types don't structurally
      // match Astro's `PluginOption` type even though they're compatible
      // at runtime.
      // TODO: remove this cast once Astro is upgraded to v7 (aligns on Vite 7).
      cloudflare({
        configPath: './wrangler.toml',
        config: {vars: {ENVIRONMENT: 'dev'}},
      }) as any,
    ],
  },
});
