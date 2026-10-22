import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://keyops.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "KeyOps - Rotate AI keys without breaking production",
    template: "%s - KeyOps",
  },
  description:
    "KeyOps rotates AI API keys across Vercel, GitHub Actions, and local env files, verifies the new key, then revokes the old one. Rollback included.",
  keywords: [
    "AI API key rotation",
    "secret rotation",
    "OpenAI key rotation",
    "Anthropic key rotation",
    "OpenRouter",
    "Vercel secrets",
    "GitHub Actions secrets",
    "security",
  ],
  authors: [{ name: "Dev M", url: "https://github.com/devtechedge" }],
  creator: "Dev M",
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName: "KeyOps",
    title: "KeyOps - Rotate AI keys without breaking production",
    description:
      "One command creates the replacement, writes every consumer, proves it works, then revokes the old key. If anything fails, it rolls back.",
    images: [{ url: "/og.png", width: 1280, height: 640, alt: "KeyOps" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "KeyOps - Rotate AI keys without breaking production",
    description:
      "Key rotation with fan-out, verification, and rollback for small AI teams.",
    images: ["/og.png"],
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  colorScheme: "dark light",
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#070908" },
    { media: "(prefers-color-scheme: light)", color: "#f4f5ef" },
  ],
};

const themeScript = `(function(){try{var t=localStorage.getItem("keyops-theme");if(t==="light"){document.documentElement.classList.remove("dark")}else{document.documentElement.classList.add("dark")}}catch(e){document.documentElement.classList.add("dark")}})();`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${GeistSans.variable} ${GeistMono.variable} dark`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
