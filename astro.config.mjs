import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import vercel from '@astrojs/vercel';
import decapCmsOauth from 'astro-decap-cms-oauth';

export default defineConfig({
  adapter: vercel({ mode: 'serverless' }),
  integrations: [
    mdx(),
    decapCmsOauth({
      adminDisabled: true,
    }),
  ],
  output: 'server',
});
