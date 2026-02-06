import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AgentHaus - Claude Plugin Marketplace",
  description: "A comprehensive marketplace of 15 production-ready plugins for Claude Code and Cowork",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
