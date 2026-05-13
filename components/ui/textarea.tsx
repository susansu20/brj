import * as React from "react";
import { cn } from "@/lib/utils";

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "w-full min-h-[160px] px-3 py-2 rounded-md border border-navy/15 bg-white text-navy placeholder:text-navy/40 leading-relaxed",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange focus-visible:ring-offset-1",
        className,
      )}
      {...props}
    />
  ),
);
Textarea.displayName = "Textarea";
