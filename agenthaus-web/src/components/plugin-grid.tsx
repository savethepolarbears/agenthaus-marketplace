"use client";

import { useState, useMemo, useRef, useDeferredValue } from "react";
import Link from "next/link";
import clsx from "clsx";
import { GridCommandCopy } from "@/components/grid-command-copy";
import {
  Search,
  Download,
  Share2,
  Github,
  Cloud,
  Rocket,
  Zap,
  FileText,
  BookOpen,
  CheckSquare,
  LayoutDashboard,
  Play,
  Database,
  Code2,
  Palette,
  GitBranch,
  ShieldAlert,
  Brain,
  Eye,
  Network,
  Shield,
  Plug,
  Package,
  X,
} from "lucide-react";
import type { StaticPlugin } from "@/lib/plugins-static";

const ICON_MAP: Record<string, React.ElementType> = {
  Share2,
  Github,
  Cloud,
  Rocket,
  Zap,
  FileText,
  Search,
  BookOpen,
  CheckSquare,
  LayoutDashboard,
  Play,
  Database,
  Code2,
  Palette,
  GitBranch,
  ShieldAlert,
  Brain,
  Eye,
  Network,
  Shield,
  Plug,
  Package,
};

function getIcon(name: string): React.ElementType {
  return ICON_MAP[name] || Package;
}

interface PluginGridProps {
  plugins: StaticPlugin[];
  categories: string[];
}

export default function PluginGrid({ plugins, categories }: PluginGridProps) {
  const [searchQuery, setSearchQuery] = useState("");
  // Bolt ⚡ Optimization: Defer the search query to prevent blocking the UI while typing
  // This keeps the input responsive even if filtering becomes expensive
  const deferredSearchQuery = useDeferredValue(searchQuery);

  const [activeCategory, setActiveCategory] = useState("all");
  const inputRef = useRef<HTMLInputElement>(null);

  const clearSearch = () => {
    setSearchQuery("");
    inputRef.current?.focus();
  };

  // Bolt ⚡ Optimization: Pre-compute a single search string for each plugin.
  // This reduces filter complexity from O(N * (Fields + Tags)) to O(N) by eliminating nested loops and multiple includes checks.
  const searchablePlugins = useMemo(() => {
    return plugins.map((p) => ({
      ...p,
      // Create one search string containing all searchable text
      _searchText: `${p.name} ${p.description} ${p.tags.join(" ")}`.toLowerCase(),
    }));
  }, [plugins]);

  const filtered = useMemo(() => {
    // Optimization: Pre-compute lowercase query once to avoid repetitive .toLowerCase() in loop
    const normalizedQuery = deferredSearchQuery.toLowerCase();

    return searchablePlugins.filter((p) => {
      const matchesCategory =
        activeCategory === "all" || p.category === activeCategory;

      // Optimization: use deferred value to keep input responsive while filtering happens in background
      const matchesSearch =
        normalizedQuery === "" || p._searchText.includes(normalizedQuery);
      return matchesCategory && matchesSearch;
    });
  }, [searchablePlugins, deferredSearchQuery, activeCategory]);

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
            type="text"
            maxLength={100}
            placeholder="Search plugins by name, description, or tag..."
            aria-label="Search plugins"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-12 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/25 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={clearSearch}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
              aria-label="Clear search"
            >
              <X size={20} />
            </button>
          )}
        </div>
      </div>

      {/* Category pills */}
      <div className="flex flex-wrap justify-center gap-2 mb-12">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            aria-pressed={activeCategory === cat}
            className={clsx(
              "px-4 py-1.5 rounded-lg text-sm font-medium transition-all capitalize",
              activeCategory === cat
                ? "bg-cyan-500/20 border border-cyan-500/40 text-cyan-400"
                : "bg-white/5 border border-white/10 text-gray-400 hover:border-white/20 hover:text-gray-300"
            )}
          >
            {cat}
          </button>
        ))}
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
        {filtered.map((p) => {
          const Icon = getIcon(p.icon);
          return (
            <div
              key={p.slug}
              className="group relative bg-gradient-to-br from-white/5 to-transparent border border-white/10 p-6 rounded-2xl hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-500/10 transition-all duration-300 flex flex-col has-[a:focus-visible]:border-cyan-500 has-[a:focus-visible]:ring-1 has-[a:focus-visible]:ring-cyan-500 has-[a:focus-visible]:shadow-lg has-[a:focus-visible]:shadow-cyan-500/20"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-xl group-hover:from-cyan-500/30 group-hover:to-blue-500/30 transition-colors">
                  <Icon
                    className="text-cyan-400"
                    size={22}
                    aria-hidden="true"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono bg-black/50 px-3 py-1.5 rounded-lg text-gray-400 border border-white/5 capitalize">
                    {p.category}
                  </span>
                </div>
              </div>

              <h3 className="text-lg font-bold mb-2 group-hover:text-cyan-400 transition-colors">
                <Link
                  href={`/plugins/${p.slug}`}
                  className="before:absolute before:inset-0 focus:outline-none"
                >
                  {p.name}
                </Link>
              </h3>
              <p className="text-gray-400 text-sm mb-4 leading-relaxed line-clamp-2">
                {p.description}
              </p>

              <div className="flex items-center justify-between mb-4 mt-auto">
                <span className="text-xs font-mono text-cyan-500/70 bg-cyan-500/10 px-2 py-0.5 rounded">
                  v{p.version}
                </span>
                <span className="flex items-center gap-1 text-xs text-gray-500">
                  <Download size={12} aria-hidden="true" />
                  {p.install_count}
                </span>
              </div>

              <GridCommandCopy command={`/plugin install ${p.slug}`} />
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-20">
          <Package className="mx-auto text-gray-600 mb-4" size={48} />
          <p className="text-gray-500 text-lg">No plugins match your search.</p>
          <button
            onClick={() => {
              setSearchQuery("");
              setActiveCategory("all");
              inputRef.current?.focus();
            }}
            className="mt-4 text-cyan-400 hover:text-cyan-300 text-sm transition-colors"
          >
            Clear filters
          </button>
        </div>
      )}
    </>
  );
}
