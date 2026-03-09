"use client";

import Link from "next/link";
import { Terminal, ExternalLink } from "lucide-react";

interface NavbarProps {
  /** Whether to show the right-side navigation links (Registry, Docs, Submit Plugin). Hidden on detail pages. */
  showLinks?: boolean;
}

export default function Navbar({ showLinks = true }: NavbarProps) {
  return (
    <nav className="border-b border-white/10 p-6 flex justify-between bg-black/50 backdrop-blur-xl sticky top-0 z-50">
      <Link href="/" className="flex items-center gap-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/50 rounded-xl">
        <div className="w-10 h-10 bg-linear-to-br from-cyan-400 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/25">
          <Terminal size={20} className="text-white" aria-hidden="true" />
        </div>
        <span className="text-2xl font-bold tracking-tight bg-linear-to-r from-white to-gray-400 bg-clip-text text-transparent">
          AgentHaus
        </span>
      </Link>
      {showLinks && (
        <div className="flex gap-6 text-sm text-gray-400 items-center">
          <Link
            href="/"
            className="hover:text-cyan-400 cursor-pointer transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/50 rounded"
          >
            Registry
          </Link>
          <a
            href="https://code.claude.com/docs/en/plugins"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 hover:text-cyan-400 cursor-pointer transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/50 rounded"
          >
            Docs
            <ExternalLink size={14} aria-hidden="true" className="opacity-70" />
            <span className="sr-only">(opens in a new tab)</span>
          </a>
          <a
            href="https://github.com/savethepolarbears/agenthaus-marketplace/blob/main/CONTRIBUTING.md"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-4 py-2 bg-cyan-500/20 border border-cyan-500/30 rounded-lg hover:bg-cyan-500/30 cursor-pointer transition-all text-cyan-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/50"
          >
            Submit Plugin
            <ExternalLink size={14} aria-hidden="true" className="opacity-70" />
            <span className="sr-only">(opens in a new tab)</span>
          </a>
        </div>
      )}
    </nav>
  );
}
