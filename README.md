# Nimbus Run

A small endless-runner game built with React, Vite, and HTML Canvas. Help Goku ride the Nimbus through mountain obstacles, jump with the keyboard or touch controls, and beat your best score.

## Run locally

Requires Node.js 22 or later.

```bash
npm ci
npm run dev
```

Open the local URL printed by Vite.

## Build locally

```bash
npm run build
npm run preview
```

## Deploy with GitHub Pages

1. Create a GitHub repository named `goku-nimbus-run` and push this project to its `main` branch.
2. In the repository, open **Settings → Pages** and set the build and deployment source to **GitHub Actions**.
3. The workflow in `.github/workflows/deploy.yml` builds the site and deploys it whenever you push to `main`. You can also start it manually from the **Actions** tab.

After the first successful deployment, GitHub Pages will show the published URL under **Settings → Pages**. The Vite build uses relative asset paths so it works under the repository URL.
