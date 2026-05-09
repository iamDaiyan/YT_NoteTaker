/** Parse an 11-char YouTube id from pasted URL or raw id. */
export function extractYouTubeId(input: string): string | null {
  const trimmed = input.trim();
  const direct = /^[a-zA-Z0-9_-]{11}$/.exec(trimmed);
  if (direct) return direct[0];

  try {
    const u = new URL(trimmed);
    const host = u.hostname.replace(/^www\./, "");
    if (host === "youtu.be") {
      const p = u.pathname.split("/").filter(Boolean)[0];
      return p && /^[a-zA-Z0-9_-]{11}$/.test(p) ? p : null;
    }
    if (host === "youtube.com" || host === "m.youtube.com") {
      const v = u.searchParams.get("v");
      if (v && /^[a-zA-Z0-9_-]{11}$/.test(v)) return v;
      const embed = u.pathname.match(/^\/embed\/([a-zA-Z0-9_-]{11})/);
      if (embed?.[1]) return embed[1];
    }
  } catch {
    return null;
  }
  return null;
}

/** Privacy-enhanced embed URL with referrer-friendly params for Vercel. */
export function buildYouTubeEmbedUrl(videoId: string, originHint?: string): string {
  const base = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}`;
  const params = new URLSearchParams({
    rel: "0",
    modestbranding: "1",
    playsinline: "1",
    enablejsapi: "1",
  });
  const origin =
    originHint ??
    (typeof window !== "undefined" && /^https?:$/i.exec(window.location.protocol)
      ? window.location.origin
      : "");
  if (origin) params.set("origin", origin);
  return `${base}?${params.toString()}`;
}
