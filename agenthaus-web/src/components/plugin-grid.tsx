"use client";

import { useState, useMemo, useDeferredValue } from "react";
import Link from "next/link";
import clsx from "clsx";
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
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const [activeCategory, setActiveCategory] = useState("all");

  const filtered = useMemo(() => {
    // Optimization: Pre-compute lowercase query once to avoid repetitive .toLowerCase() in loop
    const normalizedQuery = deferredSearchQuery.toLowerCase();

    return plugins.filter((p) => {
      const matchesCategory =
        activeCategory === "all" || p.category === activeCategory;

      // Optimization: use deferred value to keep input responsive while filtering happens in background
      const matchesSearch =
        normalizedQuery === "" ||
        p.name.toLowerCase().includes(normalizedQuery) ||
        p.description.toLowerCase().includes(normalizedQuery) ||
        p.tags.some((t) => t.toLowerCase().includes(normalizedQuery));
      return matchesCategory && matchesSearch;
    });
  }, [plugins, deferredSearchQuery, activeCategory]);

  return (
    <>
      {/* Search */}
      <div className="max-w-2xl mx-auto mb-8">
        <div className="relative">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
            size={20}
          />
          <input
            type="text"
            placeholder="Search plugins by name, description, or tag..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/25 transition-colors"
          />
        </div>
      </div>

      {/* Category pills */}
      <div className="flex flex-wrap justify-center gap-2 mb-12">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
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
      <p className="text-gray-500 text-sm mb-6 text-center">
        {filtered.length} plugin{filtered.length !== 1 ? "s" : ""} found
      </p>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((p) => {
          const Icon = getIcon(p.icon);
          return (
            <Link
              href={`/plugins/${p.slug}`}
              key={p.slug}
              className="group bg-gradient-to-br from-white/5 to-transparent border border-white/10 p-6 rounded-2xl hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-500/10 transition-all duration-300 block"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-xl group-hover:from-cyan-500/30 group-hover:to-blue-500/30 transition-colors">
                  <Icon className="text-cyan-400" size={22} />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono bg-black/50 px-3 py-1.5 rounded-lg text-gray-400 border border-white/5 capitalize">
                    {p.category}
                  </span>
                </div>
              </div>

              <h3 className="text-lg font-bold mb-2 group-hover:text-cyan-400 transition-colors">
                {p.name}
              </h3>
              <p className="text-gray-400 text-sm mb-4 leading-relaxed line-clamp-2">
                {p.description}
              </p>

              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono text-cyan-500/70 bg-cyan-500/10 px-2 py-0.5 rounded">
                  v{p.version}
                </span>
                <span className="flex items-center gap-1 text-xs text-gray-500">
                  <Download size={12} />
                  {p.install_count}
                </span>
              </div>

              <div className="bg-black/80 p-3 rounded-lg text-xs font-mono text-gray-500 border border-white/5 group-hover:border-cyan-500/20 transition-colors">
                /plugin install {p.slug}
              </div>
            </Link>
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
