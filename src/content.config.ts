import {defineCollection} from 'astro:content';
import {glob} from 'astro/loaders';
import {z} from 'astro/zod';

const articles = defineCollection({
  loader: glob({pattern: '**/*.mdx', base: './src/content/articles'}),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    excerpt: z.string().optional(),
    image: z.string().optional(),
    translations: z.record(z.string(), z.string()).optional(),
  }),
});

export const collections = {
  articles,
};
