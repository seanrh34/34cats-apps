import type { Metadata } from "next";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { AuthProvider } from "@/contexts/auth-context";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
});

const title = "34cats Apps — Small, useful software, built by hand";
const description =
  "The index of apps and tools built by Sean at 34cats. Each one solves a real problem, ships small, and stays yours.";

export const metadata: Metadata = {
  title,
  description,
  keywords: ["apps", "tools", "indie software", "side projects", "34cats"],
  authors: [{ name: "34cats" }],
  creator: "34cats",
  metadataBase: new URL('https://apps.34cats.com'),
  openGraph: {
    type: 'website',
    title,
    description,
    siteName: '34cats Apps',
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // Font variables live on <html> so Tailwind's :root theme (--font-sans,
    // --font-display, --font-mono) can resolve them.
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${instrumentSerif.variable}`}
    >
      <body className="bg-ink text-bone antialiased">
        <AuthProvider>
          <Navbar />
          {children}
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
