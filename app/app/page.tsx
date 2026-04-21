import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";

export default async function AppIndex() {
  const user = await currentUser();
  if (!user) redirect("/sign-in");
  const role = user.publicMetadata?.role;
  redirect(role === "coach" ? "/app/roster" : "/app/today");
}
