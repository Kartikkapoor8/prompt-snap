import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export const runtime = "nodejs";
export const maxDuration = 60;

const SYSTEM_PROMPT = `You are an expert UI engineer. You convert screenshots of user interfaces into a single self-contained HTML file that visually replicates the design as faithfully as possible.

Hard rules:
1. Output ONLY raw HTML. No markdown fences, no commentary, no preamble.
2. Use a single <html> document with <style> in the <head>. Inline CSS only — no external stylesheets, no Tailwind CDN, no JavaScript.
3. Use system fonts (font-family: ui-sans-serif, system-ui, -apple-system, ...) unless the screenshot clearly shows a specific font category (serif, mono, condensed). Match the category, not the exact font.
4. Preserve layout, spacing, colors, and typography hierarchy. Pixel-perfect when possible.
5. Use semantic HTML (header, nav, main, section, button) where appropriate.
6. Include hover/focus states for interactive elements. No animations.
7. Make it responsive — use flexbox or grid, not absolute positioning, unless the design demands it.
8. If the screenshot contains text, transcribe it verbatim. If unreadable, use plausible filler that fits the design's tone.
9. Do not invent features that aren't visible. Replicate, don't redesign.

Output format: just the HTML, starting with <!doctype html>.`;

const DEMO_HTML = `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>Demo — prompt-snap</title>
<style>
  :root { --bg:#000; --fg:#fff; --mute:#888; }
  body { margin:0; background:var(--bg); color:var(--fg); font-family: ui-sans-serif, system-ui, -apple-system, sans-serif; }
  header { padding:32px 48px; border-bottom:1px solid #222; display:flex; justify-content:space-between; align-items:center; }
  header h1 { margin:0; font-size:18px; letter-spacing:.06em; }
  header nav a { color:var(--mute); text-decoration:none; margin-left:24px; font-size:14px; }
  main { padding:96px 48px; max-width:1100px; margin:0 auto; }
  h2 { font-size:64px; line-height:1.05; margin:0 0 16px; letter-spacing:-0.02em; }
  p { color:var(--mute); font-size:18px; max-width:560px; line-height:1.5; }
  .cta { margin-top:32px; display:inline-block; padding:14px 22px; background:#fff; color:#000; font-weight:600; text-decoration:none; }
</style>
</head>
<body>
  <header>
    <h1>DEMO MODE</h1>
    <nav><a>About</a><a>Pricing</a><a>Contact</a></nav>
  </header>
  <main>
    <h2>This is a demo render.</h2>
    <p>To run real generations, paste your Anthropic API key in the top-right of the app. Your key is stored only in your browser and is never logged or saved on this server.</p>
    <a class="cta" href="#">Get started</a>
  </main>
</body>
</html>`;

function pickKey(req: NextRequest): { key: string | null; source: "user" | "server" | "none" } {
  // 1) User-provided key from header (BYOK)
  const headerKey = req.headers.get("x-api-key")?.trim();
  if (headerKey && headerKey.startsWith("sk-")) {
    return { key: headerKey, source: "user" };
  }
  // 2) Server-side key (admin/local)
  const envKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (envKey) {
    return { key: envKey, source: "server" };
  }
  return { key: null, source: "none" };
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      image?: string;
      mediaType?: string;
      demo?: boolean;
    };
    const { image, mediaType, demo } = body;

    if (!image) {
      return NextResponse.json(
        { error: "Missing 'image' field (expected base64 string)" },
        { status: 400 }
      );
    }

    // Explicit demo request from client
    if (demo) {
      return NextResponse.json({ html: DEMO_HTML, demo: true });
    }

    const { key, source } = pickKey(req);

    // No key anywhere → demo
    if (!key) {
      return NextResponse.json({
        html: DEMO_HTML,
        demo: true,
        notice:
          "No API key set. Paste your Anthropic key in the top-right to enable real generations.",
      });
    }

    const client = new Anthropic({ apiKey: key });
    const model = process.env.CLAUDE_MODEL || "claude-3-5-sonnet-latest";

    const allowedTypes = ["image/png", "image/jpeg", "image/webp", "image/gif"] as const;
    type AllowedMedia = (typeof allowedTypes)[number];
    const mt: AllowedMedia = allowedTypes.includes(mediaType as AllowedMedia)
      ? (mediaType as AllowedMedia)
      : "image/png";

    const response = await client.messages.create({
      model,
      max_tokens: 8000,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: mt, data: image },
            },
            {
              type: "text",
              text: "Convert this screenshot into a single self-contained HTML file. Output ONLY the HTML.",
            },
          ],
        },
      ],
    });

    let html = response.content
      .filter((block): block is Extract<typeof block, { type: "text" }> => block.type === "text")
      .map((block) => block.text)
      .join("\n")
      .trim();

    html = html.replace(/^```(?:html)?\s*/i, "").replace(/```\s*$/i, "");

    return NextResponse.json({ html, demo: false, source });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    // Surface Anthropic auth errors helpfully
    const isAuth = /401|invalid api key|authentication/i.test(msg);
    return NextResponse.json(
      { error: isAuth ? "Invalid API key. Check the key in the top-right." : msg },
      { status: isAuth ? 401 : 500 }
    );
  }
}
