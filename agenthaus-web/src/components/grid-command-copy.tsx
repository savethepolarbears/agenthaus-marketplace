"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import clsx from "clsx";

interface GridCommandCopyProps {
  command: string;
  className?: string;
}

export function GridCommandCopy({ command, className }: GridCommandCopyProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
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
        "w-full text-left bg-black/80 p-3 rounded-lg text-xs font-mono text-gray-500 border border-white/5 group-hover:border-cyan-500/20 transition-all cursor-pointer flex items-center justify-between gap-2 hover:text-gray-300 hover:bg-black/90 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-cyan-500/50 relative z-10 focus-visible:[&_svg]:opacity-100",
        className
      )}
      aria-label={`Copy command: ${command}`}
      title={command}
    >
      <span className="truncate font-mono select-all">{command}</span>
      <span className="shrink-0 text-cyan-500" aria-hidden="true">
         {copied ? <Check size={14} /> : <Copy size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />}
      </span>
      <span className="sr-only" role="status">{copied ? "Copied!" : ""}</span>
    </button>
  );
}
