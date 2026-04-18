# Spark — Curiosity Engine

Spark helps people discover what they want to learn, go deeper on demand, and build lasting threads of curiosity.

## Local Development

```bash
npm ci
npm run dev
```

Optional local topic API:

```bash
npm run dev:api
```

## GitHub Pages Deployment (Step-by-step)

This repo is configured to deploy with GitHub Actions via `.github/workflows/deploy-github-pages.yml`.

1. **Push this branch to your GitHub repository** (default deploy branch is `main`).
2. In GitHub, open **Settings → Pages**.
3. Under **Build and deployment**, choose **Source: GitHub Actions**.
4. Confirm your default branch is `main` (or update the workflow trigger if you use another branch).
5. Push to `main` (or run the workflow manually from **Actions → Deploy to GitHub Pages → Run workflow**).
6. Wait for the workflow to finish; GitHub will publish at:
   - `https://<your-username>.github.io/<repo-name>/`
7. If the site appears stale, hard refresh after deploy (Cmd/Ctrl + Shift + R).

### Why this works

- Vite now supports a configurable base path via `VITE_BASE_PATH`.
- The workflow builds with:
  - `VITE_BASE_PATH=/${{ github.event.repository.name }}/`
- That ensures built assets resolve correctly under the GitHub Pages project URL.

### Notes

- The app gracefully falls back to local AI/cache flows when `VITE_TOPIC_API_URL` is not provided (common on Pages).
- If you use a custom domain and serve from root, set `VITE_BASE_PATH=/` in your build environment.
