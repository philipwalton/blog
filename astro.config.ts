import {defineConfig} from 'astro/config';
import mdx from '@astrojs/mdx';

export default defineConfig({
  site: 'https://philipwalton.com',
  integrations: [mdx()],
  // Output static HTML by default
  output: 'static',
});
