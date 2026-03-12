import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://agenthaus.com"),
  title: "AgentHaus - Claude Plugin Marketplace",
  description: "A comprehensive marketplace of 23 production-ready plugins for Claude Code and Cowork",
  openGraph: {
    title: "AgentHaus - Claude Plugin Marketplace",
    description: "A comprehensive marketplace of 23 production-ready plugins for Claude Code and Cowork",
    url: "https://agenthaus.com",
    siteName: "AgentHaus",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "AgentHaus Marketplace",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AgentHaus - Claude Plugin Marketplace",
    description: "A comprehensive marketplace of 23 production-ready plugins for Claude Code and Cowork",
    images: ["/og-image.jpg"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-white focus:text-black focus:rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 font-medium shadow-lg"
        >
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
