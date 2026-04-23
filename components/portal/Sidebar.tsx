"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { cn } from "@/lib/utils";
import type { Role } from "@/lib/auth";

type Item = { href: string; label: string };

const COACH_NAV: Item[] = [
  { href: "/app/roster", label: "Roster" },
  { href: "/app/transcripts", label: "Transcripts" },
  { href: "/app/resources", label: "Resources" },
  { href: "/app/exercises", label: "Exercises" },
  { href: "/app/prescriptions", label: "Prescriptions" },
  { href: "/app/flags", label: "Flags" },
];

const CLIENT_NAV: Item[] = [
  { href: "/app/today", label: "Today" },
  { href: "/app/behavior-board", label: "Behavior Board" },
  { href: "/app/training", label: "Training" },
  { href: "/app/check-in", label: "Check-in" },
  { href: "/app/meetings", label: "Meetings" },
  { href: "/app/resources", label: "Resources" },
];

export function Sidebar({ role, userName }: { role: Role; userName?: string | null }) {
  const pathname = usePathname();
  const items = role === "coach" ? COACH_NAV : CLIENT_NAV;

  return (
    <aside className="hidden md:flex flex-col w-64 shrink-0 border-r border-line bg-bg-soft h-dvh sticky top-0">
      <div className="px-6 py-6 border-b border-line">
        <div className="text-[10px] uppercase tracking-eyebrow-wide text-bone-faint mb-1">
          RH Portal
        </div>
        <div className="text-sm font-medium text-paper tracking-body">
          {role === "coach" ? "Coach Console" : "Your Program"}
        </div>
        {userName ? (
          <div className="text-xs text-bone mt-2 tracking-body">{userName}</div>
        ) : null}
      </div>

      <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "px-3 py-2 text-[13px] tracking-body rounded-sm border border-transparent transition-colors",
                active
                  ? "text-paper bg-copper-subtle border-line-hover"
                  : "text-bone hover:text-paper hover:bg-bg-card",
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-4 py-4 border-t border-line flex items-center justify-between gap-3">
        <span className="text-[10px] uppercase tracking-eyebrow text-bone-faint">
          {role}
        </span>
        <UserButton />
      </div>
    </aside>
  );
}
