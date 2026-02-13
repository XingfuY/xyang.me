#!/usr/bin/env node
/**
 * Build content manifest from content/ directory.
 * Scans content/posts/*.md for YAML frontmatter and content/projects/*.yaml for project manifests.
 * Copies post bodies (stripped frontmatter) to public/content/posts/ for runtime fetching.
 * Copies project markdown to public/content/projects/ for runtime fetching.
 * Outputs src/generated/content-manifest.json.
 */

import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync, rmSync } from 'fs';
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
const PUBLIC_POSTS_DIR = join(ROOT, 'public', 'content', 'posts');
const PUBLIC_PROJECTS_DIR = join(ROOT, 'public', 'content', 'projects');

function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return { metadata: {}, body: content };

  const frontmatter = match[1];
  const body = content.slice(match[0].length).trim();
  const metadata = parseYamlSimple(frontmatter);

  return { metadata, body };
}

function parseYamlSimple(text) {
  const metadata = {};
  for (const line of text.split('\n')) {
    const colonIndex = line.indexOf(':');
    if (colonIndex === -1) continue;
    const key = line.slice(0, colonIndex).trim();
    let value = line.slice(colonIndex + 1).trim();

    if (value.startsWith('[') && value.endsWith(']')) {
      value = value.slice(1, -1).split(',').map(s => s.trim().replace(/^["']|["']$/g, ''));
    } else if (value === 'true') {
      value = true;
    } else if (value === 'false') {
      value = false;
    } else if (/^\d+$/.test(value)) {
      value = parseInt(value, 10);
    } else {
      value = value.replace(/^["']|["']$/g, '');
    }

    metadata[key] = value;
  }
  return metadata;
}

function scanPosts() {
  if (!existsSync(POSTS_DIR)) return [];

  const files = readdirSync(POSTS_DIR).filter(f => f.endsWith('.md'));
  return files.map(file => {
    const content = readFileSync(join(POSTS_DIR, file), 'utf-8');
    const { metadata, body } = parseFrontmatter(content);
    return {
      slug: basename(file, '.md'),
      file: `content/posts/${file}`,
      body,
      ...metadata,
    };
  }).filter(p => !p.draft);
}

function scanProjects() {
  if (!existsSync(PROJECTS_DIR)) return [];

  const yamlFiles = readdirSync(PROJECTS_DIR).filter(f => f.endsWith('.yaml') || f.endsWith('.yml'));
  return yamlFiles.map(file => {
    const content = readFileSync(join(PROJECTS_DIR, file), 'utf-8');
    const metadata = parseYamlSimple(content);
    const slug = basename(file, '.yaml').replace('.yml', '');

    // Check for companion markdown file
    const mdFile = join(PROJECTS_DIR, `${slug}.md`);
    const hasContent = existsSync(mdFile);

    return {
      slug,
      file: `content/projects/${file}`,
      hasContent,
      ...metadata,
    };
  });
}

function copyPostsToPublic(posts) {
  // Clean and recreate
  if (existsSync(PUBLIC_POSTS_DIR)) rmSync(PUBLIC_POSTS_DIR, { recursive: true });
  mkdirSync(PUBLIC_POSTS_DIR, { recursive: true });

  for (const post of posts) {
    writeFileSync(join(PUBLIC_POSTS_DIR, `${post.slug}.md`), post.body);
  }
}

function copyProjectsToPublic(projects) {
  // Clean and recreate
  if (existsSync(PUBLIC_PROJECTS_DIR)) rmSync(PUBLIC_PROJECTS_DIR, { recursive: true });
  mkdirSync(PUBLIC_PROJECTS_DIR, { recursive: true });

  for (const project of projects) {
    if (project.hasContent) {
      const mdFile = join(PROJECTS_DIR, `${project.slug}.md`);
      const content = readFileSync(mdFile, 'utf-8');
      writeFileSync(join(PUBLIC_PROJECTS_DIR, `${project.slug}.md`), content);
    }
  }
}

// Build manifest
const posts = scanPosts();
const projects = scanProjects();

// Copy content to public/ for runtime fetching
copyPostsToPublic(posts);
copyProjectsToPublic(projects);

// Strip body from manifest (not needed in JSON — content is fetched at runtime)
const manifestPosts = posts.map(({ body, ...rest }) => rest);
const manifestProjects = projects.map(p => p);

const manifest = {
  posts: manifestPosts.sort((a, b) => (b.date || '').localeCompare(a.date || '')),
  projects: manifestProjects.sort((a, b) => (a.order || 999) - (b.order || 999)),
  generatedAt: new Date().toISOString(),
};

mkdirSync(OUTPUT_DIR, { recursive: true });
writeFileSync(OUTPUT_FILE, JSON.stringify(manifest, null, 2));

console.log(`Content manifest built:`);
console.log(`  Posts: ${posts.length}`);
console.log(`  Projects: ${projects.length}`);
console.log(`  Output: ${OUTPUT_FILE}`);
console.log(`  Public posts: ${PUBLIC_POSTS_DIR}`);
console.log(`  Public projects: ${PUBLIC_PROJECTS_DIR}`);
