import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Gochi_Hand, Luckiest_Guy, Oswald } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";
import { BRAND_NAME } from "@/lib/constants";
import { UiSounds } from "@/components/UiSounds";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// In-game cartoon theme fonts (see .stage in globals.css)
const displayFont = Luckiest_Guy({
  variable: "--font-display",
  weight: "400",
  subsets: ["latin"],
});

const handFont = Gochi_Hand({
  variable: "--font-hand",
  weight: "400",
  subsets: ["latin"],
});

const scoreFont = Oswald({
  variable: "--font-score",
  weight: ["500", "700"],
  subsets: ["latin"],
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${BRAND_NAME}, Party Games on the Big Screen, Phones Are the Controllers`,
    template: `%s · ${BRAND_NAME}`,
  },
  description:
    "Browser party games for the big screen, controlled from everyone's phones. Nine games including trivia, bluffing, voting, guessing, pitching, ranking, and acting. No app, no console, no player accounts required.",
  keywords: [
    "party games",
    "big screen games",
    "group games online",
    "phone controller games",
    "game night",
    "trivia game",
    "two truths and a lie",
    "would you rather",
    "virtual host party games",
    "browser party games",
  ],
  applicationName: BRAND_NAME,
  openGraph: {
    type: "website",
    siteName: BRAND_NAME,
    title: `${BRAND_NAME}, Party Games on the Big Screen`,
    description:
      "Put the game on the TV, hand everyone a room code, and play. Trivia, bluffing, and hot takes, phones are the controllers.",
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: `${BRAND_NAME}, Party Games on the Big Screen`,
    description:
      "Put the game on the TV, hand everyone a room code, and play. Phones are the controllers.",
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "/",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1, // phone buzz button shouldn't zoom on double tap
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${displayFont.variable} ${handFont.variable} ${scoreFont.variable} dark h-full antialiased`}
    >
      {/* the whole app wears the cartoon game-show theme (see .stage in globals.css) */}
      <body className="stage stage-backdrop flex min-h-full flex-col">
        <UiSounds />
        {children}
        <Analytics />
      </body>
    </html>
  );
}
