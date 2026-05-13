import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "w-full h-10 px-3 rounded-md border border-navy/15 bg-white text-navy placeholder:text-navy/40",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange focus-visible:ring-offset-1",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";
