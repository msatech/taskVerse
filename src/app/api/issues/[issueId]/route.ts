
import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { getSession } from "@/lib/session";

export async function GET(
  request: NextRequest,
  { params }: { params: { issueId: string } }
) {
  try {
    const user = await getSession();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const issueId = params.issueId;

    const issue = await db.issue.findUnique({
      where: { id: issueId },
      include: {
        status: true,
        reporter: true,
        assignee: true,
        project: {
          select: {
            organizationId: true,
          },
        },
        comments: {
          include: {
            author: true,
          },
          orderBy: {
            createdAt: 'asc'
          }
        },
      },
    });

    if (!issue) {
      return NextResponse.json({ error: "Issue not found" }, { status: 404 });
    }

    // Authorization check
    const orgMember = await db.organizationMember.findFirst({
        where: {
            userId: user.id,
            organizationId: issue.project.organizationId
        }
    });

    if (!orgMember) {
        return NextResponse.json({ error: "Not authorized to view this issue" }, { status: 403 });
    }

    return NextResponse.json(issue, { status: 200 });
  } catch (error) {
    console.error("Failed to fetch issue details:", error);
    return NextResponse.json(
      { error: "An internal server error occurred" },
      { status: 500 }
    );
  }
}
