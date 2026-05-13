# BRJ Social Repurposing Portal — Prototype

Paste a URL → get Instagram, Facebook, and LinkedIn captions plus 6 slide PNGs each. Demo-only, localhost-only, no auth, no DB.

## Install

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

## Use

1. Paste an article URL (e.g. from `buildingreviewjournal.com`) and click **Generate**.
2. The article is scraped and you land on `/g/<id>`.
3. Click any platform tab and hit **Generate** to produce caption + 6 slides.
4. Edit the caption inline. Slides render on demand and cache to `/tmp/brj/`.

## Notes

- Generations are stored as JSON in `/tmp/brj/`. Slides are PNGs cached in the same folder.
- Model: `claude-sonnet-4-5`. Set `ANTHROPIC_API_KEY` in `.env.local`.
- Localhost only — there is no auth, no rate limiting, and no input sanitisation beyond a URL check. Don't expose publicly.
- Brand: navy `#0F1F3D`, orange `#E87722`, white. Logo placeholder is the text "BRJ" on each slide.
