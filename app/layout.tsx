import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { AuthProvider } from "@/contexts/auth-context";

const title = "34cats Apps — Practical web tools by Sean";
const description =
  "Find practical web apps built and maintained by Sean at 34cats, with one shared credit balance across the network.";

export const metadata: Metadata = {
  title,
  description,
  keywords: ["apps", "tools", "indie software", "side projects", "34cats"],
  authors: [{ name: "34cats" }],
  creator: "34cats",
  metadataBase: new URL("https://apps.34cats.com"),
  openGraph: {
    type: 'website',
    title,
    description,
    siteName: "34cats Apps",
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
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html:
              'try{const t=localStorage.getItem("theme");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch{}',
          }}
        />
      </head>
      <body className="bg-platform text-copy antialiased">
        <AuthProvider>
          <Navbar />
          {children}
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
