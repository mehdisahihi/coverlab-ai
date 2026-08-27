import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "CoverLab AI | Scientific Publication Artwork",
    template: "%s | CoverLab AI",
  },
  description:
    "Create research-driven graphical abstracts and journal-cover concepts with AI-assisted scientific visual workflows.",
  applicationName: "CoverLab AI",
  keywords: [
    "scientific artwork",
    "graphical abstract",
    "journal cover",
    "research visualization",
    "AI scientific design",
  ],
  openGraph: {
    type: "website",
    siteName: "CoverLab AI",
    title: "CoverLab AI | Scientific Publication Artwork",
    description:
      "Create research-driven graphical abstracts and journal-cover concepts with AI-assisted scientific visual workflows.",
  },
  twitter: {
    card: "summary_large_image",
    title: "CoverLab AI | Scientific Publication Artwork",
    description:
      "Create research-driven graphical abstracts and journal-cover concepts with AI-assisted scientific visual workflows.",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
