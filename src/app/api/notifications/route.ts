
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import db from "@/lib/db";

export async function GET(request: NextRequest) {
    const user = await getSession();
    if (!user) {
        return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    try {
        const notifications = await db.notification.findMany({
            where: {
                userId: user.id,
            },
            orderBy: {
                createdAt: 'desc',
            },
            take: 20,
        });

        return NextResponse.json(notifications);
    } catch (error) {
        console.error("Failed to fetch notifications:", error);
        return NextResponse.json({ error: "An internal server error occurred" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    const user = await getSession();
    if (!user) {
        return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    try {
        await db.notification.updateMany({
            where: {
                userId: user.id,
                read: false,
            },
            data: {
                read: true,
            },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to mark notifications as read:", error);
        return NextResponse.json({ error: "An internal server error occurred" }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    const user = await getSession();
    if (!user) {
        return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    try {
        await db.notification.deleteMany({
            where: {
                userId: user.id,
            },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to clear notifications:", error);
        return NextResponse.json({ error: "An internal server error occurred" }, { status: 500 });
    }
}
