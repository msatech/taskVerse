"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";

export function MarketingHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <Logo />
        <nav className="ml-10 hidden items-center space-x-6 text-sm font-medium md:flex">
          <Link href="#features" className="text-foreground/60 transition-colors hover:text-foreground/80">
            Features
          </Link>
          <Link href="#" className="text-foreground/60 transition-colors hover:text-foreground/80">
            Pricing
          </Link>
          <Link href="#" className="text-foreground/60 transition-colors hover:text-foreground/80">
            Docs
          </Link>
        </nav>
        <div className="ml-auto flex items-center space-x-2">
          <ThemeToggle />
          <Button variant="ghost" asChild>
            <Link href="/login">Log in</Link>
          </Button>
          <Button asChild>
            <Link href="/signup">Sign Up</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
