# Kelowna.Oropezas.com

Local news site for Kelowna, BC, Canada — same architecture as [Oropezas.com](https://oropezas.com).

## Stack

- **Frontend:** Static HTML/CSS/JS — deployed on Cloudflare Pages or GitHub Pages
- **Backend:** Cloudflare Worker (same pattern as `oropezas.com`)
- **Storage:** Cloudflare KV (articles index + full content + users)
- **Media:** Cloudflare R2 (article images)
- **AI:** Cloudflare AI / Gemini for auto-publish and image generation

## Project Structure

```
kelowna/
├── src/
│   └── worker.js          # Cloudflare Worker backend
├── frontend/
│   ├── index.html         # Homepage
│   ├── noticias.html      # All articles
│   ├── article.html       # Article detail
│   ├── contacto.html      # Contact form
│   ├── navbar.html        # Shared navbar (loaded by main.js)
│   ├── styles.css         # Main stylesheet (same as Oropezas)
│   └── js/
│       ├── main.js        # Navbar loader + animations
│       ├── news-loader.js # Article grid / featured renderer
│       ├── article.js     # Article detail page
│       └── auth.js        # Google Sign-In
├── wrangler.jsonc         # Cloudflare Worker config
└── package.json
```

## Worker API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/status` | None | Health check |
| GET | `/api/articles` | None | List all articles (or single by `?slug=`) |
| GET | `/api/article/:slug` | None | Full article detail |
| GET | `/api/media/:key` | None | Serve R2 media |
| POST | `/api/auth/google` | None | Google token exchange |
| GET/POST | `/api/user/profile` | None/Token | User profile |
| POST | `/api/contact` | None | Contact form |
| POST | `/api/agent/write` | `x-api-key` | Write/update article |
| POST | `/api/agent/auto-publish` | `x-api-key` | AI-generate + publish article |
| GET | `/api/agent/dashboard` | `x-api-key` | Stats dashboard |
| POST | `/api/agent/generate-image` | `x-api-key` | Regenerate article image |
| POST | `/api/agent/delete` | `x-api-key` | Delete article |

## Setup

### 1. Create KV Namespace

```bash
wrangler kv namespace create KELOWNA_KV
# Copy the ID into wrangler.jsonc
```

### 2. Create R2 Bucket

```bash
wrangler r2 bucket create kelowna-media
```

### 3. Set Secrets

```bash
wrangler secret put ARTICLE_SECRET      # API key for agent endpoints
wrangler secret put GEMINI_API_KEY      # For AI auto-publish + images
wrangler secret put RESEND_API_KEY      # For contact form emails (optional)
```

### 4. Deploy Worker

```bash
npm run deploy
```

### 5. Deploy Frontend

Via Cloudflare Pages (connect the GitHub repo) or:
```bash
npm run deploy:frontend
```

## CORS

The worker allows requests from:
- `https://kelowna.oropezas.com`
- `https://oropezas.com` (cross-linking)
- `*.pages.dev` (staging)
- `*.oropezas.com` (all subdomains)
- `localhost:*` (local dev)
