
import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import bcrypt from "bcrypt";
import { signupSchema } from "@/lib/validators";
import { login as createSession } from "@/lib/session";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password } = signupSchema.parse(body);

    const existingUser = await db.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json({ error: "User with this email already exists" }, { status: 409 });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const orgSlug = `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-org`;

    const user = await db.$transaction(async (prisma) => {
      const newUser = await prisma.user.create({
        data: {
          name,
          email,
          hashedPassword,
        },
      });

      const organization = await prisma.organization.create({
        data: {
          name: `${name}'s Organization`,
          slug: orgSlug,
          ownerId: newUser.id,
        },
      });

      await prisma.organizationMember.create({
        data: {
          organizationId: organization.id,
          userId: newUser.id,
          role: "OWNER",
        },
      });

      return newUser;
    });

    const { hashedPassword: _, ...userWithoutPassword } = user;

    await createSession(userWithoutPassword);

    return NextResponse.json({ success: true, user: userWithoutPassword }, { status: 201 });

  } catch (error) {
    if (error instanceof require('zod').ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error("Signup error:", error);
    return NextResponse.json({ error: "An internal server error occurred" }, { status: 500 });
  }
}
