"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { UserButton } from "@clerk/nextjs";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Role } from "@/lib/auth";

type Item = { href: string; label: string };

const COACH_NAV: Item[] = [
  { href: "/app/roster", label: "Roster" },
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

export function MobileNav({ role }: { role: Role }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const items = role === "coach" ? COACH_NAV : CLIENT_NAV;
  const active = items.find((it) => pathname === it.href || pathname.startsWith(it.href + "/"));

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [open]);

  return (
    <>
      <header className="md:hidden sticky top-0 z-40 bg-bg/90 backdrop-blur border-b border-line">
        <div className="flex items-center justify-between px-4 h-14">
          <button
            onClick={() => setOpen(true)}
            aria-label="Open navigation"
            className="p-2 -ml-2 text-paper"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex flex-col items-center">
            <span className="text-[9px] uppercase tracking-eyebrow-wide text-bone-faint">RH Portal</span>
            <span className="text-[13px] font-medium text-paper tracking-body leading-none">
              {active?.label ?? (role === "coach" ? "Coach" : "Program")}
            </span>
          </div>
          <div className="w-8 h-8 flex items-center justify-center">
            <UserButton />
          </div>
        </div>
      </header>

      {open ? (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-bg/80 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <aside className="relative flex flex-col w-72 max-w-[85%] bg-bg-soft border-r border-line h-dvh shadow-[0_0_60px_rgba(0,0,0,0.6)]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-line">
              <div>
                <div className="text-[10px] uppercase tracking-eyebrow-wide text-bone-faint">RH Portal</div>
                <div className="text-sm font-medium text-paper tracking-body">
                  {role === "coach" ? "Coach Console" : "Your Program"}
                </div>
              </div>
              <button onClick={() => setOpen(false)} aria-label="Close" className="text-paper p-2">
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5 overflow-auto">
              {items.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "px-3 py-2.5 text-[14px] tracking-body rounded-sm border border-transparent transition-colors",
                      isActive
                        ? "text-paper bg-copper-subtle border-line-hover"
                        : "text-bone hover:text-paper hover:bg-bg-card",
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="px-4 py-4 border-t border-line text-[10px] uppercase tracking-eyebrow text-bone-faint">
              {role}
            </div>
          </aside>
        </div>
      ) : null}
    </>
  );
}
