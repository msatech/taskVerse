
import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { getSession } from "@/lib/session";

export async function GET(request: NextRequest) {
  try {
    const user = await getSession();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Get the user's most recently joined organization
    const mostRecentOrgMembership = await db.organizationMember.findFirst({
        where: { userId: user.id },
        include: {
            organization: true
        },
        orderBy: {
            createdAt: 'desc'
        }
    });

    if (!mostRecentOrgMembership || !mostRecentOrgMembership.organization) {
        // This can happen for a brand new user who just signed up
        // It's not necessarily an error, just means they have no orgs yet.
        return NextResponse.json(null, { status: 200 });
    }
    
    return NextResponse.json(mostRecentOrgMembership.organization, { status: 200 });

  } catch (error) {
    console.error("Failed to fetch user organization:", error);
    return NextResponse.json(
      { error: "An internal server error occurred" },
      { status: 500 }
    );
  }
}
