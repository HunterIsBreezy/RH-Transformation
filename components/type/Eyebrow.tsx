import { cn } from "@/lib/utils";
import type { ComponentPropsWithoutRef, ElementType } from "react";

type EyebrowProps<T extends ElementType = "span"> = {
  as?: T;
  wide?: boolean;
} & ComponentPropsWithoutRef<T>;

export function Eyebrow<T extends ElementType = "span">({
  as,
  wide,
  className,
  children,
  ...rest
}: EyebrowProps<T>) {
  const Tag = (as ?? "span") as ElementType;
  return (
    <Tag
      className={cn(
        "font-medium uppercase text-bone-faint text-[11px] md:text-xs",
        wide ? "tracking-eyebrow-wide" : "tracking-eyebrow",
        className,
      )}
      {...rest}
    >
      {children}
    </Tag>
  );
}
