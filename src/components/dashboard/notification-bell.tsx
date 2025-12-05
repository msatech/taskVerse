
'use client';

import { useState, useEffect } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Button } from '../ui/button';
import { Bell, BellRing } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { useRouter } from 'next/navigation';
import type { Invitation, Notification } from '@prisma/client';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

type NotificationWithUser = Notification & { user: { name: string | null; avatarUrl: string | null } };

type NotificationBellProps = {
    initialNotifications: NotificationWithUser[];
    invitations: Invitation[];
};

export function NotificationBell({ initialNotifications, invitations }: NotificationBellProps) {
    const [notifications, setNotifications] = useState(initialNotifications);
    const [isOpen, setIsOpen] = useState(false);
    const router = useRouter();
    const { toast } = useToast();

    const unreadCount = notifications.filter(n => !n.read).length + invitations.length;

    const handleOpenChange = async (open: boolean) => {
        setIsOpen(open);
        if (open && unreadCount > 0) {
            // Mark notifications as read
            try {
                await fetch('/api/notifications', { method: 'POST' });
                // Optimistically update the UI
                setNotifications(notifications.map(n => ({ ...n, read: true })));
            } catch (error) {
                console.error("Failed to mark notifications as read", error);
            }
        }
    };

    const handleNotificationClick = (notification: Notification) => {
        setIsOpen(false);
        router.push(notification.url);
    };
    
    const handleInvitationClick = (invitation: Invitation) => {
        setIsOpen(false);
        router.push(`/invite/${invitation.token}`);
    };

    const handleClearAll = async () => {
         try {
            await fetch('/api/notifications', { method: 'DELETE' });
            setNotifications([]);
            toast({ title: "Notifications cleared" });
        } catch (error) {
            console.error("Failed to clear notifications", error);
            toast({ variant: 'destructive', title: "Error", description: "Could not clear notifications." });
        }
    }
    
    const avatarPlaceholder = PlaceHolderImages.find(img => img.id === 'user-avatar');

    return (
        <Popover open={isOpen} onOpenChange={handleOpenChange}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    <span className="sr-only">Notifications</span>
                    {unreadCount > 0 && <span className="absolute top-1 right-1 flex h-2.5 w-2.5 rounded-full bg-primary ring-2 ring-background" />}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
                <div className="flex items-center justify-between p-4 border-b">
                    <h3 className="font-semibold">Notifications</h3>
                    {notifications.length > 0 && (
                        <Button variant="link" size="sm" className="h-auto p-0" onClick={handleClearAll}>
                            Clear all
                        </Button>
                    )}
                </div>
                <ScrollArea className="h-96">
                    {invitations.length === 0 && notifications.length === 0 ? (
                        <div className="p-8 text-center text-sm text-muted-foreground">
                            <BellRing className="mx-auto h-8 w-8 mb-2" />
                            You have no new notifications.
                        </div>
                    ) : (
                        <div className="divide-y">
                            {invitations.map(invite => (
                                <div key={invite.id} className="p-4 hover:bg-muted/50 cursor-pointer" onClick={() => handleInvitationClick(invite)}>
                                    <div className="flex items-start gap-3">
                                        <div className="flex-1 space-y-1">
                                            <p className="text-sm font-medium">You have an invitation to join <strong>{invite.organizationName || 'an organization'}</strong>.</p>
                                            <p className="text-xs text-blue-500">Click to respond</p>
                                        </div>
                                         <span className="h-2 w-2 rounded-full bg-primary mt-1.5" />
                                    </div>
                                </div>
                            ))}
                            {notifications.map(notification => (
                                <div
                                    key={notification.id}
                                    className={cn("p-4 hover:bg-muted/50 cursor-pointer", !notification.read && "bg-blue-500/10")}
                                    onClick={() => handleNotificationClick(notification)}
                                >
                                    <div className="flex items-start gap-3">
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage src={notification.user?.avatarUrl || avatarPlaceholder?.imageUrl} />
                                            <AvatarFallback>{notification.user?.name?.[0]}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 space-y-1">
                                            <p className="text-sm" dangerouslySetInnerHTML={{ __html: notification.message }} />
                                            <p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}</p>
                                        </div>
                                        {!notification.read && <span className="h-2 w-2 rounded-full bg-primary mt-1.5" />}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </PopoverContent>
        </Popover>
    );
}

// Add organizationName to Invitation type for display
declare module "@prisma/client" {
  interface Invitation {
    organizationName?: string;
  }
}

// Fetch org name on the client for invitations to avoid changing server component props
// This is a simple workaround. A better solution might involve a dedicated API endpoint for notifications.
export function useInvitationsWithOrgNames(invitations: Invitation[]) {
  const [invites, setInvites] = useState(invitations);
  // This part is tricky without a dedicated API. We'll rely on the parent component to pass the name for now.
  // For a real app, you'd fetch this.
  return invites;
}
