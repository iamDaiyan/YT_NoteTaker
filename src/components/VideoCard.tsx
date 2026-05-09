"use client";

import { buildYouTubeEmbedUrl } from "@/lib/youtube";
import { sanitizeNoteHtml } from "@/lib/sanitize-html";
import type { SyntheticEvent } from "react";
import { useCallback, useEffect, useRef, useState } from "react";

export type ApiVideoRow = {
  id: string;
  youtubeId: string;
  title: string;
  html: string;
};

function updateToolbarActive(toolbar: HTMLElement | null) {
  if (!toolbar) return;
  toolbar.querySelectorAll<HTMLButtonElement>(".toolbar-btn").forEach((btn) => {
    const cmd = btn.dataset.cmd as string;
    let on = false;
    try {
      on = document.queryCommandState(cmd);
    } catch {
      on = false;
    }
    btn.classList.toggle("active", on);
  });
}

export function VideoCard({
  video,
  onRemoved,
  onSaveHtml,
}: Readonly<{
  video: ApiVideoRow;
  onRemoved: (id: string) => void;
  onSaveHtml: (id: string, html: string) => Promise<void> | void;
}>) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [iframeReady, setIframeReady] = useState(false);
  const [iframeSrc, setIframeSrc] = useState("");
  const [saveStatus, setSaveStatus] = useState("");

  const persist = useCallback(async () => {
    const html = sanitizeNoteHtml(editorRef.current?.innerHTML ?? "");

    try {
      await onSaveHtml(video.id, html);
      setSaveStatus("Saved");
      window.setTimeout(() => setSaveStatus(""), 2000);
    } catch {
      setSaveStatus("Save failed");
    }
  }, [onSaveHtml, video.id]);

  useEffect(() => {
    setIframeReady(false);
    const src = buildYouTubeEmbedUrl(video.youtubeId, window.location.origin);
    setIframeSrc(src);
    setIframeReady(true);
  }, [video.youtubeId]);

  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;
    if (el.dataset.hydrated === video.id) return;
    el.innerHTML = video.html;
    el.dataset.hydrated = video.id;
  }, [video.html, video.id]);

  async function confirmRemove() {
    if (
      !window.confirm(
        "Remove this video from your library? Your saved notes for it will be deleted too."
      )
    ) {
      return;
    }

    onRemoved(video.id);
  }

  const onToolbarMouseDown = (e: SyntheticEvent<HTMLDivElement>) => {
    const t = e.target as HTMLElement | null;
    const btn = t?.closest(".toolbar-btn") as HTMLButtonElement | null;
    if (!btn) return;
    e.preventDefault();
  };

  const onToolbarClick = (e: SyntheticEvent<HTMLDivElement>) => {
    const t = e.target as HTMLElement | null;
    const btn = t?.closest(".toolbar-btn") as HTMLButtonElement | null;
    if (!btn?.dataset.cmd) return;
    const cmd = btn.dataset.cmd;
    editorRef.current?.focus();
    try {
      document.execCommand(cmd, false);
    } catch {
      /* ignore deprecated API edge cases */
    }
    updateToolbarActive(btn.closest(".editor-toolbar"));
  };

  const onEditorInteraction = () => {
    updateToolbarActive(editorRef.current?.previousElementSibling as HTMLElement | null);
  };

  return (
    <article className="border border-border-passive rounded-2xl p-lg bg-background-cream">
      <div className="flex justify-between items-start gap-sm">
        <h2 className="font-card-title text-card-title font-normal text-text-charcoal">{video.title}</h2>
        <button
          type="button"
          className="p-xs hover:bg-charcoal-4 rounded-lg transition-colors text-text-muted hover:text-text-charcoal shrink-0"
          onClick={() => void confirmRemove()}
          aria-label="Remove video"
        >
          <span className="material-symbols-outlined text-xl">close</span>
        </button>
      </div>

      <div className="mt-md grid grid-cols-1 lg:grid-cols-5 gap-lg xl:gap-xl">
        <div className="lg:col-span-3">
          <div className="relative aspect-video rounded-lg overflow-hidden border border-border-passive bg-charcoal-3">
            {iframeReady && iframeSrc ? (
              <iframe
                title={`YouTube: ${video.title}`}
                src={iframeSrc}
                className="absolute inset-0 h-full w-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
                allowFullScreen
                referrerPolicy="strict-origin-when-cross-origin"
              />
            ) : (
              <div className="absolute inset-0 bg-charcoal-3" aria-hidden />
            )}
          </div>
        </div>

        <div className="lg:col-span-2 flex min-h-0 flex-col gap-sm soft-glow rounded-lg py-px">
          <span className="font-caption uppercase tracking-wider text-text-muted">Notes</span>

          <div
            role="toolbar"
            aria-label="Text formatting"
            className="editor-toolbar flex flex-wrap gap-xs border-b border-border-passive pb-xs"
            onMouseDown={onToolbarMouseDown}
            onClick={(e) => void onToolbarClick(e)}
          >
            <button
              type="button"
              data-cmd="bold"
              className="toolbar-btn rounded-lg border border-border-passive px-sm py-1 text-caption font-semibold transition-colors hover:bg-charcoal-4"
              title="Bold"
            >
              B
            </button>
            <button
              type="button"
              data-cmd="italic"
              className="toolbar-btn rounded-lg border border-border-passive px-sm py-1 text-caption italic transition-colors hover:bg-charcoal-4"
              title="Italic"
            >
              I
            </button>
            <button
              type="button"
              data-cmd="underline"
              className="toolbar-btn rounded-lg border border-border-passive px-sm py-1 text-caption underline decoration-text-charcoal transition-colors hover:bg-charcoal-4"
              title="Underline"
            >
              U
            </button>
            <button
              type="button"
              data-cmd="insertUnorderedList"
              className="toolbar-btn rounded-lg border border-border-passive px-sm py-1 text-caption transition-colors hover:bg-charcoal-4"
              title="Bullet list"
            >
              List
            </button>
          </div>

          <div
            ref={editorRef}
            className="notes-editor font-body text-body w-full flex-1 overflow-y-auto rounded-lg border border-border-passive bg-background-cream p-md text-text-charcoal outline-none ring-ring-blue transition-all focus-visible:ring-2"
            contentEditable
            spellCheck
            data-placeholder="Timestamps, hypotheses, citations..."
            role="textbox"
            aria-multiline="true"
            suppressHydrationWarning
            onBlur={() => void persist()}
            onKeyUp={onEditorInteraction}
            onMouseUp={onEditorInteraction}
          />

          <div className="flex items-center justify-end gap-sm pt-xs">
            <span className="text-caption mr-auto text-text-muted" aria-live="polite">
              {saveStatus}
            </span>
            <button
              type="button"
              onClick={() => void persist()}
              className="rounded-lg bg-primary px-md py-xs text-caption font-semibold text-off-white inset-button transition-opacity hover:opacity-90"
            >
              Save notes
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
