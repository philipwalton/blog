import {defineCollection, z} from 'astro:content';

const articles = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    excerpt: z.string().optional(),
    image: z.string().optional(),
    translations: z.record(z.string()).optional(),
  }),
});

export const collections = {
  articles,
};
