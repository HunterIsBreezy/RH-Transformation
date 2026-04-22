"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { Logo } from "./Logo";

export type NavActive = "home" | "fitness" | "mindset" | "testimonials";

export function Nav({
  active,
  calendlyUrl = "https://calendly.com/rhtransformationco/30min",
}: {
  active?: NavActive;
  calendlyUrl?: string;
}) {
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        nav.classList.toggle("scrolled", window.scrollY > 80);
        ticking = false;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav ref={navRef}>
      <div className="nav-inner">
        <Link href="/" className="brand">
          <Logo />
          <span className="wordmark">
            <span className="rh">RH</span>
            <span className="divider" />
            <span className="label">Transformation</span>
          </span>
        </Link>
        <div className="nav-links">
          <Link href="/" className={`nav-link${active === "home" ? " active" : ""}`}>
            Home
          </Link>
          <Link href="/fitness" className={`nav-link${active === "fitness" ? " active" : ""}`}>
            Fitness
          </Link>
          <Link href="/mindset" className={`nav-link${active === "mindset" ? " active" : ""}`}>
            Mindset
          </Link>
          <Link
            href="/testimonials"
            className={`nav-link${active === "testimonials" ? " active" : ""}`}
          >
            Testimonials
          </Link>
          <Link href="/app" className="nav-link">
            Portal
          </Link>
        </div>
        <a href={calendlyUrl} target="_blank" rel="noopener noreferrer" className="nav-cta">
          Book a Call
        </a>
      </div>
    </nav>
  );
}
