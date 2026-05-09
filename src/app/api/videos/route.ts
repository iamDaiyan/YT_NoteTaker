import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { sanitizeNoteHtml } from "@/lib/sanitize-html";
import { DEFAULT_VIDEOS_SEED } from "@/lib/seed-defaults";
import { upsertSessionUser } from "@/lib/user";
import { extractYouTubeId } from "@/lib/youtube";

function backendUnavailable(error: unknown) {
  console.error("Video library backend unavailable", error);
  return Response.json(
    {
      error:
        "PostgreSQL is not configured or is unreachable. Set DATABASE_URL and run Prisma migrations for persistent storage",
    },
    { status: 503 }
  );
}

async function seedDefaultsIfNeeded(userEmail: string) {
  const count = await prisma.video.count({ where: { userEmail } });
  if (count > 0) return;

  await prisma.video.createMany({
    data: DEFAULT_VIDEOS_SEED.map((entry, idx) => ({
      userEmail,
      youtubeId: entry.youtubeId,
      title: entry.title,
      sortOrder: idx,
    })),
  });
}

async function serializeVideos(userEmail: string) {
  const rows = await prisma.video.findMany({
    where: { userEmail },
    orderBy: { sortOrder: "asc" },
    include: { note: true },
  });
  return rows.map((v) => ({
    id: v.id,
    youtubeId: v.youtubeId,
    title: v.title,
    html: sanitizeNoteHtml(v.note?.html ?? ""),
  }));
}

export async function GET() {
  try {
    const session = await auth();
    const identity = await upsertSessionUser(session);
    if (!identity) return Response.json({ error: "Unauthorized" }, { status: 401 });

    await seedDefaultsIfNeeded(identity.email);
    return Response.json(await serializeVideos(identity.email));
  } catch (error) {
    return backendUnavailable(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    const identity = await upsertSessionUser(session);
    if (!identity) return Response.json({ error: "Unauthorized" }, { status: 401 });

    let body: { url?: string; title?: string };
    try {
      body = (await request.json()) as typeof body;
    } catch {
      return Response.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const id = extractYouTubeId(body.url ?? "");
    if (!id) return Response.json({ error: "Invalid YouTube URL or id" }, { status: 400 });

    const title = typeof body.title === "string" && body.title.trim() ? body.title.trim() : "Untitled";

    const existing = await prisma.video.findFirst({
      where: { userEmail: identity.email, youtubeId: id },
    });
    if (existing)
      return Response.json({ error: "That video is already in your library." }, { status: 409 });

    const last = await prisma.video.findFirst({
      where: { userEmail: identity.email },
      orderBy: { sortOrder: "desc" },
      select: { sortOrder: true },
    });
    const sortOrder = (last?.sortOrder ?? -1) + 1;

    const row = await prisma.video.create({
      data: {
        userEmail: identity.email,
        youtubeId: id,
        title,
        sortOrder,
      },
      include: { note: true },
    });

    return Response.json({
      id: row.id,
      youtubeId: row.youtubeId,
      title: row.title,
      html: "",
    });
  } catch (error) {
    return backendUnavailable(error);
  }
}
