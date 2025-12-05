import Image from "next/image";
import Link from "next/link";
import { ArrowRight, GanttChart, ListTodo, Presentation, Waypoints } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PlaceHolderImages } from "@/lib/placeholder-images";

const features = [
  {
    icon: <Presentation className="h-8 w-8 text-primary" />,
    title: "Project and Issue Management",
    description: "Create, manage, and track projects, issues (stories, tasks, bugs, epics), and sprints.",
    image: PlaceHolderImages.find(img => img.id === 'feature-board')
  },
  {
    icon: <ListTodo className="h-8 w-8 text-primary" />,
    title: "Backlog and Board Views",
    description: "Kanban and Scrum board views with drag-and-drop functionality for managing issues.",
    image: PlaceHolderImages.find(img => img.id === 'feature-backlog')
  },
  {
    icon: <GanttChart className="h-8 w-8 text-primary" />,
    title: "Reports and Analytics",
    description: "Basic reports including burndown chart for active sprint and issues by status.",
    image: PlaceHolderImages.find(img => img.id === 'feature-analytics')
  },
  {
    icon: <Waypoints className="h-8 w-8 text-primary" />,
    title: "Intelligent Issue Tagging",
    description: "Use generative AI to automatically suggest tags for new issues based on their description.",
    image: {
      imageUrl: "https://picsum.photos/seed/ai-feature/600/400",
      imageHint: "AI abstract"
    }
  },
];

export default function HomePage() {
  const heroImage = PlaceHolderImages.find(img => img.id === 'hero');

  return (
    <div className="flex-1">
      <section className="relative bg-background">
        <div className="container mx-auto px-4 py-20 text-center lg:py-32">
          <h1 className="font-headline text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl lg:text-7xl">
            The Future of Work Management is Here
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl">
            TaskVerse is a modern, Jira-style project management platform designed for teams that want power, performance, and a beautiful interface.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Button asChild size="lg">
              <Link href="/signup">
                Get Started <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button asChild variant="link" size="lg">
              <Link href="#features">Learn More <span aria-hidden="true">→</span></Link>
            </Button>
          </div>
        </div>
        {heroImage && (
          <div className="container mx-auto px-4 pb-20">
            <div className="relative aspect-[16/9] overflow-hidden rounded-2xl shadow-2xl">
              <Image 
                src={heroImage.imageUrl} 
                alt={heroImage.description}
                fill
                className="object-cover"
                data-ai-hint={heroImage.imageHint}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
            </div>
          </div>
        )}
      </section>

      <section id="features" className="py-24 sm:py-32 bg-secondary">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-headline text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Everything you need to ship</h2>
            <p className="mt-6 text-lg leading-8 text-muted-foreground">
              Powerful features that give you the flexibility to manage projects your way, without the clutter.
            </p>
          </div>
          <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-2">
            {features.map((feature) => (
              <Card key={feature.title} className="flex flex-col overflow-hidden">
                <CardHeader>
                  <div className="flex items-center gap-4">
                    {feature.icon}
                    <CardTitle className="font-headline text-2xl">{feature.title}</CardTitle>
                  </div>
                  <CardDescription className="pt-2">{feature.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                  {feature.image && (
                    <div className="relative aspect-video overflow-hidden rounded-lg">
                      <Image 
                        src={feature.image.imageUrl} 
                        alt={feature.title}
                        fill
                        className="object-cover"
                        data-ai-hint={feature.image.imageHint}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 sm:py-32">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-headline text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Ready to dive in?</h2>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-muted-foreground">
            Start managing your projects with more power and less friction today.
          </p>
          <div className="mt-10">
            <Button asChild size="lg">
              <Link href="/signup">
                Create your first project <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
