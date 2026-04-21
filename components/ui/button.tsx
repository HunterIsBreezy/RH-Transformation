import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm font-medium transition-all ease-out-expo duration-300 disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-copper focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
  {
    variants: {
      variant: {
        default:
          "bg-copper text-paper hover:bg-copper-deep hover:-translate-y-px shadow-[0_1px_0_0_rgba(244,239,230,0.08)_inset]",
        secondary:
          "bg-paper text-bg hover:bg-bone hover:-translate-y-px",
        outline:
          "border border-line-strong bg-transparent text-paper hover:border-line-hover hover:bg-copper-subtle",
        ghost:
          "bg-transparent text-paper hover:bg-copper-subtle hover:text-copper",
        link:
          "bg-transparent text-copper underline-offset-4 hover:underline",
        destructive:
          "bg-destructive text-paper hover:opacity-90",
      },
      size: {
        sm: "h-9 px-4 text-[13px] tracking-body",
        default: "h-11 px-6 text-sm tracking-body",
        lg: "h-14 px-8 text-[15px] tracking-body",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
