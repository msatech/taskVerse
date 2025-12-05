import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import type { User } from "@prisma/client";

const secretKey = process.env.SESSION_SECRET || "your-secret-key";
const key = new TextEncoder().encode(secretKey);

export async function encrypt(payload: any) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("1d") // 1 day
    .sign(key);
}

export async function decrypt(input: string): Promise<any> {
  try {
    const { payload } = await jwtVerify(input, key, {
      algorithms: ["HS256"],
    });
    return payload;
  } catch (error) {
    // This can happen if the token is invalid or expired
    return null;
  }
}

export async function login(user: Omit<User, 'hashedPassword'>) {
  const session = await encrypt({ user, expires: new Date(Date.now() + 24 * 60 * 60 * 1000) });
  const cookieStore = cookies();
  cookieStore.set("session", session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24, // 1 day
    path: "/",
  });
}

export async function logout() {
  const cookieStore = cookies();
  cookieStore.set("session", "", { expires: new Date(0) });
}

export async function getSession() {
  const cookieStore = cookies();
  const sessionCookie = cookieStore.get("session")?.value;
  if (!sessionCookie) return null;

  const decryptedSession = await decrypt(sessionCookie);
  if (!decryptedSession) return null;

  return decryptedSession.user as Omit<User, 'hashedPassword'>;
}
