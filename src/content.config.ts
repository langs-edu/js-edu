import { glob } from 'astro/loaders';
import { defineCollection, z } from 'astro:content';

const lessons = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/lessons' }),
  schema: z.object({
    title: z.string(),
    course: z.enum(['hajimete', 'nagare', 'matomeru', 'sekkei', 'dom', 'koubou']),
    order: z.number().int().min(1),
    description: z.string(),
    /** ふしぎの種：レッスン末に置く、次レッスンへつながる問い */
    seed: z.string().optional(),
    /** 所要時間の目安（分） */
    minutes: z.number().int().default(25),
  }),
});

const yatai = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/yatai' }),
  schema: z.object({
    title: z.string(),
    /** 屋台のこぼれ話・一覧での並び順 */
    order: z.number().int(),
    description: z.string(),
    /** 関連レッスン。"hajimete/01" 形式の配列 */
    relatedLessons: z.array(z.string()).optional(),
  }),
});

export const collections = { lessons, yatai };
