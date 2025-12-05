import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import type { User } from "@prisma/client";

const secretKey = process.env.SESSION_SECRET || "your-secret-key-that-is-long-enough";
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
    console.error("JWT Decryption Error:", error);
    return null;
  }
}

export async function login(user: Omit<User, 'hashedPassword'>) {
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const session = await encrypt({ user, expires });

  cookies().set("session", session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    expires,
    path: "/",
  });
}

export async function logout() {
  cookies().set("session", "", { expires: new Date(0) });
}

export async function getSession(): Promise<Omit<User, 'hashedPassword'> | null> {
  const sessionCookie = cookies().get("session")?.value;
  if (!sessionCookie) return null;

  const decryptedSession = await decrypt(sessionCookie);
  
  if (!decryptedSession || !decryptedSession.user) {
    return null;
  }

  // Check if session is expired
  if (new Date(decryptedSession.expires) < new Date()) {
    return null;
  }

  return decryptedSession.user as Omit<User, 'hashedPassword'>;
}
