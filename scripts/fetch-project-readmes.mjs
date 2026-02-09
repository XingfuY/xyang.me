#!/usr/bin/env node
/**
 * Fetch README.md files from GitHub repos listed in project manifests.
 * Caches fetched content in content/projects/.cache/
 *
 * Usage: node scripts/fetch-project-readmes.mjs [--force]
 */

import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync, statSync } from 'fs';
import { resolve, join, basename } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, '..');

const PROJECTS_DIR = join(ROOT, 'content', 'projects');
const CACHE_DIR = join(PROJECTS_DIR, '.cache');
const CACHE_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

const force = process.argv.includes('--force');

function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};

  const metadata = {};
  for (const line of match[1].split('\n')) {
    const colonIndex = line.indexOf(':');
    if (colonIndex === -1) continue;
    const key = line.slice(0, colonIndex).trim();
    const value = line.slice(colonIndex + 1).trim().replace(/^["']|["']$/g, '');
    metadata[key] = value;
  }
  return metadata;
}

async function fetchReadme(repo) {
  const url = `https://raw.githubusercontent.com/${repo}/main/README.md`;
  console.log(`  Fetching: ${url}`);

  const response = await fetch(url);
  if (!response.ok) {
    // Try master branch
    const altUrl = `https://raw.githubusercontent.com/${repo}/master/README.md`;
    console.log(`  Trying master branch: ${altUrl}`);
    const altResponse = await fetch(altUrl);
    if (!altResponse.ok) {
      throw new Error(`Failed to fetch README from ${repo} (${altResponse.status})`);
    }
    return altResponse.text();
  }
  return response.text();
}

async function main() {
  if (!existsSync(PROJECTS_DIR)) {
    console.log('No projects directory found.');
    return;
  }

  mkdirSync(CACHE_DIR, { recursive: true });

  const files = readdirSync(PROJECTS_DIR).filter(f => f.endsWith('.yaml') || f.endsWith('.yml'));

  if (files.length === 0) {
    console.log('No project manifests found. Skipping fetch.');
    return;
  }

  for (const file of files) {
    const metadata = parseFrontmatter(readFileSync(join(PROJECTS_DIR, file), 'utf-8'));
    const repo = metadata.repo;

    if (!repo) {
      console.log(`  ${file}: No repo field, skipping.`);
      continue;
    }

    const cacheFile = join(CACHE_DIR, `${basename(file, '.yaml').replace('.yml', '')}-readme.md`);

    // Check cache freshness
    if (!force && existsSync(cacheFile)) {
      const stat = statSync(cacheFile);
      const age = Date.now() - stat.mtimeMs;
      if (age < CACHE_MAX_AGE_MS) {
        console.log(`  ${file}: Cached (${Math.round(age / 60000)}min old), skipping.`);
        continue;
      }
    }

    try {
      const readme = await fetchReadme(repo);
      writeFileSync(cacheFile, readme);
      console.log(`  ${file}: Fetched and cached (${(readme.length / 1024).toFixed(1)} KB)`);
    } catch (err) {
      console.error(`  ${file}: ${err.message}`);
    }
  }

  console.log('Done.');
}

main().catch(console.error);
