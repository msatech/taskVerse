import { Layers2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Layers2 className="h-6 w-6 text-primary" />
      <span className="font-headline text-xl font-semibold">TaskVerse</span>
    </div>
  );
}
