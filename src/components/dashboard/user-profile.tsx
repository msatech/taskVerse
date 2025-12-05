
"use client";

import type { Invitation, User } from "@prisma/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import Link from "next/link";
import { Badge } from "../ui/badge";

type UserProfileProps = {
  user: Pick<User, "name" | "email" | "avatarUrl">;
  invitations: Invitation[];
};

export function UserProfile({ user, invitations }: UserProfileProps) {
  const avatar = PlaceHolderImages.find((img) => img.id === "user-avatar");
  const fallback = user.name
    ? user.name.charAt(0).toUpperCase()
    : user.email.charAt(0).toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full relative">
          <Avatar>
            <AvatarImage
              src={user.avatarUrl || avatar?.imageUrl}
              data-ai-hint={avatar?.imageHint}
            />
            <AvatarFallback>{fallback}</AvatarFallback>
          </Avatar>
           {invitations.length > 0 && <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-primary ring-2 ring-background" />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.name}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
         {invitations.length > 0 && (
          <>
            <DropdownMenuItem asChild>
              <Link href={`/invite/${invitations[0].token}`} className="flex items-center justify-between">
                <span>Invitations</span>
                <Badge>{invitations.length}</Badge>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuItem asChild>
          <Link href="/profile">Profile</Link>
        </DropdownMenuItem>
        <DropdownMenuItem>Billing</DropdownMenuItem>
        <DropdownMenuItem>Settings</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/api/auth/logout">Log out</Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
