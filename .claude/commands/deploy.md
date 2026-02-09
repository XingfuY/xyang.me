# /deploy — Build & Deploy to GitHub Pages

Build the site and push to trigger GitHub Pages deployment.

## Your Task

Deploy the site based on: **$ARGUMENTS**

If no arguments, perform a full build-verify-push cycle.

## Steps

1. **Pre-flight checks**:
   - Verify no uncommitted changes (or commit them first)
   - Run `npm run lint` — fix any errors
   - Run `npm run build` — verify clean build

2. **Build verification**:
   - Check `dist/` exists and contains `index.html`
   - Check `dist/CNAME` exists
   - Check `dist/404.html` exists
   - Verify bundle size is reasonable

3. **Deploy**:
   - `git add .`
   - `git commit -m "Deploy: <description>"`
   - `git push origin main`

4. **Post-deploy**:
   - Report the GitHub Actions URL to monitor deployment
   - Remind about DNS propagation if this is the first deploy

## Notes

- Deployment is automatic via GitHub Actions on push to `main`
- Custom domain `xyang.me` requires DNS A records pointing to GitHub Pages IPs
- HTTPS is auto-configured by GitHub Pages (Let's Encrypt)
