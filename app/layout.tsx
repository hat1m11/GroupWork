import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { Analytics } from "@vercel/analytics/next";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://groupwork.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "GroupWork — Academic Group Project Manager",
  description:
    "GroupWork helps university students manage group projects, assign tasks, schedule meetings, and track each member's contributions.",
  robots: { index: true, follow: true },
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: siteUrl,
    title: "GroupWork — Academic Group Project Manager",
    description:
      "GroupWork helps university students manage group projects, assign tasks, schedule meetings, and track each member's contributions.",
    siteName: "GroupWork",
  },
  twitter: {
    card: "summary",
    title: "GroupWork — Academic Group Project Manager",
    description:
      "GroupWork helps university students manage group projects, assign tasks, schedule meetings, and track each member's contributions.",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "GroupWork",
  url: siteUrl,
  description:
    "Academic group project management for university students. Organise tasks, communicate in real time, schedule meetings, and track contributions.",
  applicationCategory: "EducationApplication",
  operatingSystem: "Web",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  creator: { "@type": "Organization", name: "GroupWork" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-full flex flex-col" style={{ background: "var(--ct-bg)", color: "var(--ct-t1)" }}>
        <ThemeProvider>{children}</ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
