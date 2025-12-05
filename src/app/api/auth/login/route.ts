import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import bcrypt from "bcrypt";
import { loginSchema } from "@/lib/validators";
import { login as createSession } from "@/lib/session";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = loginSchema.parse(body);

    const user = await db.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const passwordsMatch = await bcrypt.compare(password, user.hashedPassword);

    if (!passwordsMatch) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const { hashedPassword, ...userWithoutPassword } = user;

    await createSession(userWithoutPassword);

    return NextResponse.json({ success: true, user: userWithoutPassword }, { status: 200 });

  } catch (error) {
    if (error instanceof require('zod').ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error("Login error:", error);
    return NextResponse.json({ error: "An internal server error occurred" }, { status: 500 });
  }
}
