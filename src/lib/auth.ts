import { cookies } from "next/headers";
import { prisma } from "./db";

const COOKIE_NAME = "hh_session";

export interface SessionUser {
  id: string;
  name: string;
  role: "parent" | "viewer";
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(COOKIE_NAME);
  if (!sessionCookie?.value) return null;

  try {
    const parsed = JSON.parse(
      Buffer.from(sessionCookie.value, "base64").toString()
    );
    const user = await prisma.user.findUnique({ where: { id: parsed.id } });
    if (!user) return null;
    return { id: user.id, name: user.name, role: user.role as "parent" | "viewer" };
  } catch {
    return null;
  }
}

export function createSessionToken(user: SessionUser): string {
  return Buffer.from(JSON.stringify(user)).toString("base64");
}

export async function login(
  passcode: string
): Promise<{ user: SessionUser; token: string } | null> {
  const user = await prisma.user.findFirst({ where: { passcode } });
  if (!user) return null;

  const sessionUser: SessionUser = {
    id: user.id,
    name: user.name,
    role: user.role as "parent" | "viewer",
  };
  return { user: sessionUser, token: createSessionToken(sessionUser) };
}

export { COOKIE_NAME };
