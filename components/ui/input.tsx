import * as React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => (
    <input
      ref={ref}
      type={type}
      className={cn(
        "flex h-11 w-full rounded-sm border border-line-strong bg-bg-soft px-4 py-2 text-sm tracking-body text-paper placeholder:text-bone-faint transition-colors duration-200 ease-out-quart focus-visible:outline-none focus-visible:border-copper focus-visible:ring-1 focus-visible:ring-copper disabled:cursor-not-allowed disabled:opacity-50 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-paper",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";

export { Input };
