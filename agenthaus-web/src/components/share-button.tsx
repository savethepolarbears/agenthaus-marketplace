"use client";

import { Share2, Check } from "lucide-react";
import { useState } from "react";

interface ShareButtonProps {
  slug: string;
  name: string;
  initialShareCount?: number;
}

export function ShareButton({ slug, name, initialShareCount = 0 }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);
  const [shareCount, setShareCount] = useState(initialShareCount);

  const handleShare = async () => {
    // Generate the share link
    const url = `${window.location.origin}/plugins/${slug}?ref=share`;
    const text = `Check out ${name} on AgentHaus`;

    // Try to use the native share API first
    if (navigator.share) {
      try {
        await navigator.share({
          title: `AgentHaus - ${name}`,
          text: text,
          url: url,
        });
        // If share was successful, increment count
        await incrementShareCount();
        return;
      } catch (err) {
        // Fallback to clipboard if share was cancelled or failed
        console.log("Share cancelled or failed, falling back to clipboard", err);
      }
    }

    // Fallback: Copy to clipboard
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      await incrementShareCount();
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const incrementShareCount = async () => {
    try {
      const res = await fetch(`/api/plugins/${slug}/share`, {
        method: "POST",
      });
      if (res.ok) {
        const data = await res.json();
        if (data.count) {
          setShareCount(data.count);
        }
      }
    } catch (error) {
      console.error("Failed to increment share count:", error);
    }
  };

  return (
    <button
      onClick={handleShare}
      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-all text-sm font-medium text-gray-300 hover:text-white group"
      aria-label={copied ? "Copied!" : "Share plugin"}
    >
      {copied ? (
        <>
          <Check size={16} className="text-green-400" aria-hidden="true" />
          <span className="text-green-400">Copied!</span>
        </>
      ) : (
        <>
          <Share2 size={16} className="group-hover:text-cyan-400 transition-colors" aria-hidden="true" />
          <span>Share</span>
          {shareCount > 0 && (
            <span className="bg-white/10 px-1.5 py-0.5 rounded text-xs text-gray-400">
              {shareCount}
            </span>
          )}
        </>
      )}
    </button>
  );
}
