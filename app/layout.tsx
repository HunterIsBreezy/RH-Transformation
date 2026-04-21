import type { Metadata, Viewport } from "next";
import { Inter_Tight } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

const interTight = Inter_Tight({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-inter-tight",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0a0908",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://rhtransformation.xyz"),
  title: {
    default: "RH Transformation — The 15-Week Lock-In",
    template: "%s — RH Transformation",
  },
  description:
    "A 15-week 1-on-1 coaching program for men done drifting. Body, mind, and systems — rebuilt with Rylan & Hunter.",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.png", type: "image/png", sizes: "32x32" },
    ],
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    type: "website",
    title: "RH Transformation — The 15-Week Lock-In",
    description:
      "Body. Mind. Systems. A 1-on-1 coaching program for men done drifting. Two coaches, 15 weeks, one rebuild.",
    url: "https://rhtransformation.xyz",
    images: [
      {
        url: "https://rhtransformation.xyz/og-image.jpg",
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "RH Transformation — The 15-Week Lock-In",
    description:
      "Body. Mind. Systems. A 1-on-1 coaching program for men done drifting.",
    images: ["https://rhtransformation.xyz/og-image.jpg"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider
      appearance={{
        variables: {
          colorPrimary: "#c97a4f",
          colorBackground: "#0a0908",
          colorInputBackground: "#14110f",
          colorText: "#f4efe6",
          colorTextSecondary: "#a8a098",
          colorNeutral: "#a8a098",
          colorInputText: "#f4efe6",
          borderRadius: "4px",
          fontFamily: "var(--font-inter-tight), Inter Tight, sans-serif",
        },
      }}
    >
      <html lang="en" className={`${interTight.variable} dark`}>
        <body className="font-sans bg-bg text-paper antialiased">{children}</body>
      </html>
    </ClerkProvider>
  );
}
