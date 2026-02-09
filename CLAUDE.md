# xyang.me — Portfolio Site

## Tech Stack
- **Framework**: React 19 + TypeScript + Vite 7
- **Styling**: Tailwind CSS v4 (CSS-first config via `@theme` in `src/index.css`)
- **Routing**: React Router v7 (client-side SPA)
- **Icons**: Lucide React
- **Content**: Markdown with react-markdown, remark-gfm, remark-math, rehype-katex, rehype-highlight, rehype-raw
- **Search**: FlexSearch (client-side full-text)
- **Hosting**: GitHub Pages (static, custom domain: xyang.me)
- **CI/CD**: GitHub Actions (`.github/workflows/deploy.yml`)

## Brand Guidelines

### Palette
| Token | Hex | Usage |
|-------|-----|-------|
| `navy` | `#0A1628` | Background |
| `navy-light` | `#111D32` | Cards, sidebar |
| `navy-lighter` | `#1A2A45` | Borders, hover states |
| `crimson` | `#E91E63` | Primary accent, CTAs |
| `blue` | `#1565C0` | Secondary accent |
| `blue-light` | `#1E88E5` | Links, highlights |

### Fonts
- **Sans**: Inter (headings, body)
- **Mono**: JetBrains Mono (code, matrix background)

### Tagline
"Hardware-aware AI researcher building frontier deep learning systems."

### Voice
Technical, precise, confident. No fluff. Show depth through specifics (JAX, CUDA, Triton, NCCL) rather than buzzwords.

## Build / Dev / Deploy

```bash
npm run dev         # Start dev server at localhost:3001
npm run build       # Build content manifest + TypeScript + Vite
npm run preview     # Preview production build
npm run lint        # ESLint
npm run build:content  # Rebuild content manifest only
npm run fetch:projects # Fetch project READMEs from GitHub
```

Deploy is automatic via GitHub Actions on push to `main`.

## Architecture

### Routing
- `/` — HomePage (hero + TechGlobe + highlights)
- `/about` — Extended bio, philosophy, timeline
- `/cv` — Email-gated CV (Formspree → reveal PDF + rendered resume)
- `/projects` — Project card grid
- `/projects/:slug` — Individual project (from content pipeline)
- `/posts` — Blog listing
- `/posts/:slug` — Individual post (Markdown rendered)
- `/search` — Full-text search (FlexSearch)
- `/tags` — Tag cloud
- `/tags/:tag` — Filtered content
- `/faq` — FAQ accordion

### Layout
- **MatrixBackground**: Canvas-based falling characters (z-0, fixed)
- **Sidebar**: Fixed left rail (240px), hidden behind hamburger on mobile
- **Main content**: `md:ml-60`, z-10 above background
- **Footer**: Inside main content area

### Content Pipeline
1. Write posts in `content/posts/*.md` with YAML frontmatter
2. Write project manifests in `content/projects/*.yaml`
3. `npm run build:content` scans and generates `src/generated/content-manifest.json`
4. `npm run fetch:projects` fetches READMEs from GitHub repos
5. Content manifest is imported by page components

### Visual Effects
- **MatrixBackground**: Ported from TransInfer. Canvas animation with crimson→blue gradient, mouse interaction.
- **TechGlobe**: Fibonacci sphere of tech keywords. Clickable → navigates to `/search?q={keyword}`.

## Content Authoring

### New Post
Create `content/posts/my-post.md`:
```markdown
---
title: "My Post Title"
date: "2026-02-08"
tags: [JAX, distributed-training]
description: "Brief description for listing page."
draft: false
---

Post content in Markdown. Supports:
- GFM tables, task lists
- LaTeX: $E = mc^2$ and $$\sum_{i=1}^n x_i$$
- Code blocks with syntax highlighting
- Raw HTML
```

### New Project
Create `content/projects/my-project.yaml`:
```yaml
---
title: "Project Name"
repo: "XingfuY/repo-name"
description: "Brief description."
tags: [tag1, tag2]
featured: true
order: 1
---
```

## Social Links
- GitHub: https://github.com/XingfuY
- LinkedIn: https://www.linkedin.com/in/xingfu-yang-phd-6b321262/
- Email: xingfu@xyang.me

## API Keys
Stored in `context/info.txt` (gitignored). Format:
```
API Keys: <google-api-key>
xAI GroK API Keys: <xai-api-key>
```

## Sibling Project
TransInfer site at `../transinfer/` — shared visual DNA, scripts, and Claude Code patterns.
