import prisma from "@/lib/prisma";
import type { Session } from "next-auth";

export async function upsertSessionUser(
  session: Session | null
): Promise<{ email: string } | null> {
  const email = session?.user?.email;
  if (!email) return null;

  await prisma.user.upsert({
    where: { email },
    update: {
      name: session.user?.name ?? null,
      image: session.user?.image ?? null,
    },
    create: {
      email,
      name: session.user?.name ?? null,
      image: session.user?.image ?? null,
    },
  });

  return { email };
}
