import type { Metadata } from "next";
import { Nav } from "@/components/marketing/Nav";
import { Footer } from "@/components/marketing/Footer";
import { LegacyPage } from "@/components/marketing/LegacyPage";
import { CONTENT_HTML, LEGACY_SCRIPT } from "./content";
import "./legacy.css";

export const metadata: Metadata = {
  title: "Mindset — RH Transformation",
  description: "The Mind Pillar of RH Transformation. Identity architecture, mental frameworks, and systems design — the internal rebuild that makes everything else stick.",
  alternates: { canonical: "https://rhtransformation.xyz/mindset" },
};

export default function Page() {
  return (
    <>
      <Nav active="mindset" calendlyUrl="https://calendly.com/unlockaxia/30min" />
      <LegacyPage html={CONTENT_HTML} script={LEGACY_SCRIPT} />
      <Footer />
    </>
  );
}
