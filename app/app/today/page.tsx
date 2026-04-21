import { requireRole } from "@/lib/auth";
import { Placeholder } from "@/components/portal/Placeholder";

export const metadata = { title: "Today" };

export default async function TodayPage() {
  await requireRole("client");
  return (
    <Placeholder eyebrow="Today" title="One day. One direction. Move.">
      Your next check-in, your next training block, the behaviors you said you&apos;d work on
      this week, and the one resource your coaches want in front of your face. If you&apos;re
      only going to open one tab today, make it this one.
    </Placeholder>
  );
}
