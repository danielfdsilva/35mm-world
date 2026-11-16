import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'url';
import * as path from 'path';

import pkg from './package.json';

const alias = Object.entries(pkg.alias).reduce((acc, [key, value]) => {
  // Resolve the alias path relative to the current file
  const basePath = path.dirname(fileURLToPath(import.meta.url));
  return {
    ...acc,
    [key]: path.resolve(basePath, value.replace('~/', './'))
  };
}, {});

// robots.txt and sitemap.xml need the full site URL, so they are built from
// VITE_BASE_URL instead of living in public/.
const seoFiles = (baseUrl: string): Plugin => ({
  name: 'seo-files',
  apply: 'build',
  generateBundle() {
    if (!baseUrl) {
      this.warn('VITE_BASE_URL is empty: no sitemap.xml, share links break.');
    }
    this.emitFile({
      type: 'asset',
      fileName: 'robots.txt',
      source: `User-agent: *\nAllow: /\n${baseUrl ? `\nSitemap: ${baseUrl}/sitemap.xml\n` : ''}`
    });
    if (!baseUrl) return;
    this.emitFile({
      type: 'asset',
      fileName: 'sitemap.xml',
      source: `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${baseUrl}/</loc></url>
</urlset>
`
    });
  }
});

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => {
  const baseUrl = loadEnv(mode, process.cwd()).VITE_BASE_URL ?? '';
  return {
    // Full URL so built module and asset URLs are absolute.
    base: command === 'build' && baseUrl ? `${baseUrl}/` : '/',
    plugins: [react(), seoFiles(baseUrl)],
    server: {
      port: 9000
    },
    resolve: {
      alias
    }
  };
});
