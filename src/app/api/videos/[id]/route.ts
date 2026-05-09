import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { sanitizeNoteHtml } from "@/lib/sanitize-html";
import { upsertSessionUser } from "@/lib/user";

type P = Promise<{ id: string }>;

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

export async function PATCH(request: Request, context: { params: P }) {
  try {
    const session = await auth();
    const identity = await upsertSessionUser(session);
    if (!identity) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const { id: videoId } = await context.params;

    let body: { html?: string };
    try {
      body = (await request.json()) as typeof body;
    } catch {
      return Response.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const html = typeof body.html === "string" ? sanitizeNoteHtml(body.html) : "";

    const owned = await prisma.video.findFirst({
      where: { id: videoId, userEmail: identity.email },
    });
    if (!owned) return Response.json({ error: "Not found" }, { status: 404 });

    await prisma.note.upsert({
      where: { videoId },
      update: { html },
      create: { videoId, html },
    });

    return Response.json({ ok: true });
  } catch (error) {
    return backendUnavailable(error);
  }
}

export async function DELETE(_request: Request, context: { params: P }) {
  try {
    const session = await auth();
    const identity = await upsertSessionUser(session);
    if (!identity) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await context.params;

    const deleted = await prisma.video.deleteMany({
      where: { id, userEmail: identity.email },
    });

    if (deleted.count === 0) return Response.json({ error: "Not found" }, { status: 404 });

    return Response.json({ ok: true });
  } catch (error) {
    return backendUnavailable(error);
  }
}
