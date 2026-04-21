import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import { Sidebar } from "@/components/portal/Sidebar";
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
    <div className="flex min-h-dvh bg-bg">
      <Sidebar role={role} userName={userName} />
      <main className="flex-1 px-6 md:px-12 py-10 md:py-14">{children}</main>
    </div>
  );
}
