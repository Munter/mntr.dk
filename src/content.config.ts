import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const posts = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/posts' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    description: z.string(),
    categories: z.string().optional(),
    twittertext: z.string().optional()
  })
});

const talks = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/talks' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    description: z.string().optional(),
    twittertext: z.string().optional(),
    slides: z.string().optional(),
    abstract: z.string().nullable().optional(),
    video: z
      .object({
        service: z.enum(['youtube', 'vimeo']).optional(),
        id: z.union([z.string(), z.number()]).optional(),
        // Thumbnail id on the Vimeo CDN. Resolved at build time via the oEmbed
        // API; set explicitly in frontmatter to override, e.g. when the video
        // has been deleted from Vimeo.
        'image-id': z.string().optional(),
        url: z.string().optional(),
        page: z.string().optional()
      })
      .optional(),
    event: z
      .object({
        name: z.string(),
        date: z.coerce.date().optional(),
        url: z.string().optional()
      })
      .optional()
  })
});

export const collections = { posts, talks };
