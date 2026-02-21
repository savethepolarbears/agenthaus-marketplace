"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import clsx from "clsx";

interface CommandCopyProps {
  command: string;
  className?: string;
}

export function CommandCopy({ command, className }: CommandCopyProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className={clsx(
        "group relative bg-linear-to-r from-white/5 to-white/10 border border-white/10 px-6 py-4 rounded-xl font-mono text-cyan-400 flex items-center gap-3 shadow-xl shadow-cyan-500/5 hover:shadow-cyan-500/10 transition-all active:scale-[0.99] hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/50 text-left w-full max-w-3xl cursor-pointer",
        className
      )}
    >
      <span className="text-gray-500 select-none" aria-hidden="true">$</span>
      <span className="flex-1 overflow-x-auto scrollbar-hide whitespace-nowrap">
        {command}
      </span>
      <span className="sr-only">{copied ? "Copied!" : "Copy to clipboard"}</span>
      <div className="text-gray-500 group-hover:text-white transition-colors shrink-0" aria-hidden="true">
        {copied ? <Check size={20} className="text-green-400" /> : <Copy size={20} />}
      </div>

      {/* Tooltip feedback */}
      <span
        role="status"
        className={clsx(
          "absolute -top-10 right-0 text-xs font-sans bg-black/90 text-white px-3 py-1.5 rounded-lg transition-all duration-200 pointer-events-none border border-white/10 shadow-lg translate-y-2",
          copied ? "opacity-100 translate-y-0" : "opacity-0"
        )}
      >
        {copied ? "Copied!" : ""}
      </span>
    </button>
  );
}
