---
title: Hello World — Launching xyang.me
date: 2026-02-08
description: Introducing my portfolio site built with React, Vite, and Tailwind v4. A technical overview of the architecture and content pipeline.
tags: [meta, react, vite]
---

# Hello World — Launching xyang.me

Welcome to my new portfolio site! This is a quick technical overview of how it's built.

## Tech Stack

- **React 19** + **Vite 7** — fast dev server, optimized production builds
- **TypeScript 5.9** — strict mode, full type safety
- **Tailwind CSS v4** — CSS-first configuration via `@theme`
- **React Router v7** — client-side SPA routing
- **GitHub Pages** — static hosting with custom domain

## Content Pipeline

Posts like this one are authored in Markdown with YAML frontmatter. At build time, a script:

1. Scans `content/posts/*.md` for frontmatter metadata
2. Generates a JSON manifest (`content-manifest.json`)
3. Copies post bodies to `public/` for runtime fetching

The site uses `react-markdown` with plugins for GitHub Flavored Markdown, LaTeX math ($E = mc^2$), and syntax-highlighted code blocks:

```python
import jax
import jax.numpy as jnp

# Simple JAX computation
x = jnp.ones((1000, 1000))
y = jnp.dot(x, x)
print(f"Result shape: {y.shape}")
```

## What's Next

- Technical deep-dives on JAX parallelism and CUDA kernels
- Project writeups for MiniLM and RelationalLearning
- Research notes on scaling laws and RLHF

Stay tuned!
