
import { notFound, redirect } from "next/navigation";
import db from "@/lib/db";
import { getSession } from "@/lib/session";
import { AcceptInvite } from "./accept-invite";
import Link from "next/link";
import { Button } from "@/components/ui/button";

type InvitePageProps = {
    params: {
        token: string;
    }
}

export default async function InvitePage({ params }: InvitePageProps) {
    const { token } = params;
    
    const invitation = await db.invitation.findUnique({
        where: { token, expires: { gt: new Date() } },
        include: {
            organization: true
        }
    });

    if (!invitation) {
        return notFound();
    }

    const user = await getSession();

    if (user?.email === invitation.email) {
        // User is logged in and their email matches the invite.
        // We can proceed to accept it.
        return <AcceptInvite token={token} invitation={invitation} />;
    }
    
    // User is not logged in, or is logged in with a different email.
    // We should prompt them to log in with the correct email.
    return (
         <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center">
                <h1 className="text-2xl font-bold">You've been invited!</h1>
                <p className="text-muted-foreground mt-2">
                    You have been invited to join the <strong>{invitation.organization.name}</strong> organization.
                </p>
                <p className="mt-4">
                    Please log in with the email <strong className="text-primary">{invitation.email}</strong> to accept your invitation.
                </p>
                <div className="mt-6 flex items-center justify-center gap-4">
                     <Button asChild>
                         <Link href="/login">Log In</Link>
                     </Button>
                     <Button asChild variant="outline">
                         <Link href="/signup">Sign Up</Link>
                     </Button>
                </div>
            </div>
        </div>
    )

}
