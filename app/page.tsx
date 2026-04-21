import type { Metadata } from "next";
import { Nav } from "@/components/marketing/Nav";
import { Footer } from "@/components/marketing/Footer";
import { LegacyPage } from "@/components/marketing/LegacyPage";
import { CONTENT_HTML, LEGACY_SCRIPT } from "./content";
import "./legacy.css";

export const metadata: Metadata = {
  title: "RH Transformation — The 15-Week Lock-In",
  description: "A 15-week 1-on-1 coaching program for men done drifting. Body, mind, and systems — rebuilt with Rylan & Hunter.",
  alternates: { canonical: "https://rhtransformation.xyz" },
};

export default function Page() {
  return (
    <>
      <Nav active="home"  />
      <LegacyPage html={CONTENT_HTML} script={LEGACY_SCRIPT} />
      <Footer />
    </>
  );
}
