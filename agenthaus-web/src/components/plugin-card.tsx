"use client";

import { memo } from "react";
import Link from "next/link";
import { GridCommandCopy } from "@/components/grid-command-copy";
import { Download } from "lucide-react";
import type { StaticPlugin } from "@/lib/plugins-static";
import { guessIcon } from "@/lib/icons";
import { getIcon } from "@/components/icons";

interface PluginCardProps {
  plugin: StaticPlugin;
}

const PluginCard = memo(function PluginCard({ plugin }: PluginCardProps) {
  const Icon = getIcon(plugin.icon || guessIcon(plugin.slug));
  return (
    <div
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
        <div className="flex items-center gap-2 relative z-10">
          <Link
            href={`/?category=${plugin.category}`}
            className="text-xs font-mono bg-black/50 px-3 py-1.5 rounded-lg text-gray-400 border border-white/5 capitalize hover:text-cyan-400 hover:border-cyan-500/30 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/50"
            aria-label={`View all ${plugin.category} plugins`}
            title={`View all ${plugin.category} plugins`}
            prefetch={false}
          >
            {plugin.category}
          </Link>
        </div>
      </div>

      <h3 className="text-lg font-bold mb-2 group-hover:text-cyan-400 transition-colors">
        <Link
          href={`/plugins/${plugin.slug}`}
          className="before:absolute before:inset-0 focus:outline-none"
        >
          {plugin.name}
        </Link>
      </h3>
      <p
        className="text-gray-400 text-sm mb-4 leading-relaxed line-clamp-2"
        title={plugin.description}
      >
        {plugin.description}
      </p>

      <div className="flex items-center justify-between mb-4 mt-auto">
        <span className="text-xs font-mono text-cyan-500/70 bg-cyan-500/10 px-2 py-0.5 rounded">
          v{plugin.version}
        </span>
        <span
          className="flex items-center gap-1 text-xs text-gray-500"
          title={`${plugin.install_count} installs`}
        >
          <Download size={12} aria-hidden="true" />
          <span className="sr-only">Installs: </span>
          {plugin.install_count}
        </span>
      </div>

      <GridCommandCopy command={`/plugin install ${plugin.slug}`} />
    </div>
  );
});

export default PluginCard;
