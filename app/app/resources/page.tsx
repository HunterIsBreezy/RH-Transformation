import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Placeholder } from "@/components/portal/Placeholder";

export const metadata = { title: "Resources" };

export default async function ResourcesPage() {
  const user = await currentUser();
  if (!user) redirect("/sign-in");
  const role = user.publicMetadata?.role === "coach" ? "coach" : "client";

  if (role === "coach") {
    return (
      <Placeholder eyebrow="Coach · Resources" title="The archive you prescribe from.">
        Books, videos, internal docs — every resource tagged by the behavior it targets. Add a
        cover, tag the pillar, link it to a prescription template, and it&apos;s available to
        drop into any client&apos;s board.
      </Placeholder>
    );
  }

  return (
    <Placeholder eyebrow="Your Library" title="What Rylan &amp; Hunter have put in your hands.">
      Every resource your coaches have assigned — books, videos, frameworks, internal writeups.
      Filtered by the behaviors you&apos;re working on this week first, then by pillar.
    </Placeholder>
  );
}
