# /new-post — Scaffold a New Blog Post

Create a new blog post with proper frontmatter and initial structure.

## Your Task

Create a new post based on: **$ARGUMENTS**

If no arguments, ask what the post should be about.

## Steps

1. Generate a slug from the title (lowercase, hyphenated)
2. Create `content/posts/{slug}.md` with frontmatter:

```markdown
---
title: "Post Title"
date: "YYYY-MM-DD"
tags: [tag1, tag2]
description: "Brief description for listing page and SEO."
draft: true
---

# Post Title

Introduction paragraph.

## Section 1

Content here.

## Conclusion

Wrap-up.
```

3. Run `npm run build:content` to update the manifest
4. Report the file path and suggest next steps

## Writing Style

- Technical, precise, no fluff
- Use code blocks with language annotations
- Use LaTeX for math: `$inline$` and `$$block$$`
- Include relevant diagrams or architecture descriptions
- Link to source code repos where applicable
