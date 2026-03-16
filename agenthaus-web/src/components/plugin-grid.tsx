"use client";

import { useState, useMemo, useRef, useDeferredValue, useEffect } from "react";
import clsx from "clsx";
import PluginCard from "./plugin-card";
import {
  Search,
  Package,
  X,
} from "lucide-react";
import type { StaticPlugin } from "@/lib/plugins-static";
import { useSearchParams, usePathname } from "next/navigation";
import Link from "next/link";

interface PluginGridProps {
  plugins: StaticPlugin[];
  categories: string[];
}

export default function PluginGrid({ plugins, categories }: PluginGridProps) {
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");

  // Sync state with URL when browser history changes (e.g., Back button)
  useEffect(() => {
    setSearchQuery(searchParams.get("q") || "");
  }, [searchParams]);

  // Bolt ⚡ Optimization: Defer the search query to prevent blocking the UI while typing
  // This keeps the input responsive even if filtering becomes expensive
  const deferredSearchQuery = useDeferredValue(searchQuery);

  const activeCategory = searchParams.get("category") || "all";
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const clearSearch = () => {
    setSearchQuery("");
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    updateURL("", activeCategory);
    inputRef.current?.focus();
  };

  const updateURL = (q: string, cat: string) => {
    const params = new URLSearchParams(searchParams);
    if (q) {
      params.set("q", q);
    } else {
      params.delete("q");
    }

    if (cat && cat !== "all") {
      params.set("category", cat);
    } else {
      params.delete("category");
    }

    // Bolt ⚡ Optimization: Use window.history.replaceState to instantly update the URL
    // without triggering an expensive Next.js navigation cycle or Server Component (RSC) re-fetch.
    const newUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
    window.history.replaceState(null, "", newUrl);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);

    // Bolt ⚡ Optimization: Debounce the URL update to prevent triggering
    // excessive Next.js routing state updates and potential RSC re-fetches on every keystroke
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      updateURL(val, activeCategory);
    }, 300);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip during IME composition (CJK input)
      if (e.isComposing) return;

      // Focus search input when "/" is pressed, unless user is already in an input
      if (
        e.key === "/" &&
        document.activeElement?.tagName !== "INPUT" &&
        document.activeElement?.tagName !== "TEXTAREA"
      ) {
        e.preventDefault();
        inputRef.current?.focus();
      }

    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      if (searchQuery) {
        // First Escape clears the text but keeps focus
        e.preventDefault();
        setSearchQuery("");
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
        }
        updateURL("", activeCategory);
      } else {
        // Second Escape (when empty) blurs the input
        inputRef.current?.blur();
      }
    }
  };

  // Bolt ⚡ Optimization: Pre-compute a parallel array of search strings.
  // This reduces filter complexity to O(N) and prevents memory bloat from cloning the entire
  // plugins array just to append a search string property (O(N) object allocations avoided).
  const searchStrings = useMemo(() => {
    return plugins.map((p) =>
      `${p.name} ${p.description} ${p.tags.join(" ")}`.toLowerCase()
    );
  }, [plugins]);

  const filtered = useMemo(() => {
    // Optimization: Pre-compute lowercase query once to avoid repetitive .toLowerCase() in loop
    const normalizedQuery = deferredSearchQuery.toLowerCase();

    // Bolt ⚡ Optimization: Early return when no filters are active
    // This skips the O(N) array filter loop entirely on initial load and when filters are cleared,
    // reducing unnecessary CPU cycles since all plugins should be shown.
    if (normalizedQuery === "" && activeCategory === "all") {
      return plugins;
    }

    return plugins.filter((p, index) => {
      const matchesCategory =
        activeCategory === "all" || p.category === activeCategory;

      // Optimization: use deferred value to keep input responsive while filtering happens in background
      if (!matchesCategory) return false;
      const matchesSearch =
        normalizedQuery === "" || searchStrings[index].includes(normalizedQuery);
      return matchesSearch;
    });
  }, [plugins, searchStrings, deferredSearchQuery, activeCategory]);

  return (
    <>
      {/* Search */}
      <div className="max-w-2xl mx-auto mb-8">
        <div className="relative">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
            size={20}
            aria-hidden="true"
          />
          <input
            ref={inputRef}
            type="search"
            enterKeyHint="search"
            maxLength={100}
            placeholder="Search plugins by name, description, or tag..."
            aria-label="Search plugins"
            aria-keyshortcuts="/"
            value={searchQuery}
            onChange={handleSearchChange}
            onKeyDown={handleInputKeyDown}
            className="w-full pl-12 pr-20 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/25 transition-colors [&::-webkit-search-cancel-button]:appearance-none"
          />
          {!searchQuery && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
              <kbd className="hidden sm:inline-block px-2 py-0.5 text-xs font-sans font-medium bg-white/5 border border-white/10 rounded-md text-gray-400">
                /
              </kbd>
            </div>
          )}
          {searchQuery && (
            <button
              onClick={clearSearch}
              type="button"
              className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-gray-500 hover:text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/50 rounded-md group"
              aria-label="Clear search"
              title="Clear search (Esc)"
            >
              <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-sans font-medium bg-white/5 border border-white/10 rounded-md text-gray-400 group-hover:text-white transition-colors">
                Esc
              </kbd>
              <X size={20} aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      {/* Category pills */}
      <div
        className="flex flex-wrap justify-center gap-2 mb-12"
        role="group"
        aria-label="Filter plugins by category"
      >
        {(() => {
          // Bolt ⚡ Optimization: Pre-serialize the search parameters to a string once
          // outside of the categories map loop to avoid redundantly iterating and stringifying
          // the searchParams entries on every single iteration.
          const currentParamsString = searchParams.toString();
          return categories.map((cat) => {
            const isActive = activeCategory === cat;
            const targetCategory = isActive && cat !== "all" ? "all" : cat;
            const params = new URLSearchParams(currentParamsString);
            if (targetCategory !== "all") {
              params.set("category", targetCategory);
            } else {
              params.delete("category");
            }

            return (
              <Link
                key={cat}
                href={`?${params.toString()}`}
              scroll={false}
              aria-current={isActive ? "true" : undefined}
              aria-label={
                cat === "all"
                  ? isActive
                    ? "Viewing all categories"
                    : "View all categories"
                  : isActive
                  ? `Remove ${cat} category filter`
                  : `Filter by ${cat} category`
              }
              title={
                cat === "all"
                  ? isActive
                    ? "Viewing all categories"
                    : "View all categories"
                  : isActive
                  ? `Remove ${cat} category filter`
                  : `Filter by ${cat} category`
              }
              className={clsx(
                "px-4 py-1.5 rounded-lg text-sm font-medium transition-all capitalize focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/50",
                isActive
                  ? "bg-cyan-500/20 border border-cyan-500/40 text-cyan-400"
                  : "bg-white/5 border border-white/10 text-gray-400 hover:border-white/20 hover:text-gray-300"
              )}
            >
              {cat}
            </Link>
            );
          });
        })()}
      </div>

      {/* Results count */}
      <p
        className="text-gray-500 text-sm mb-6 text-center"
        role="status"
        aria-live="polite"
      >
        {filtered.length} plugin{filtered.length !== 1 ? "s" : ""} found
      </p>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((p) => (
          <PluginCard key={p.slug} plugin={p} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-20">
          <Package className="mx-auto text-gray-600 mb-4" size={48} aria-hidden="true" />
          <p className="text-gray-500 text-lg">
            No plugins match {searchQuery ? `"${searchQuery}"` : "your search"}
            {activeCategory !== "all" ? ` in the ${activeCategory} category` : ""}.
          </p>
          <button
            onClick={() => {
              setSearchQuery("");
              if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
              }
              updateURL("", "all");
              inputRef.current?.focus();
            }}
            className="mt-4 text-cyan-400 hover:text-cyan-300 text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/50 rounded"
          >
            Clear filters
          </button>
        </div>
      )}
    </>
  );
}
