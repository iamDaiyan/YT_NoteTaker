"use client";

import type { ApiVideoRow } from "@/components/VideoCard";
import { VideoCard } from "@/components/VideoCard";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { extractYouTubeId } from "@/lib/youtube";
import type { User } from "@supabase/supabase-js";
import { useCallback, useEffect, useMemo, useState } from "react";

const DEFAULT_VIDEOS = [
  { youtubeId: "F_7IPm7f1vI", title: "Atlas Goes Hands On" },
  { youtubeId: "29ECwExc-_M", title: "All New Atlas | Boston Dynamics" },
  { youtubeId: "fn3KWM1kuAw", title: "Do You Love Me?" },
];

type VideoRecord = {
  id: string;
  youtube_id: string;
  title: string;
  notes?: { html?: string | null } | Array<{ html?: string | null }> | null;
};

function noteHtml(notes: VideoRecord["notes"]) {
  if (!notes) return "";
  if (Array.isArray(notes)) return notes[0]?.html ?? "";
  return notes.html ?? "";
}

async function loadVideos(userId: string): Promise<ApiVideoRow[]> {
  const { data, error } = await supabase
    .from("videos")
    .select("id,youtube_id,title,notes(html)")
    .eq("user_id", userId)
    .order("sort_order", { ascending: true })
    .returns<VideoRecord[]>();

  if (error) throw error;

  if (data.length === 0) {
    const { error: seedError } = await supabase.from("videos").insert(
      DEFAULT_VIDEOS.map((entry, index) => ({
        user_id: userId,
        youtube_id: entry.youtubeId,
        title: entry.title,
        sort_order: index,
      }))
    );
    if (seedError) throw seedError;
    return loadVideos(userId);
  }

  return data.map((row) => ({
    id: row.id,
    youtubeId: row.youtube_id,
    title: row.title,
    html: noteHtml(row.notes),
  }));
}

export function LibraryApp() {
  const [user, setUser] = useState<User | null>(null);
  const [videos, setVideos] = useState<ApiVideoRow[]>([]);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadErr, setLoadErr] = useState<string | null>(null);

  const needle = filter.trim().toLowerCase();
  const filtered = useMemo(() => {
    if (!needle) return videos;
    return videos.filter((v) => v.title.toLowerCase().includes(needle));
  }, [videos, needle]);

  const bootstrap = useCallback(async () => {
    setLoading(true);
    setLoadErr(null);

    if (!isSupabaseConfigured) {
      setLoadErr("Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.");
      setLoading(false);
      return;
    }

    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      setLoadErr(sessionError.message);
      setLoading(false);
      return;
    }

    const sessionUser = sessionData.session?.user ?? null;
    if (!sessionUser) {
      window.location.href = "/login";
      return;
    }

    setUser(sessionUser);

    try {
      setVideos(await loadVideos(sessionUser.id));
    } catch (e) {
      setLoadErr(e instanceof Error ? e.message : "Could not load your Supabase library.");
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
    if (!user) return;

    const urlInput = window.prompt("Paste a YouTube URL or 11-character video ID:");
    const id = extractYouTubeId(urlInput ?? "");
    if (!id) {
      if (urlInput !== null) window.alert("Could not parse a valid YouTube video ID.");
      return;
    }
    if (videos.some((v) => v.youtubeId === id)) {
      window.alert("That video is already in your library.");
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

    const titleInput =
      window.prompt("Title for this entry:", titleGuess || "New reference")?.trim() || "Untitled";

    const { data, error } = await supabase
      .from("videos")
      .insert({
        user_id: user.id,
        youtube_id: id,
        title: titleInput,
        sort_order: videos.length,
      })
      .select("id,youtube_id,title")
      .single();

    if (error) {
      window.alert(error.message);
      return;
    }

    setVideos((prev) => [
      ...prev,
      { id: data.id as string, youtubeId: data.youtube_id as string, title: data.title as string, html: "" },
    ]);
  }

  async function onRemoved(idRemove: string) {
    const { error } = await supabase.from("videos").delete().eq("id", idRemove);
    if (error) {
      window.alert(error.message);
      return;
    }
    setVideos((prev) => prev.filter((x) => x.id !== idRemove));
  }

  async function onSaveHtml(id: string, html: string) {
    if (!user) return;

    const { error } = await supabase.from("notes").upsert(
      {
        video_id: id,
        user_id: user.id,
        html,
      },
      { onConflict: "video_id" }
    );

    if (error) throw error;
    setVideos((prev) => prev.map((v) => (v.id === id ? { ...v, html } : v)));
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    window.location.href = "/login";
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
              onClick={() => void handleSignOut()}
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
            Embed reference clips and capture notes in one place. Formatting saves to Supabase.
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

          {!loading && !loadErr ? (
            <div className="grid grid-cols-1 gap-xl">
              {filtered.map((row) => (
                <VideoCard key={row.id} video={row} onRemoved={(id) => void onRemoved(id)} onSaveHtml={onSaveHtml} />
              ))}
            </div>
          ) : null}

          {libraryEmpty && !loading && !loadErr ? (
            <p className="text-body rounded-2xl border border-dashed border-border-passive py-section-sm text-center text-text-muted">
              No videos yet. Use{" "}
              <strong className="font-semibold text-text-charcoal">Add video</strong> with a YouTube link.
            </p>
          ) : null}

          {!libraryEmpty && !loading && !loadErr && filtering && filtered.length === 0 ? (
            <p className="text-body py-xl text-center text-text-muted">No entries match your filter.</p>
          ) : null}
        </section>
      </main>
    </>
  );
}
