
import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { getSession } from "@/lib/session";

export async function GET(request: NextRequest) {
  try {
    const user = await getSession();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const firstOrgMembership = await db.organizationMember.findFirst({
        where: { userId: user.id },
        include: {
            organization: true
        },
        orderBy: {
            createdAt: 'asc'
        }
    });

    if (!firstOrgMembership || !firstOrgMembership.organization) {
        return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }
    
    return NextResponse.json(firstOrgMembership.organization, { status: 200 });

  } catch (error) {
    console.error("Failed to fetch user organization:", error);
    return NextResponse.json(
      { error: "An internal server error occurred" },
      { status: 500 }
    );
  }
}
