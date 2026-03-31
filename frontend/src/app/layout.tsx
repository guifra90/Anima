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
  title: "MIRROR ANIMA",
  description: "Autonomous Network for Intelligent Mirror Agency",
};

import { Sidebar } from "@/components/Sidebar";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="h-full antialiased dark"
      suppressHydrationWarning
    >
      <body className={`${geistSans.variable} ${geistMono.variable} h-full bg-background text-foreground flex overflow-hidden selection:bg-cyan-500/30 selection:text-white font-sans`}>
        <Sidebar />
        <main className="flex-1 h-full overflow-y-auto bg-background/50 relative scrollbar-hide">
          {children}
        </main>
      </body>
    </html>
  );
}
