import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import { Sidebar } from "@/components/portal/Sidebar";
import { MobileNav } from "@/components/portal/MobileNav";
import type { Role } from "@/lib/auth";

export const metadata = { title: "Portal" };

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  const raw = user.publicMetadata?.role;
  const role: Role = raw === "coach" ? "coach" : "client";

  const userName =
    user.fullName ??
    [user.firstName, user.lastName].filter(Boolean).join(" ") ??
    user.emailAddresses[0]?.emailAddress ??
    null;

  return (
    <div className="min-h-dvh bg-bg">
      <MobileNav role={role} />
      <div className="flex">
        <Sidebar role={role} userName={userName} />
        <main className="flex-1 px-4 md:px-12 py-6 md:py-14">{children}</main>
      </div>
    </div>
  );
}
