# calibrate.md — Lessons Learned

Living document. Updated whenever errors, pitfalls, or back-and-forth iterations occur.

## Tailwind v4

- Tailwind v4 uses CSS-first configuration via `@theme` in `src/index.css` — no `tailwind.config.js` needed.
- The Vite plugin is `@tailwindcss/vite`, imported as `tailwindcss` in `vite.config.ts`.
- Custom colors defined in `@theme` are usable directly as utility classes (e.g., `bg-navy`, `text-crimson`).

## GitHub Pages SPA Routing

- GitHub Pages serves `404.html` for unknown routes.
- The `404.html` → `index.html` redirect hack encodes the path as a query parameter.
- The `index.html` `<script>` decodes it back via `history.replaceState`.
- `public/CNAME` must be present for custom domain.
- The `base` in `vite.config.ts` must be `'/'` for custom domains (not a subpath).

## Vite + React + TypeScript

- Use `--template react-ts` if scaffolding from scratch. If directory is non-empty, create files manually.
- `tsconfig.json` uses project references: `tsconfig.app.json` (src) + `tsconfig.node.json` (vite.config).
- `erasableSyntaxOnly: true` in TS 5.9+ — use `type` keyword for type-only imports.

## ESLint Flat Config

- ESLint 9.x uses flat config format (no `.eslintrc`).
- Import `{ defineConfig, globalIgnores }` from `eslint/config`.
- Pin `eslint@^9` to avoid peer dependency conflicts with `eslint-plugin-react-hooks` which doesn't yet support ESLint 10.

## Content Pipeline

- `gray-matter` npm package handles YAML frontmatter parsing, but the build-content-manifest script uses a simpler hand-rolled parser to avoid Node.js module resolution issues in Vite builds.
- Always generate `src/generated/content-manifest.json` before `vite build`.

## Dev Server

- Port 3001 to avoid conflict with TransInfer on 3000.

## KaTeX

- KaTeX CSS must be loaded from CDN in `index.html` (not bundled, to avoid large CSS in bundle).
- `remark-math` + `rehype-katex` pipeline handles `$...$` and `$$...$$` syntax.
