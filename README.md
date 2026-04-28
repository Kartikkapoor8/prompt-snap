# prompt-snap

> **Drop a screenshot. Get a working HTML clone.**
> Vision-model-powered screenshot → single-file HTML/CSS, in one click.
> **Bring your own Anthropic key** — runs entirely on your credits, never on mine.

![cover](cover.png)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FKartikkapoor8%2Fprompt-snap&project-name=prompt-snap&repository-name=prompt-snap)
![next](https://img.shields.io/badge/next.js-14-000000?style=flat-square)
![ts](https://img.shields.io/badge/typescript-5.5-3178C6?style=flat-square)
![claude](https://img.shields.io/badge/claude-3.5%20sonnet-D97706?style=flat-square)
![byok](https://img.shields.io/badge/BYOK-bring%20your%20own%20key-22c55e?style=flat-square)
![license](https://img.shields.io/badge/license-MIT-black?style=flat-square)

---

## What it does

Drop, paste, or click a screenshot. The image plus your **Anthropic key** is forwarded to Claude 3.5 Sonnet, which returns a single self-contained HTML file with inline CSS. The file renders live in an iframe. Copy the code, download it, deploy it.

```
┌─────────────┐  base64  ┌──────────────┐  vision  ┌───────────┐
│   Browser   │ ──image──>│  /api/snap   │ ────────>│  Claude   │
│ + your key  │ <── HTML──│ (passthrough)│ <── HTML─│  Sonnet   │
└─────────────┘           └──────────────┘          └───────────┘
       │
       ├─ live <iframe> preview
       ├─ copy-to-clipboard
       └─ download .html
```

## BYOK — bring your own key

The deployed app **does not ship with an API key**. Every visitor brings their own Anthropic key, which lives in `localStorage` on their browser and is sent with each request via an `x-api-key` header. The Next.js route uses the key for that single request and **never persists or logs it**.

This means:
- **No abuse risk** — the host's bill cannot be run up by random visitors
- **No vendor lock-in** — users keep their keys, can revoke any time
- **Privacy** — keys never touch a database, log, or third party other than Anthropic itself

## Features

- 🔑 **Bring your own key** — paste once, stored in your browser only
- 🎯 **Drop · Paste · Click** — three ways to upload
- 🖼 **Live iframe preview** — instant visual diff against the original
- 📋 **Copy / Download** — single-file HTML, ready to ship
- 🔒 **Sandboxed render** — generated HTML runs in a sandboxed iframe
- 🎭 **Demo mode** — works without any key, returns a canned response
- 🌑 **Brutalist gradient UI** — opinionated, monospace, zero filler

## Stack

Next.js 14 (App Router) · TypeScript · Tailwind · Anthropic SDK · Vercel-ready

## Quick start

```bash
git clone https://github.com/Kartikkapoor8/prompt-snap.git
cd prompt-snap
npm install
npm run dev
```

Open `http://localhost:3000` and click **SET KEY** in the top right.

## Deploy

Hit the **Deploy with Vercel** button at the top. **No environment variables required** — visitors will paste their own keys in the UI. Deploy time: ~90 seconds.

## Environment (optional)

| Variable | Default | Notes |
|---|---|---|
| `ANTHROPIC_API_KEY` | unset | Optional fallback if you want a server-side default key. **Not recommended for public deployments.** Visitor keys (sent as `x-api-key`) take precedence. |
| `CLAUDE_MODEL` | `claude-3-5-sonnet-latest` | Override to a different vision model |

## Project layout

```
prompt-snap/
├── app/
│   ├── api/snap/route.ts   # Claude vision call, BYOK passthrough
│   ├── globals.css         # gradient + monospace styling
│   ├── layout.tsx
│   └── page.tsx            # entire UI + key modal + localStorage
├── make_cover.py           # PIL script for the README cover
├── cover.png               # 1280×720 cover
├── next.config.mjs
├── tailwind.config.ts
├── tsconfig.json
├── .env.example
├── LICENSE
└── README.md
```

## How keys flow

```
User pastes key  ───────────►  localStorage (browser only)
                                       │
                  fetch /api/snap with x-api-key header
                                       │
            Next.js route reads header, instantiates SDK
                                       │
                   Anthropic API ◄─────┘
                                       │
                  HTML returned to browser, never stored
```

The API route never:
- Persists the key to disk
- Logs the key (no `console.log`, no analytics)
- Forwards the key to anywhere except `api.anthropic.com`

## Why

Frontend prototyping is bottlenecked on translating a screenshot into structure. Vision models removed that bottleneck. This is the smallest possible UI that exposes that capability — drop, get HTML, ship — without putting the host on the hook for everyone's API spend.

## Roadmap (ideas)

- [ ] Tailwind output mode (utility classes instead of inline CSS)
- [ ] React component output mode
- [ ] Multi-screenshot merge (whole-flow scaffolding)
- [ ] Side-by-side diff: original screenshot vs rendered clone
- [ ] Editable prompt — let users tune the system message live
- [ ] OpenAI / Gemini key support (multi-provider BYOK)

## Author

[Kartik Kapoor](https://github.com/Kartikkapoor8)

## License

MIT
