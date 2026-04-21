import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export type Role = "coach" | "client";

export async function getRole(): Promise<Role | null> {
  const user = await currentUser();
  const role = user?.publicMetadata?.role;
  return role === "coach" || role === "client" ? role : null;
}

export async function requireUser() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  return userId;
}

export async function requireRole(role: Role) {
  await requireUser();
  const current = await getRole();
  if (current !== role) redirect("/app");
  return current;
}
