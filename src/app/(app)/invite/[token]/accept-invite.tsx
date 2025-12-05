
'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { acceptInvitation } from "@/lib/actions";
import type { Invitation, Organization } from "@prisma/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

type AcceptInviteProps = {
    token: string;
    invitation: Invitation & { organization: Organization };
};

export function AcceptInvite({ token, invitation }: AcceptInviteProps) {
    const router = useRouter();
    const { toast } = useToast();
    const [status, setStatus] = useState<'pending' | 'success' | 'error'>('pending');
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    useEffect(() => {
        const handleAccept = async () => {
            const result = await acceptInvitation(token);
            if (result.success && result.redirectUrl) {
                toast({
                    title: "Invitation Accepted!",
                    description: `You have successfully joined ${invitation.organization.name}.`,
                });
                setStatus('success');
                // Use router.replace to avoid adding the invite page to history
                router.replace(result.redirectUrl);
                // Hard refresh to ensure all session/layout data is up-to-date
                router.refresh(); 
            } else {
                setErrorMessage(result.error || "Failed to accept invitation.");
                setStatus('error');
            }
        };

        handleAccept();
    }, [token, router, toast, invitation.organization.name]);


    return (
        <div className="flex-1 flex items-center justify-center p-8">
            {status === 'pending' && (
                <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                    <p className="mt-4 text-muted-foreground">Accepting your invitation to join <strong>{invitation.organization.name}</strong>...</p>
                </div>
            )}
            {status === 'success' && (
                 <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                    <p className="mt-4 text-muted-foreground">Redirecting you to your new workspace...</p>
                </div>
            )}
            {status === 'error' && (
                <Alert variant="destructive" className="max-w-md">
                    <AlertTitle>Error Accepting Invitation</AlertTitle>
                    <AlertDescription>
                        {errorMessage}
                        <div className="mt-4">
                            <Button onClick={() => router.push('/dashboard')}>Go to Dashboard</Button>
                        </div>
                    </AlertDescription>
                </Alert>
            )}
        </div>
    );
}
