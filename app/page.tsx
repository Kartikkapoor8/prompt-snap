"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Status = "idle" | "loading" | "ready" | "error";

const LOADING_MESSAGES = [
  "CLAUDE IS LOOKING AT YOUR SCREENSHOT",
  "ANALYZING LAYOUT",
  "READING TYPOGRAPHY",
  "MEASURING COLORS",
  "WRITING HTML",
  "INLINING STYLES",
];

const KEY_STORAGE = "prompt-snap.anthropic-key";

function LoadingPanel() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(
      () => setI((x) => (x + 1) % LOADING_MESSAGES.length),
      1400
    );
    return () => clearInterval(t);
  }, []);
  return (
    <div className="flex-1 grid place-items-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
        <div className="text-xs text-[#888] tracking-widest">
          {LOADING_MESSAGES[i]}
        </div>
      </div>
    </div>
  );
}

function KeyModal({
  open,
  initial,
  onSave,
  onClose,
  onClear,
}: {
  open: boolean;
  initial: string;
  onSave: (k: string) => void;
  onClose: () => void;
  onClear: () => void;
}) {
  const [val, setVal] = useState(initial);
  useEffect(() => setVal(initial), [initial, open]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/80 px-4">
      <div className="w-full max-w-lg border border-[#2a2a2a] bg-black p-6 md:p-8">
        <div className="flex items-center justify-between mb-4">
          <div className="text-xs uppercase tracking-widest text-[#888]">
            Anthropic API key
          </div>
          <button
            onClick={onClose}
            className="text-[#888] hover:text-white text-sm"
          >
            ✕
          </button>
        </div>
        <h2 className="text-xl font-bold mb-3">Bring your own key</h2>
        <p className="text-sm text-[#aaa] leading-relaxed mb-5">
          Paste your Anthropic key. It is stored only in this browser
          (<code className="text-[#cfcfcf]">localStorage</code>) and sent
          directly with each request — never logged or saved on our server.
        </p>
        <input
          type="password"
          autoFocus
          spellCheck={false}
          autoComplete="off"
          placeholder="sk-ant-..."
          value={val}
          onChange={(e) => setVal(e.target.value)}
          className="w-full bg-black border border-[#2a2a2a] focus:border-white outline-none px-3 py-3 text-sm font-mono"
        />
        <div className="mt-3 text-xs text-[#666]">
          Get one at{" "}
          <a
            className="text-[#cfcfcf] hover:text-white underline underline-offset-2"
            href="https://console.anthropic.com/settings/keys"
            target="_blank"
            rel="noreferrer"
          >
            console.anthropic.com
          </a>
          . $5 free credit on signup.
        </div>
        <div className="mt-6 flex flex-wrap gap-3 justify-end">
          {initial && (
            <button
              onClick={() => {
                onClear();
                onClose();
              }}
              className="px-3 py-2 border border-[#2a2a2a] text-[#888] hover:text-white text-xs"
            >
              CLEAR
            </button>
          )}
          <button
            onClick={onClose}
            className="px-3 py-2 border border-[#2a2a2a] text-[#888] hover:text-white text-xs"
          >
            CANCEL
          </button>
          <button
            onClick={() => {
              onSave(val.trim());
              onClose();
            }}
            disabled={!val.trim().startsWith("sk-")}
            className="px-3 py-2 border border-white hover:bg-white hover:text-black disabled:opacity-30 disabled:cursor-not-allowed text-xs"
          >
            SAVE KEY
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [status, setStatus] = useState<Status>("idle");
  const [html, setHtml] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [demo, setDemo] = useState<boolean>(false);
  const [notice, setNotice] = useState<string>("");
  const [view, setView] = useState<"preview" | "code">("preview");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState<string>("");
  const [keyModalOpen, setKeyModalOpen] = useState<boolean>(false);
  const fileInput = useRef<HTMLInputElement>(null);

  // Load key from localStorage on mount
  useEffect(() => {
    try {
      const k = localStorage.getItem(KEY_STORAGE);
      if (k) setApiKey(k);
    } catch {}
  }, []);

  const saveKey = (k: string) => {
    try {
      if (k) localStorage.setItem(KEY_STORAGE, k);
      else localStorage.removeItem(KEY_STORAGE);
    } catch {}
    setApiKey(k);
  };

  const send = useCallback(
    async (file: File, opts: { demo?: boolean } = {}) => {
      setStatus("loading");
      setError("");
      setHtml("");
      setNotice("");
      setImagePreview(URL.createObjectURL(file));

      try {
        const buf = await file.arrayBuffer();
        const base64 = btoa(
          new Uint8Array(buf).reduce(
            (s, b) => s + String.fromCharCode(b),
            ""
          )
        );
        const headers: Record<string, string> = {
          "content-type": "application/json",
        };
        if (apiKey) headers["x-api-key"] = apiKey;

        const res = await fetch("/api/snap", {
          method: "POST",
          headers,
          body: JSON.stringify({
            image: base64,
            mediaType: file.type || "image/png",
            demo: !!opts.demo,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "request failed");
        setHtml(data.html);
        setDemo(!!data.demo);
        if (data.notice) setNotice(data.notice);
        setStatus("ready");
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "unknown error";
        setError(msg);
        setStatus("error");
      }
    },
    [apiKey]
  );

  // Drag-drop
  useEffect(() => {
    const onDrag = (e: DragEvent) => e.preventDefault();
    const onDrop = (e: DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer?.files?.[0];
      if (file && file.type.startsWith("image/")) send(file);
    };
    window.addEventListener("dragover", onDrag);
    window.addEventListener("drop", onDrop);
    return () => {
      window.removeEventListener("dragover", onDrag);
      window.removeEventListener("drop", onDrop);
    };
  }, [send]);

  // Paste from clipboard
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const item = Array.from(e.clipboardData?.items || []).find((i) =>
        i.type.startsWith("image/")
      );
      const file = item?.getAsFile();
      if (file) send(file);
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [send]);

  const reset = () => {
    setStatus("idle");
    setHtml("");
    setError("");
    setImagePreview(null);
    setNotice("");
  };

  const copyCode = async () => {
    await navigator.clipboard.writeText(html);
  };

  const downloadHtml = () => {
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "snap.html";
    a.click();
    URL.revokeObjectURL(url);
  };

  const keySet = Boolean(apiKey);

  return (
    <main className="min-h-screen flex flex-col">
      <KeyModal
        open={keyModalOpen}
        initial={apiKey}
        onSave={saveKey}
        onClose={() => setKeyModalOpen(false)}
        onClear={() => saveKey("")}
      />

      {/* HEADER */}
      <header className="flex justify-between items-center px-6 md:px-10 py-5 border-b border-[#2a2a2a] gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <span className="font-bold tracking-tight text-lg">PROMPT-SNAP</span>
          <span className="text-xs text-[#888] hidden sm:inline">
            screenshot → html/css
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <button
            onClick={() => setKeyModalOpen(true)}
            className={`px-2 py-1 border flex items-center gap-2 transition-colors ${
              keySet
                ? "border-emerald-400/60 text-emerald-400 hover:border-emerald-400"
                : "border-amber-400/60 text-amber-400 hover:border-amber-400"
            }`}
            title={keySet ? "API key set" : "Click to set your Anthropic key"}
          >
            <span
              className={`inline-block w-1.5 h-1.5 rounded-full ${
                keySet ? "bg-emerald-400" : "bg-amber-400 animate-pulse"
              }`}
            />
            {keySet ? "KEY SET" : "SET KEY"}
          </button>
          <a
            href="https://github.com/Kartikkapoor8/prompt-snap"
            className="text-[#888] hover:text-white"
            target="_blank"
            rel="noreferrer"
          >
            GITHUB ↗
          </a>
        </div>
      </header>

      {/* BYOK BANNER (only when no key set) */}
      {!keySet && (
        <div className="border-b border-[#2a2a2a] bg-amber-400/[0.03] px-6 md:px-10 py-3 text-xs text-amber-200 flex flex-wrap items-center justify-between gap-3">
          <span>
            <strong className="text-amber-300">BRING YOUR OWN KEY.</strong>{" "}
            Paste your Anthropic key to run real generations. It stays in your
            browser — never on our server.
          </span>
          <button
            onClick={() => setKeyModalOpen(true)}
            className="px-3 py-1 border border-amber-400/60 hover:bg-amber-400 hover:text-black text-amber-300 hover:text-black transition-colors"
          >
            SET KEY
          </button>
        </div>
      )}

      {/* MAIN */}
      <section className="flex-1 grid grid-cols-1 lg:grid-cols-2">
        {/* LEFT — input */}
        <div className="border-r border-[#2a2a2a] p-6 md:p-10 flex flex-col">
          <div className="text-xs uppercase tracking-widest text-[#888] mb-4">
            01 — Drop a screenshot
          </div>

          {!imagePreview ? (
            <div
              onClick={() => fileInput.current?.click()}
              className="flex-1 min-h-[320px] border border-dashed border-[#2a2a2a] hover:border-white transition-colors cursor-pointer flex flex-col items-center justify-center gap-3 text-center px-6"
            >
              <div className="text-2xl md:text-4xl font-bold tracking-tight">
                drop · paste · click
              </div>
              <div className="text-xs text-[#888] max-w-sm">
                PNG / JPG / WEBP — anywhere on this page. Or paste from
                clipboard (⌘V). Or click to choose a file.
              </div>
              <input
                ref={fileInput}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) send(f);
                }}
              />
            </div>
          ) : (
            <div className="flex-1 flex flex-col gap-4">
              <div className="flex-1 relative border border-[#2a2a2a] overflow-hidden bg-black">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imagePreview}
                  alt="uploaded screenshot"
                  className="w-full h-full object-contain"
                />
              </div>
              <button
                onClick={reset}
                className="self-start text-xs text-[#888] hover:text-white underline underline-offset-4"
              >
                ← drop another
              </button>
            </div>
          )}
        </div>

        {/* RIGHT — output */}
        <div className="p-6 md:p-10 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="text-xs uppercase tracking-widest text-[#888] flex items-center gap-2">
              02 — Generated HTML
              {demo && (
                <span className="px-2 py-0.5 border border-amber-400/60 text-amber-300">
                  DEMO
                </span>
              )}
            </div>
            {status === "ready" && (
              <div className="flex gap-2 text-xs">
                <button
                  onClick={() => setView("preview")}
                  className={`px-2 py-1 border ${
                    view === "preview"
                      ? "border-white"
                      : "border-[#2a2a2a] text-[#888]"
                  }`}
                >
                  PREVIEW
                </button>
                <button
                  onClick={() => setView("code")}
                  className={`px-2 py-1 border ${
                    view === "code"
                      ? "border-white"
                      : "border-[#2a2a2a] text-[#888]"
                  }`}
                >
                  CODE
                </button>
              </div>
            )}
          </div>

          {notice && (
            <div className="mb-3 text-xs text-amber-300">{notice}</div>
          )}

          <div className="flex-1 min-h-[320px] border border-[#2a2a2a] flex flex-col">
            {status === "idle" && (
              <div className="flex-1 grid place-items-center text-[#888] text-sm">
                waiting for input
              </div>
            )}

            {status === "loading" && <LoadingPanel />}

            {status === "error" && (
              <div className="flex-1 p-6 text-sm">
                <div className="text-red-400 mb-2">error</div>
                <div className="text-[#888] break-words">{error}</div>
                <button
                  onClick={reset}
                  className="mt-4 text-xs underline underline-offset-4 hover:text-white"
                >
                  try again
                </button>
              </div>
            )}

            {status === "ready" &&
              (view === "preview" ? (
                <iframe
                  title="preview"
                  className="flex-1 w-full bg-white"
                  sandbox="allow-same-origin"
                  srcDoc={html}
                />
              ) : (
                <pre className="flex-1 overflow-auto text-xs p-4 text-[#cfcfcf] whitespace-pre-wrap break-words">
                  {html}
                </pre>
              ))}
          </div>

          {status === "ready" && (
            <div className="mt-4 flex flex-wrap gap-3 text-xs">
              <button
                onClick={copyCode}
                className="px-3 py-2 border border-white hover:bg-white hover:text-black transition-colors"
              >
                COPY HTML
              </button>
              <button
                onClick={downloadHtml}
                className="px-3 py-2 border border-[#2a2a2a] text-[#cfcfcf] hover:border-white hover:text-white transition-colors"
              >
                DOWNLOAD .HTML
              </button>
              <button
                onClick={reset}
                className="px-3 py-2 border border-[#2a2a2a] text-[#888] hover:text-white transition-colors"
              >
                RESET
              </button>
            </div>
          )}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="px-6 md:px-10 py-4 border-t border-[#2a2a2a] flex flex-wrap justify-between gap-2 text-xs text-[#888]">
        <span>BUILT WITH NEXT.JS · CLAUDE 3.5 SONNET · BRING YOUR OWN KEY</span>
        <span>
          BY{" "}
          <a
            href="https://github.com/Kartikkapoor8"
            className="hover:text-white"
          >
            @KARTIKKAPOOR8
          </a>
        </span>
      </footer>
    </main>
  );
}
