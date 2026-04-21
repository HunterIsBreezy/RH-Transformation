import { cn } from "@/lib/utils";
import type { ComponentPropsWithoutRef, ElementType } from "react";

type DisplayProps<T extends ElementType = "h1"> = {
  as?: T;
  size?: "sm" | "md" | "lg" | "xl";
  tight?: boolean;
} & ComponentPropsWithoutRef<T>;

const sizeClass: Record<NonNullable<DisplayProps["size"]>, string> = {
  sm: "text-3xl md:text-4xl",
  md: "text-4xl md:text-5xl",
  lg: "text-5xl md:text-6xl",
  xl: "text-6xl md:text-7xl",
};

export function Display<T extends ElementType = "h1">({
  as,
  size = "lg",
  tight,
  className,
  children,
  ...rest
}: DisplayProps<T>) {
  const Tag = (as ?? "h1") as ElementType;
  return (
    <Tag
      className={cn(
        "font-semibold text-paper leading-[1.02]",
        sizeClass[size],
        tight ? "tracking-display-tight" : "tracking-display",
        className,
      )}
      {...rest}
    >
      {children}
    </Tag>
  );
}
