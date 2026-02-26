#!/usr/bin/env node
/**
 * Post-build: copy dist/index.html into every SPA route directory
 * so GitHub Pages serves 200 (not 404) for client-side routes.
 * This fixes Googlebot indexing — bots see the 404 status from the
 * 404.html redirect hack and refuse to index the page.
 *
 * Reads dist/sitemap.xml to discover all routes automatically.
 */

import { readFileSync, copyFileSync, mkdirSync, existsSync } from 'fs';
import { resolve, join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST = resolve(__dirname, '..', 'dist');
const INDEX = join(DIST, 'index.html');
const SITEMAP = join(DIST, 'sitemap.xml');

if (!existsSync(INDEX)) {
  console.error('dist/index.html not found — run vite build first');
  process.exit(1);
}

if (!existsSync(SITEMAP)) {
  console.error('dist/sitemap.xml not found — run build:content first');
  process.exit(1);
}

// Extract paths from sitemap <loc> entries
const sitemap = readFileSync(SITEMAP, 'utf-8');
const locRegex = /<loc>https?:\/\/[^<]+<\/loc>/g;
const paths = [];
let match;
while ((match = locRegex.exec(sitemap)) !== null) {
  const url = match[0].replace(/<\/?loc>/g, '');
  const path = new URL(url).pathname.replace(/\/$/, '');
  if (path && path !== '') paths.push(path);
}

let created = 0;
for (const routePath of paths) {
  const dir = join(DIST, routePath);
  const target = join(dir, 'index.html');

  // Skip if already exists (e.g. the root /)
  if (existsSync(target)) continue;

  mkdirSync(dir, { recursive: true });
  copyFileSync(INDEX, target);
  created++;
}

console.log(`SPA routes: created ${created} index.html copies for ${paths.length} routes`);
