import type { Metadata } from "next";
import { Nav } from "@/components/marketing/Nav";
import { Footer } from "@/components/marketing/Footer";
import { LegacyPage } from "@/components/marketing/LegacyPage";
import { CONTENT_HTML, LEGACY_SCRIPT } from "./content";
import "./legacy.css";

export const metadata: Metadata = {
  title: "Testimonials — RH Transformation",
  description: "Real transformations from real men. See the results, read the testimonials, and decide if RH Transformation is the move.",
  alternates: { canonical: "https://rhtransformation.xyz/testimonials" },
};

export default function Page() {
  return (
    <>
      <Nav active="testimonials" calendlyUrl="https://calendly.com/unlockaxia/30min" />
      <LegacyPage html={CONTENT_HTML} script={LEGACY_SCRIPT} />
      <Footer />
    </>
  );
}
