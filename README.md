# Farahnaz Hoque — Portfolio

Static portfolio site for [GitHub Pages](https://pages.github.com/).

## Structure

| Path | Purpose |
|------|---------|
| `index.html` | Home |
| `experience.html` | Role folders (Software Engineer, PM, etc.) |
| `about.html` | About and contact |
| `css/main.css` | Shared styles |
| `js/shell.js` | Nav, footer, display settings, page transitions |
| `js/ascii-device.js` | Home hero animation |
| `js/folders.js` | Experience accordion |

Deep links to a role: `experience.html#swe`, `#pm`, `#tc`, `#se`, `#dr`.

## GitHub Pages

1. Push this repo to GitHub.
2. **Settings → Pages → Build and deployment**: Source **Deploy from a branch**, branch **`main`**, folder **`/ (root)`**.
3. Your site will be at `https://<username>.github.io/<repo-name>/` (or your custom domain).

No build step required.

## Local preview

```bash
python3 -m http.server 8080
```

Open [http://localhost:8080](http://localhost:8080).