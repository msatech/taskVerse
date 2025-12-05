'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Project, Organization, OrganizationMember, User as PrismaUser, Invitation } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { inviteMemberSchema, type InviteMemberFormValues } from "@/lib/validators";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { useTransition } from "react";
import { inviteMember, updateMemberRole, removeMember } from "@/lib/actions";
import { useToast } from "@/hooks/use-toast";
import { Loader2, UserPlus, Clock, Trash2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatDistanceToNow } from "date-fns";
import { useRouter } from "next/navigation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

type MemberWithUser = OrganizationMember & { user: PrismaUser };

type SettingsTabsProps = {
    project: Project & { lead: PrismaUser };
    organization: Organization & { invitations: Invitation[] };
    members: MemberWithUser[];
    currentUserRole: string;
}

export function SettingsTabs({ project, organization, members, currentUserRole }: SettingsTabsProps) {
    const avatarPlaceholder = PlaceHolderImages.find((img) => img.id === "user-avatar");
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();
    const router = useRouter();

    const form = useForm<InviteMemberFormValues>({
        resolver: zodResolver(inviteMemberSchema),
        defaultValues: {
            email: "",
            organizationId: organization.id,
        },
    });

    async function onSubmit(data: InviteMemberFormValues) {
        startTransition(async () => {
            const result = await inviteMember(data);
            if (result.success) {
                toast({ title: "Success", description: result.message });
                form.reset();
                router.refresh();
            } else {
                toast({ variant: "destructive", title: "Error", description: result.error });
            }
        });
    }

    const handleRoleChange = (memberId: string, role: string) => {
        startTransition(async () => {
             const result = await updateMemberRole(memberId, role);
             if (result.success) {
                toast({ title: "Success", description: "Member role updated." });
                router.refresh();
            } else {
                toast({ variant: "destructive", title: "Error", description: result.error });
            }
        });
    }

    const handleRemoveMember = (memberId: string) => {
         startTransition(async () => {
             const result = await removeMember(memberId);
             if (result.success) {
                toast({ title: "Success", description: "Member removed from organization." });
                router.refresh();
            } else {
                toast({ variant: "destructive", title: "Error", description: result.error });
            }
        });
    }

    const canManageMembers = ['OWNER', 'ADMIN'].includes(currentUserRole);

    return (
        <Tabs defaultValue="general">
            <TabsList>
                <TabsTrigger value="general">General</TabsTrigger>
                <TabsTrigger value="members">Members</TabsTrigger>
                <TabsTrigger value="danger">Danger Zone</TabsTrigger>
            </TabsList>
            <TabsContent value="general">
                <Card>
                    <CardHeader>
                        <CardTitle>General Settings</CardTitle>
                        <CardDescription>Manage your project details and configuration.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="projectName">Project Name</Label>
                            <Input id="projectName" defaultValue={project.name} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="projectKey">Project Key</Label>
                            <Input id="projectKey" defaultValue={project.key} disabled />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="projectLead">Project Lead</Label>
                             <Select defaultValue={project.leadId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select project lead" />
                                </SelectTrigger>
                                <SelectContent>
                                    {members.map(member => (
                                        <SelectItem key={member.userId} value={member.userId}>{member.user.name}</SelectItem>
                                    ))}
                                </SelectContent>
                             </Select>
                        </div>
                        <Button>Save Changes</Button>
                    </CardContent>
                </Card>
            </TabsContent>
            <TabsContent value="members" className="space-y-6">
                {canManageMembers && (
                     <Card>
                        <CardHeader>
                            <CardTitle>Invite New Member</CardTitle>
                             <CardDescription>Invite a new member to join the '{organization.name}' organization.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="flex items-start gap-4">
                                    <FormField
                                        control={form.control}
                                        name="email"
                                        render={({ field }) => (
                                            <FormItem className="flex-1">
                                                 <Label htmlFor="email" className="sr-only">Email</Label>
                                                <FormControl>
                                                    <Input id="email" placeholder="new.member@example.com" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <Button type="submit" disabled={isPending}>
                                        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                                        <span>Invite</span>
                                    </Button>
                                </form>
                            </Form>
                        </CardContent>
                     </Card>
                )}
               
                <Card>
                    <CardHeader>
                        <CardTitle>Organization Members</CardTitle>
                        <CardDescription>Manage who has access to this project's organization.</CardDescription>
                    </CardHeader>
                     <CardContent>
                         <Table>
                            <TableHeader>
                                <TableRow>
                                <TableHead>Member</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {members.map(member => (
                                    <TableRow key={member.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-4">
                                                <Avatar className="h-9 w-9">
                                                    <AvatarImage src={member.user.avatarUrl || avatarPlaceholder?.imageUrl} />
                                                    <AvatarFallback>{member.user.name?.[0].toUpperCase()}</AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="font-medium">{member.user.name}</p>
                                                    <p className="text-sm text-muted-foreground">{member.user.email}</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {canManageMembers && member.user.id !== organization.ownerId ? (
                                                 <Select defaultValue={member.role} onValueChange={(role) => handleRoleChange(member.id, role)} disabled={isPending}>
                                                    <SelectTrigger className="w-[120px]">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="ADMIN">Admin</SelectItem>
                                                        <SelectItem value="MEMBER">Member</SelectItem>
                                                    </SelectContent>
                                                 </Select>
                                            ) : (
                                                <span className="text-sm capitalize">{member.role.toLowerCase()}</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                             {canManageMembers && member.user.id !== organization.ownerId && (
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button variant="outline" size="icon" disabled={isPending}>
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            This will permanently remove <strong>{member.user.name}</strong> from the organization. They will lose access to all projects.
                                                        </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => handleRemoveMember(member.id)} className="bg-destructive hover:bg-destructive/90">
                                                            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Remove"}
                                                        </AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                             )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                     </CardContent>
                </Card>

                 {canManageMembers && organization.invitations.length > 0 && (
                     <Card>
                        <CardHeader>
                            <CardTitle>Pending Invitations</CardTitle>
                            <CardDescription>These people have been invited but have not yet joined.</CardDescription>
                        </CardHeader>
                        <CardContent>
                             <Table>
                                <TableHeader>
                                    <TableRow>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Expires</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {organization.invitations.map(invite => (
                                        <TableRow key={invite.id}>
                                            <TableCell>
                                                <p className="font-medium">{invite.email}</p>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                    <Clock className="h-4 w-4" />
                                                    <span>Expires {formatDistanceToNow(new Date(invite.expires), { addSuffix: true })}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="outline" size="sm">Resend</Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                )}
            </TabsContent>
            <TabsContent value="danger">
                 <Card className="border-destructive">
                    <CardHeader>
                        <CardTitle className="text-destructive">Danger Zone</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                       <div className="p-4 rounded-md border border-destructive/50 bg-destructive/5">
                            <h4 className="font-semibold">Delete Project</h4>
                            <p className="text-sm text-muted-foreground mt-1">
                                Permanently delete this project, its issues, and all associated data. This action cannot be undone.
                            </p>
                             <Button variant="destructive" className="mt-4">Delete Project</Button>
                       </div>
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
    );
}
