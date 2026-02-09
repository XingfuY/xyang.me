# /new-project — Scaffold a New Project Manifest

Create a new project manifest for the portfolio.

## Your Task

Create a new project based on: **$ARGUMENTS**

If no arguments, list the user's GitHub repos and suggest which to add.

## Steps

1. Generate a slug from the project name (lowercase, hyphenated)
2. Create `content/projects/{slug}.yaml` with frontmatter:

```yaml
---
title: "Project Name"
repo: "XingfuY/repo-name"
description: "Brief description of the project and its significance."
tags: [tag1, tag2, tag3]
featured: true
order: 1
---
```

3. Optionally fetch the README: `npm run fetch:projects`
4. Run `npm run build:content` to update the manifest
5. Report the file path and suggest next steps

## Guidelines

- Description should be compelling for a frontier lab hiring manager
- Tags should match the site's tag taxonomy
- Featured projects appear prominently on the homepage
- Order determines display sequence (lower = first)
