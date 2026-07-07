import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  site: 'https://mntr.dk',
  // The post-build pipeline (hyperlink, subfont, netlify-headers) operates on
  // `build/` and copies the final result to `dist/`, which Netlify publishes.
  outDir: 'build',
  trailingSlash: 'always'
});
