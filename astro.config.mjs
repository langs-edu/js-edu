// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import preact from '@astrojs/preact';
import sitemap from '@astrojs/sitemap';
import expressiveCode from 'astro-expressive-code';

// GitHub Pages: https://langs-edu.github.io/js-edu/
// カスタムドメイン移行時は SITE_URL / BASE_PATH を変えるだけで済むようにしておく
export default defineConfig({
  site: process.env.SITE_URL ?? 'https://langs-edu.github.io',
  base: process.env.BASE_PATH ?? '/js-edu',
  trailingSlash: 'always',
  prefetch: true,
  integrations: [
    expressiveCode({
      themes: ['github-light', 'github-dark'],
      useDarkModeMediaQuery: false,
      themeCssSelector: (theme) => `[data-theme='${theme.type}']`,
    }),
    mdx(),
    preact(),
    sitemap(),
  ],
});
