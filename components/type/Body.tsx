import { cn } from "@/lib/utils";
import type { ComponentPropsWithoutRef, ElementType } from "react";

type BodyProps<T extends ElementType = "p"> = {
  as?: T;
  size?: "sm" | "md" | "lg";
  tight?: boolean;
  muted?: boolean;
} & ComponentPropsWithoutRef<T>;

const sizeClass: Record<NonNullable<BodyProps["size"]>, string> = {
  sm: "text-sm",
  md: "text-[15px] md:text-base",
  lg: "text-lg md:text-xl",
};

export function Body<T extends ElementType = "p">({
  as,
  size = "md",
  tight,
  muted,
  className,
  children,
  ...rest
}: BodyProps<T>) {
  const Tag = (as ?? "p") as ElementType;
  return (
    <Tag
      className={cn(
        "leading-[1.6]",
        sizeClass[size],
        tight ? "tracking-body-tight" : "tracking-body",
        muted ? "text-bone" : "text-paper",
        className,
      )}
      {...rest}
    >
      {children}
    </Tag>
  );
}
