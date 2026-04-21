import type { ReactNode } from "react";
import { Eyebrow, Display, Body } from "@/components/type";

export function Placeholder({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="max-w-3xl">
      <Eyebrow wide className="text-copper">{eyebrow}</Eyebrow>
      <Display as="h1" size="md" tight className="mt-6 mb-6">
        {title}
      </Display>
      <Body size="md" muted tight>
        {children}
      </Body>
    </div>
  );
}
