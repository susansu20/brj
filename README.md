# BRJ Social Repurposing Portal — Prototype

Paste a URL → get Instagram, Facebook, and LinkedIn captions plus 6 slide PNGs each, with a single-PDF download for LinkedIn.

## Local development

```bash
cd brj-social-portal
npm install
cp .env.example .env.local
```

Open `.env.local` in an editor and set `ANTHROPIC_API_KEY=sk-ant-...`, then:

```bash
npm run dev
```

Open http://localhost:3000.

Locally, generations are written to `/tmp/brj/` (JSON + cached slide PNGs). No external services needed.

## Deploy to Vercel

The app uses dual-backend storage: if `BLOB_READ_WRITE_TOKEN` is set, it stores generations and slide PNGs in Vercel Blob (persists across serverless invocations). Otherwise it falls back to `/tmp/` (good for local dev only).

1. Push to GitHub.
2. Import the repo at https://vercel.com/new — framework auto-detects as Next.js.
3. **Before clicking Deploy**, set Environment Variables:
   - `ANTHROPIC_API_KEY` — your Anthropic key.
4. Deploy.
5. After the first deploy succeeds, in the project dashboard go to **Storage → Create Database → Blob → Create**. Vercel links it to the project and auto-injects `BLOB_READ_WRITE_TOKEN` for subsequent deployments.
6. Trigger a redeploy (Deployments → ⋯ → Redeploy) so the function picks up the new env var.

That's it. The first generation will write into Blob and the post page will load.

## Use

1. Paste an article URL (e.g. from `buildingreviewjournal.com`) and click **Generate**.
2. The article is scraped and all three platforms are generated in parallel.
3. Open any platform tab to see caption + hashtags (editable) and 6 slide PNGs.
4. On the LinkedIn tab, **Download PDF** combines all 6 slides into a single 1080×1350 PDF.

## Notes

- Model: `claude-sonnet-4-5`.
- Brand: navy `#0F1F3D`, orange `#E87722`. Logo PNG at `public/brj-logo.png`.
- No auth, no rate limiting, minimal input validation. Don't expose this publicly without adding those.
