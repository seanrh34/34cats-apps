import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/navbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "34cats Apps - Innovative Tools & AI-Powered Creations",
  description: "Explore cutting-edge apps, tools, and AI-powered experiments by 34cats. Transform your workflow with innovative digital solutions.",
  keywords: ["apps", "tools", "AI", "experiments", "productivity", "innovation"],
  authors: [{ name: "34cats" }],
  creator: "34cats",
  metadataBase: new URL('https://apps.34cats.com'),
  openGraph: {
    type: 'website',
    title: '34cats Apps - Innovative Tools & AI-Powered Creations',
    description: 'Explore cutting-edge apps, tools, and AI-powered experiments by 34cats.',
    siteName: '34cats Apps',
  },
  twitter: {
    card: 'summary_large_image',
    title: '34cats Apps - Innovative Tools & AI-Powered Creations',
    description: 'Explore cutting-edge apps, tools, and AI-powered experiments by 34cats.',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Navbar />
        {children}
      </body>
    </html>
  );
}
