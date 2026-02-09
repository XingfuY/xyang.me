# /generate-image — Grok Imagine Brand Image Generator

Generate images using xAI Grok Imagine with xyang.me's visual language.

## Your Task

Generate an image based on: **$ARGUMENTS**

If no arguments provided, suggest a prioritized list of images the site needs (favicon, OG image, avatar, logo variants) with ready-to-use prompts.

## Visual Language

All prompts should incorporate xyang.me's design DNA:
- **Dark navy background** (#0A1628)
- **Crimson (#E91E63) to blue (#1565C0) gradient** accents
- **Technical motifs**: neural networks, tensor grids, GPU chips, data flow
- **Minimal, premium, cinematic** — no clutter
- **Volumetric lighting, depth of field**

## Anti-Text Block (MANDATORY in every prompt)

Append this to EVERY image prompt:

> ABSOLUTELY NO TEXT, WORDS, NUMBERS, LETTERS, TYPOGRAPHY, LABELS, CAPTIONS, OR WATERMARKS. Abstract visual only.

## Execution

### Primary (Grok Imagine)

```bash
node scripts/grok-imagen.mjs --prompt "YOUR CRAFTED PROMPT. ABSOLUTELY NO TEXT, WORDS, NUMBERS, LETTERS, TYPOGRAPHY, LABELS, CAPTIONS, OR WATERMARKS. Abstract visual only." --output OUTPUT_PATH --aspect 16:9 --count 1
```

### With input image (image-to-image)

```bash
node scripts/grok-imagen.mjs --prompt "YOUR CRAFTED PROMPT..." --image INPUT_IMAGE_PATH --output OUTPUT_PATH
```

## Output

Report the generated image path, dimensions, and suggest where it fits on the site.

## Output Directories

- Brand images: `scripts/output/brand/`
- General images: `scripts/output/`
