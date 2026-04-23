import { requireRole } from "@/lib/auth";
import { Eyebrow, Display } from "@/components/type";
import { TranscriptSearch } from "./TranscriptSearch";

export const metadata = { title: "Transcripts" };

export default async function TranscriptsPage() {
  await requireRole("coach");
  return (
    <div className="max-w-4xl">
      <Eyebrow wide className="text-copper">Coach · Transcripts</Eyebrow>
      <Display as="h1" size="md" tight className="mt-6 mb-10">
        Every call, searchable.
      </Display>
      <TranscriptSearch />
    </div>
  );
}
