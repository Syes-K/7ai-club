import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { VercelObservability } from "@/components/analytics/vercel-observability";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
});

export const metadata: Metadata = {
  title: "7AI·CLUB",
  description: "A chat-first platform for configurable AI assistants",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable} h-full dark`}
    >
      <body className="min-h-full font-sans antialiased">
        {children}
        <VercelObservability />
      </body>
    </html>
  );
}
