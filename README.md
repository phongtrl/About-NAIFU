# NAIFU ナイフ — Phong Vuoc Tran

A personal biography site for **Phong Vuoc Tran**, a knife sharpening content creator
known online as **NAIFU ナイフ**. Built as a fast, responsive, dependency-free static site.

## Structure

| File | Purpose |
| --- | --- |
| `index.html` | Page markup and content |
| `styles.css` | Styling (dark Japanese-blade theme, responsive) |
| `script.js` | Scroll reveals, animated stats, mobile menu |
| `image/photo.JPG` | Your portrait shown in the About section |

## Change your photo

Replace `image/photo.JPG` with your own image, or update the `src` in the
`<img class="about__img">` tag in `index.html`. Filenames are case-sensitive on GitHub
Pages, so match the exact casing. If the file is missing, a kanji placeholder is shown.

## Links used

- TikTok: https://www.tiktok.com/@knifesharpening (embedded video + follow button)
- Instagram: https://www.instagram.com/knifesharpener__/

Update these in `index.html` if your handles change. To add more TikTok videos, copy the
`<blockquote class="tiktok-embed">` block and swap `data-video-id` / `cite` with the new
video URL.

## Run locally

Just open `index.html` in a browser, or use the VS Code **Live Server** extension
(right-click `index.html` → *Open with Live Server*).

## Deploy to GitHub Pages

1. Create a GitHub repo and push these files:
   ```powershell
   git init
   git add .
   git commit -m "Initial site"
   git branch -M main
   git remote add origin https://github.com/<you>/<repo>.git
   git push -u origin main
   ```
2. In the repo, go to **Settings → Pages → Build and deployment → Source** and choose
   **GitHub Actions**.
3. The included workflow (`.github/workflows/deploy.yml`) publishes the site on every push
   to `main`. Your site will be live at `https://<you>.github.io/<repo>/`.
