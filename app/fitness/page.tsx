import type { Metadata } from "next";
import { Nav } from "@/components/marketing/Nav";
import { Footer } from "@/components/marketing/Footer";
import { LegacyPage } from "@/components/marketing/LegacyPage";
import { CONTENT_HTML, LEGACY_SCRIPT } from "./content";
import "./legacy.css";

export const metadata: Metadata = {
  title: "Fitness — RH Transformation",
  description: "The Body Pillar of RH Transformation. Custom fitness, personalized nutrition, and weekly coaching with Rylan — rebuilt over 15 weeks.",
  alternates: { canonical: "https://rhtransformation.xyz/fitness" },
};

export default function Page() {
  return (
    <>
      <Nav active="fitness" calendlyUrl="https://calendly.com/unlockaxia/30min" />
      <LegacyPage html={CONTENT_HTML} script={LEGACY_SCRIPT} />
      <Footer />
    </>
  );
}
