import { cn } from "@/lib/utils";

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={cn(
        "inline-block h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin",
        className,
      )}
    />
  );
}
