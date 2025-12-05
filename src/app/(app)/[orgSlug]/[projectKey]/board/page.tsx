
import { notFound } from "next/navigation";
import db from "@/lib/db";
import { BoardView } from "@/components/board/board-view";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Calendar, Users } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type ProjectBoardPageProps = {
    params: {
        orgSlug: string;
        projectKey: string;
    }
}

export default async function ProjectBoardPage({ params }: ProjectBoardPageProps) {
    const project = await db.project.findFirst({
        where: {
            key: params.projectKey,
            organization: {
                slug: params.orgSlug
            }
        },
        include: {
            statuses: {
                orderBy: { order: 'asc' }
            },
            issues: {
                include: {
                    assignee: true,
                    reporter: true,
                    status: true,
                    _count: {
                        select: { comments: true }
                    }
                },
                orderBy: {
                    createdAt: 'desc' // This ordering can be more sophisticated (e.g., rank)
                }
            },
            organization: {
                include: {
                    members: {
                        include: {
                            user: true,
                        }
                    }
                }
            }
        }
    });

    if (!project) {
        notFound();
    }

    const projectUsers = project.organization.members.map(member => member.user);
    const avatarPlaceholder = PlaceHolderImages.find(img => img.id === 'user-avatar');


    return (
        <div className="flex flex-col h-full">
            <header className="p-4 pt-6 md:p-8 space-y-4">
                 <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Projects</span>
                    <span className="text-sm text-muted-foreground">/</span>
                    <span className="text-sm font-medium">{project.name}</span>
                </div>
                <h1 className="font-headline text-3xl font-bold tracking-tight">{project.name}</h1>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>{format(new Date(project.createdAt), "MMMM d, yyyy")} - {format(new Date(project.createdAt), "MMMM d, yyyy")}</span>
                    </div>
                     <div className="flex items-center gap-2">
                        <span className="font-semibold">Status:</span>
                        <Select defaultValue="IN_PROGRESS">
                            <SelectTrigger className="h-auto p-1 text-sm border-none bg-transparent">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                                <SelectItem value="COMPLETED">Completed</SelectItem>
                                <SelectItem value="ON_HOLD">On Hold</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                     <div className="flex items-center gap-2">
                         <span className="font-semibold">Assignees:</span>
                         <div className="flex items-center -space-x-2">
                             {projectUsers.slice(0,3).map(user => (
                                 <TooltipProvider key={user.id}>
                                     <Tooltip>
                                         <TooltipTrigger>
                                             <Avatar className="h-6 w-6 border-2 border-background">
                                                 <AvatarImage src={user.avatarUrl || avatarPlaceholder?.imageUrl} />
                                                 <AvatarFallback>{user.name?.[0]}</AvatarFallback>
                                             </Avatar>
                                         </TooltipTrigger>
                                         <TooltipContent>{user.name}</TooltipContent>
                                     </Tooltip>
                                 </TooltipProvider>
                             ))}
                             {projectUsers.length > 3 && (
                                <Avatar className="h-6 w-6 border-2 border-background">
                                    <AvatarFallback>+{projectUsers.length - 3}</AvatarFallback>
                                </Avatar>
                             )}
                         </div>
                    </div>
                </div>
            </header>
            <main className="flex-1 overflow-x-auto p-4 md:p-8 pt-0">
                <BoardView project={project} statuses={project.statuses} issues={project.issues} users={projectUsers} />
            </main>
        </div>
    );
}
