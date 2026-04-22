import { requireRole } from "@/lib/auth";
import { currentUser } from "@clerk/nextjs/server";
import { getClientByClerkId, getTodayCheckIn } from "@/lib/queries";
import { Eyebrow, Display, Body } from "@/components/type";
import { CheckInForm } from "./CheckInForm";

export const metadata = { title: "Check-in" };

export default async function CheckInPage() {
  await requireRole("client");
  const user = await currentUser();
  if (!user) return null;

  const detail = await getClientByClerkId(user.id);
  if (!detail) {
    return (
      <div className="max-w-3xl">
        <Eyebrow wide className="text-copper">Check-in</Eyebrow>
        <Display as="h1" size="md" tight className="mt-6 mb-6">
          Your program isn&apos;t linked yet.
        </Display>
        <Body muted tight>
          Sit tight — your coaches will confirm enrollment and the check-in form will light up
          here.
        </Body>
      </div>
    );
  }

  const today = await getTodayCheckIn(detail.client.id);

  return (
    <div className="max-w-2xl">
      <Eyebrow wide className="text-copper">Daily Check-in</Eyebrow>
      <Display as="h1" size="md" tight className="mt-6 mb-4">
        Five prompts. Sixty seconds.
      </Display>
      <Body muted tight className="mb-10">
        {today
          ? "You've already logged today. Update anything below and save."
          : "Be honest — your coaches read every one."}
      </Body>

      <CheckInForm
        clientId={detail.client.id}
        initial={
          today
            ? {
                mood: today.mood,
                energy: today.energy,
                sleepHours: today.sleepHours,
                training: today.training ?? "",
                nutrition: today.nutrition ?? "",
                win: today.win ?? "",
                friction: today.friction ?? "",
                note: today.note ?? "",
              }
            : null
        }
      />
    </div>
  );
}
