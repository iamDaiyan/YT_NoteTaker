"use client";

import type { ApiVideoRow } from "@/components/VideoCard";
import { VideoCard } from "@/components/VideoCard";
import { extractYouTubeId } from "@/lib/youtube";
import { signOut } from "next-auth/react";
import { useCallback, useEffect, useMemo, useState } from "react";

const STORAGE_VIDEOS = "robo-inspo-videos";
const STORAGE_NOTES = "robo-inspo-notes";

const DEFAULT_VIDEOS: ApiVideoRow[] = [
  { id: "F_7IPm7f1vI", youtubeId: "F_7IPm7f1vI", title: "Atlas Goes Hands On", html: "" },
  { id: "29ECwExc-_M", youtubeId: "29ECwExc-_M", title: "All New Atlas | Boston Dynamics", html: "" },
  { id: "fn3KWM1kuAw", youtubeId: "fn3KWM1kuAw", title: "Do You Love Me?", html: "" },
];

async function refreshVideos(signal?: AbortSignal): Promise<ApiVideoRow[]> {
  const res = await fetch("/api/videos", { cache: "no-store", signal });
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error ?? "Failed to load library");
  }
  return (await res.json()) as ApiVideoRow[];
}

function isVideoRow(value: unknown): value is ApiVideoRow {
  return (
    typeof value === "object" &&
    value !== null &&
    "youtubeId" in value &&
    typeof value.youtubeId === "string" &&
    value.youtubeId.length === 11
  );
}

function loadLocalVideos(): ApiVideoRow[] {
  try {
    const rawVideos = localStorage.getItem(STORAGE_VIDEOS);
    const rawNotes = localStorage.getItem(STORAGE_NOTES);
    const parsedVideos = rawVideos ? (JSON.parse(rawVideos) as unknown) : null;
    const parsedNotes = rawNotes ? (JSON.parse(rawNotes) as Record<string, string>) : {};
    const base = Array.isArray(parsedVideos) && parsedVideos.length > 0 ? parsedVideos : DEFAULT_VIDEOS;

    return base.filter(isVideoRow).map((v) => ({
      id: v.id || v.youtubeId,
      youtubeId: v.youtubeId,
      title: typeof v.title === "string" ? v.title : "Untitled",
      html: typeof parsedNotes[v.youtubeId] === "string" ? parsedNotes[v.youtubeId] : v.html || "",
    }));
  } catch {
    return DEFAULT_VIDEOS;
  }
}

function saveLocalVideos(list: ApiVideoRow[]) {
  localStorage.setItem(
    STORAGE_VIDEOS,
    JSON.stringify(list.map(({ id, youtubeId, title }) => ({ id, youtubeId, title, html: "" })))
  );
}

function saveLocalNote(videoId: string, html: string) {
  const raw = localStorage.getItem(STORAGE_NOTES);
  const all = raw ? (JSON.parse(raw) as Record<string, string>) : {};
  all[videoId] = html;
  localStorage.setItem(STORAGE_NOTES, JSON.stringify(all));
}

export function LibraryApp() {
  const [videos, setVideos] = useState<ApiVideoRow[]>([]);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [usingLocalFallback, setUsingLocalFallback] = useState(false);

  const needle = filter.trim().toLowerCase();
  const filtered = useMemo(() => {
    if (!needle) return videos;
    return videos.filter((v) => v.title.toLowerCase().includes(needle));
  }, [videos, needle]);

  const bootstrap = useCallback(async () => {
    setLoading(true);
    setLoadErr(null);
    const ac = new AbortController();
    try {
      const data = await refreshVideos(ac.signal);
      setVideos(data);
      setUsingLocalFallback(false);
    } catch (e: unknown) {
      if ((e as { name?: string }).name !== "AbortError") {
        setUsingLocalFallback(true);
        setVideos(loadLocalVideos());
        setLoadErr(
          e instanceof Error
            ? `${e.message}. Using browser storage until PostgreSQL is configured.`
            : "Using browser storage until PostgreSQL is configured."
        );
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  const libraryEmpty = !loading && videos.length === 0;
  const filtering = filter.trim().length > 0;

  async function handleAddVideo() {
    const urlInput = window.prompt("Paste a YouTube URL or 11-character video ID:");
    const id = extractYouTubeId(urlInput ?? "");
    if (!id) {
      if (urlInput !== null) window.alert("Could not parse a valid YouTube video ID.");
      return;
    }

    let titleGuess = "";
    try {
      const o = await fetch(
        `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(
          `https://www.youtube.com/watch?v=${encodeURIComponent(id)}`
        )}`
      );
      if (o.ok) titleGuess = ((await o.json()) as { title?: string }).title ?? "";
    } catch {
      /* optional helper */
    }

    const promptDefault = titleGuess || "New reference";
    const titleInput =
      window.prompt("Title for this entry:", promptDefault)?.trim() || "Untitled";

    if (usingLocalFallback) {
      if (videos.some((v) => v.youtubeId === id)) {
        window.alert("That video is already in your library.");
        return;
      }
      const next = [...videos, { id, youtubeId: id, title: titleInput, html: "" }];
      setVideos(next);
      saveLocalVideos(next);
      return;
    }

    const res = await fetch("/api/videos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: id, title: titleInput }),
    });

    const data = (await res.json().catch(() => ({}))) as {
      error?: string;
    } & Partial<ApiVideoRow>;

    if (!res.ok) {
      window.alert(data.error ?? "Could not add video.");
      return;
    }

    if (data.id && data.youtubeId && data.title !== undefined && data.html !== undefined) {
      setVideos((prev) => [
        ...prev,
        {
          id: data.id as string,
          youtubeId: data.youtubeId as string,
          title: data.title as string,
          html: data.html ?? "",
        },
      ]);
      return;
    }

    window.location.reload();
  }

  function onRemoved(idRemove: string) {
    setVideos((prev) => {
      const next = prev.filter((x) => x.id !== idRemove);
      if (usingLocalFallback) saveLocalVideos(next);
      return next;
    });
  }

  function onSaveLocalHtml(id: string, html: string) {
    saveLocalNote(id, html);
    setVideos((prev) => prev.map((v) => (v.id === id ? { ...v, html } : v)));
  }

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-border-passive bg-background-cream">
        <nav className="mx-auto flex max-w-max-width flex-wrap items-center justify-between gap-md px-lg py-md">
          <div className="font-card-title text-card-title font-semibold tracking-tight text-text-charcoal">
            RoboMission Inspo
          </div>

          <div className="flex flex-1 items-center justify-end gap-sm sm:gap-md sm:flex-initial">
            <div className="relative hidden max-w-xs min-w-[10rem] flex-1 sm:block">
              <span
                className="material-symbols-outlined pointer-events-none absolute left-md top-1/2 -translate-y-1/2 text-xl text-text-muted"
                aria-hidden
              >
                search
              </span>
              <input
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                type="search"
                autoComplete="off"
                placeholder="Filter by title..."
                className="text-caption w-full rounded-lg border border-border-passive bg-surface-container-low py-xs pl-10 pr-md text-text-charcoal outline-none placeholder:text-text-muted ring-ring-blue transition-shadow focus:ring-2"
              />
            </div>

            <button
              type="button"
              onClick={() => void handleAddVideo()}
              className="text-caption whitespace-nowrap rounded-lg bg-primary px-md py-xs font-semibold text-off-white inset-button hover:opacity-90 sm:px-lg sm:py-md sm:text-body"
            >
              Add video
            </button>

            <button
              type="button"
              className="text-caption whitespace-nowrap rounded-lg border border-border-interactive px-md py-xs font-normal transition-colors hover:bg-charcoal-4 sm:py-md"
              title="Sign out"
              onClick={() => void signOut({ redirect: true, callbackUrl: "/login" })}
            >
              Sign out
            </button>
          </div>

          <div className="relative w-full sm:hidden">
            <span
              className="material-symbols-outlined pointer-events-none absolute left-md top-1/2 -translate-y-1/2 text-xl text-text-muted"
              aria-hidden
            >
              search
            </span>
            <input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              type="search"
              autoComplete="off"
              placeholder="Filter by title..."
              className="text-caption w-full rounded-lg border border-border-passive bg-surface-container-low py-xs pl-10 pr-md text-text-charcoal outline-none placeholder:text-text-muted ring-ring-blue focus:ring-2"
            />
          </div>
        </nav>
      </header>

      <main>
        <section className="mx-auto max-w-max-width px-lg pb-md pt-lg">
          <p className="font-body text-body-large max-w-2xl text-text-muted">
            Embed reference clips and capture notes in one place. Formatting saves to PostgreSQL behind your deployment.
          </p>
        </section>

        <section className="mx-auto max-w-max-width px-lg pb-section-lg">
          {loadErr ? (
            <p className="text-body rounded-2xl border border-dashed border-border-passive px-lg py-lg text-center text-text-muted">
              {loadErr}
            </p>
          ) : null}

          {loading ? (
            <p className="text-caption py-xl text-center text-text-muted">Loading your library...</p>
          ) : null}

          {!loading ? (
            <div className="grid grid-cols-1 gap-xl">
              {filtered.map((row) => (
                <VideoCard
                  key={row.id}
                  video={row}
                  onRemoved={onRemoved}
                  onSaveHtml={usingLocalFallback ? onSaveLocalHtml : undefined}
                />
              ))}
            </div>
          ) : null}

          {libraryEmpty && !loading ? (
            <p className="text-body rounded-2xl border border-dashed border-border-passive py-section-sm text-center text-text-muted">
              No videos yet. Use{" "}
              <strong className="font-semibold text-text-charcoal">Add video</strong> with a YouTube link.
            </p>
          ) : null}

          {!libraryEmpty && !loading && filtering && filtered.length === 0 ? (
            <p className="text-body py-xl text-center text-text-muted">No entries match your filter.</p>
          ) : null}
        </section>
      </main>
    </>
  );
}
