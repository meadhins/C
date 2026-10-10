# Daily Set Tracker

A minimalist, responsive single-page web app and progressive web app (PWA) designed to track a daily target of 80 units, organized into ten sets of 8 units each.

## Technical Stack
- React 19
- Vite
- Plain JavaScript (JSX)
- Tailwind CSS
- Client-side persistence via `localStorage`
- Service Worker & Web App Manifest for offline PWA installation

## Interaction Guide
- **Activate an empty set**: Double-click on desktop or double-tap on touch devices. The current local time (HH:MM) is immediately recorded.
- **Edit an existing entry**: Press and hold (mouse down on desktop, long-press on mobile for 500ms). Use the native time input to update or clear the entry.
- **Date Navigation**: Use the subtle previous/next buttons to inspect previous dates or navigate back to today.

## GitHub Pages Deployment

### Option 1: Automatic Deployment with GitHub Actions (Recommended)
1. Push this repository to GitHub.
2. In your GitHub repository, navigate to **Settings** > **Pages**.
3. Under **Build and deployment** > **Source**, select **GitHub Actions**.
4. Push a commit to the `main` branch. The included `.github/workflows/deploy.yml` workflow will automatically build and deploy the app to your GitHub Pages URL.

### Option 2: Manual Build and Deploy
1. Run `npm install`.
2. Run `npm run build`. The production-ready static files are generated in the `dist/` directory.
3. Deploy the contents of `dist/` to your `gh-pages` branch or hosting provider.

*Note: Vite is preconfigured with relative asset paths (`base: './'`), so it works out-of-the-box whether hosted at the domain root or in a GitHub repository subpath (e.g. `https://<user>.github.io/<repo>/`).*

## PWA Installation in Chrome
1. Open the hosted URL in Google Chrome (desktop or mobile).
2. On desktop, click the install icon in Chrome's address bar or the "Install as App" button in the app.
3. On mobile Chrome, tap the menu (three dots) and select **Add to Home screen** / **Install app**.
4. The app runs in standalone mode and remains functional offline.
