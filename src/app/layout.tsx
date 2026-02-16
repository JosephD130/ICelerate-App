import type { Metadata } from "next";
import { Outfit, Space_Mono } from "next/font/google";
import Providers from "@/components/layout/Providers";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

const spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-space-mono",
});

export const metadata: Metadata = {
  title: "ICelerate — Decision Intelligence",
  description:
    "A decision intelligence layer that connects field conditions, contractual obligations, and executive narratives — turning 18-day decision cycles into minutes.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${outfit.variable} ${spaceMono.variable}`}>
      <body className="antialiased"><Providers>{children}</Providers></body>
    </html>
  );
}
