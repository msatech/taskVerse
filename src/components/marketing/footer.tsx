import { Logo } from "@/components/logo";

export function MarketingFooter() {
  return (
    <footer className="bg-secondary">
      <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row">
        <Logo />
        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} TaskVerse. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
