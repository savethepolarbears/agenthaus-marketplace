"use client";

import { Share2, Check, Loader2 } from "lucide-react";
import { useState } from "react";

interface ShareButtonProps {
  slug: string;
  name: string;
  initialShareCount?: number;
}

export function ShareButton({ slug, name, initialShareCount = 0 }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [shareCount, setShareCount] = useState(initialShareCount);

  // Helper function to increment share count
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

  // Helper function for clipboard fallback
  const fallbackToClipboard = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      await incrementShareCount();
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleShare = async () => {
    if (isSharing) return;
    setIsSharing(true);

    try {
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
        } catch (err) {
          // Fallback to clipboard if share was cancelled or failed
          console.log("Share cancelled or failed, falling back to clipboard", err);
          await fallbackToClipboard(url);
        }
      } else {
        await fallbackToClipboard(url);
      }
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <>
      <button
        onClick={handleShare}
        disabled={isSharing}
        className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-all text-sm font-medium text-gray-300 hover:text-white group focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/50 min-w-[100px] disabled:opacity-50 disabled:cursor-wait"
        aria-label={copied ? "Copied!" : isSharing ? "Sharing..." : `Share plugin${shareCount > 0 ? ` (${shareCount} shares)` : ""}`}
      >
        {isSharing ? (
          <>
            <Loader2 size={16} className="animate-spin text-cyan-400" aria-hidden="true" />
            <span>Sharing...</span>
          </>
        ) : copied ? (
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

      {/* Live region for status updates moved outside to ensure aria-label does not hide it */}
      <span className="sr-only" role="status" aria-live="polite">
        {copied ? "Link copied to clipboard" : ""}
      </span>
    </>
  );
}
