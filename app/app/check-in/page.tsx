import { requireRole } from "@/lib/auth";
import { Placeholder } from "@/components/portal/Placeholder";

export const metadata = { title: "Check-in" };

export default async function CheckInPage() {
  await requireRole("client");
  return (
    <Placeholder eyebrow="Daily Check-in" title="Five prompts. Sixty seconds. Every day.">
      Mood, energy, training, nutrition, one win, one friction point. Your coaches read every
      one and use them to tune the week ahead. The guarantee requires 80% completion — this is
      how you hit that.
    </Placeholder>
  );
}
