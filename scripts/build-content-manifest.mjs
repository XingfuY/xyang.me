#!/usr/bin/env node
/**
 * Build content manifest from content/ directory.
 * Scans content/posts/*.md for YAML frontmatter and content/projects/*.yaml for project manifests.
 * Outputs src/generated/content-manifest.json.
 */

import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from 'fs';
import { resolve, join, basename } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, '..');

const POSTS_DIR = join(ROOT, 'content', 'posts');
const PROJECTS_DIR = join(ROOT, 'content', 'projects');
const OUTPUT_DIR = join(ROOT, 'src', 'generated');
const OUTPUT_FILE = join(OUTPUT_DIR, 'content-manifest.json');

function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return { metadata: {}, body: content };

  const frontmatter = match[1];
  const body = content.slice(match[0].length).trim();
  const metadata = {};

  for (const line of frontmatter.split('\n')) {
    const colonIndex = line.indexOf(':');
    if (colonIndex === -1) continue;
    const key = line.slice(0, colonIndex).trim();
    let value = line.slice(colonIndex + 1).trim();

    // Handle arrays (simple YAML inline: [a, b, c])
    if (value.startsWith('[') && value.endsWith(']')) {
      value = value.slice(1, -1).split(',').map(s => s.trim().replace(/^["']|["']$/g, ''));
    } else if (value === 'true') {
      value = true;
    } else if (value === 'false') {
      value = false;
    } else {
      value = value.replace(/^["']|["']$/g, '');
    }

    metadata[key] = value;
  }

  return { metadata, body };
}

function scanPosts() {
  if (!existsSync(POSTS_DIR)) return [];

  const files = readdirSync(POSTS_DIR).filter(f => f.endsWith('.md'));
  return files.map(file => {
    const content = readFileSync(join(POSTS_DIR, file), 'utf-8');
    const { metadata } = parseFrontmatter(content);
    return {
      slug: basename(file, '.md'),
      file: `content/posts/${file}`,
      ...metadata,
    };
  }).filter(p => !p.draft);
}

function scanProjects() {
  if (!existsSync(PROJECTS_DIR)) return [];

  const files = readdirSync(PROJECTS_DIR).filter(f => f.endsWith('.yaml') || f.endsWith('.yml'));
  return files.map(file => {
    const content = readFileSync(join(PROJECTS_DIR, file), 'utf-8');
    const { metadata } = parseFrontmatter(content);
    return {
      slug: basename(file, '.yaml').replace('.yml', ''),
      file: `content/projects/${file}`,
      ...metadata,
    };
  });
}

// Build manifest
const posts = scanPosts();
const projects = scanProjects();

const manifest = {
  posts: posts.sort((a, b) => (b.date || '').localeCompare(a.date || '')),
  projects: projects.sort((a, b) => (a.order || 999) - (b.order || 999)),
  generatedAt: new Date().toISOString(),
};

mkdirSync(OUTPUT_DIR, { recursive: true });
writeFileSync(OUTPUT_FILE, JSON.stringify(manifest, null, 2));

console.log(`Content manifest built:`);
console.log(`  Posts: ${posts.length}`);
console.log(`  Projects: ${projects.length}`);
console.log(`  Output: ${OUTPUT_FILE}`);
