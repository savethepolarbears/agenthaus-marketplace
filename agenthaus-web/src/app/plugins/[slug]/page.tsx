import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Download, Package } from "lucide-react";
import { sql } from "@/lib/db";
import { STATIC_PLUGINS } from "@/lib/plugins-static";
import type { StaticPlugin } from "@/lib/plugins-static";
import { ShareButton } from "@/components/share-button";
import { CommandCopy } from "@/components/command-copy";
import Navbar from "@/components/navbar";
import { isValidSlug } from "@/lib/validation";
import { unstable_cache } from "next/cache";

interface PluginDetail extends StaticPlugin {
  env_vars: { var_name: string; description: string; required: boolean }[];
  share_count?: number;
}

const fetchPluginFromDB = async (
  slug: string
): Promise<PluginDetail | null> => {
  if (!sql) return null;

  try {
    // Bolt ⚡ Optimization: Fetch plugin details, capabilities, and env vars in a single query
    // This reduces DB round trips from 3 to 1, significantly improving latency
    const rows = await sql`
      SELECT
        p.*,
        COALESCE(
          (
            SELECT json_agg(json_build_object(
              'type', pc.type,
              'name', pc.name,
              'description', pc.description
            ))
            FROM plugin_capabilities pc
            WHERE pc.plugin_id = p.id
          ),
          '[]'::json
        ) as capabilities,
        COALESCE(
          (
            SELECT json_agg(json_build_object(
              'var_name', pev.var_name,
              'description', pev.description,
              'required', pev.required
            ))
            FROM plugin_env_vars pev
            WHERE pev.plugin_id = p.id
          ),
          '[]'::json
        ) as env_vars
      FROM plugins p
      WHERE p.slug = ${slug}
    `;

    if (rows.length === 0) return null;

    const p = rows[0];

    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      description: p.description,
      version: p.version,
      category: p.category,
      author: p.author,
      tags: p.tags || [],
      install_count: p.install_count,
      share_count: p.share_count || 0,
      icon: p.icon || "",
      capabilities: p.capabilities as PluginDetail["capabilities"],
      env_vars: p.env_vars as PluginDetail["env_vars"],
    };
  } catch (error) {
    console.error("Error fetching plugin from DB:", error);
    return null;
  }
};

// Bolt ⚡ Optimization: Cache plugin details to avoid repeated DB hits
// Revalidate every hour
const getCachedPluginFromDB = unstable_cache(
  fetchPluginFromDB,
  ["plugin-detail"],
  { revalidate: 3600, tags: ["plugin"] }
);

async function getPlugin(slug: string): Promise<PluginDetail | null> {
  // Security: Validate slug format before database query to prevent DoS/abuse
  if (!isValidSlug(slug)) {
    return null;
  }

  if (sql) {
    const plugin = await getCachedPluginFromDB(slug);
    if (plugin) return plugin;
  }

  const found = STATIC_PLUGINS.find((p) => p.slug === slug);
  if (!found) return null;
  return { ...found, share_count: 0 };
}

export default async function PluginDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const plugin = await getPlugin(slug);

  if (!plugin) notFound();

  const capsByType = plugin.capabilities.reduce<
    Record<string, { name: string; description: string }[]>
  >((acc, cap) => {
    if (!acc[cap.type]) acc[cap.type] = [];
    acc[cap.type].push({ name: cap.name, description: cap.description });
    return acc;
  }, {});

  const typeLabels: Record<string, string> = {
    command: "Commands",
    agent: "Agents",
    skill: "Skills",
    hook: "Hooks",
    mcp: "MCP Servers",
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-[#0a0a0a] via-[#0f0f1a] to-[#0a0a0a] text-white font-sans selection:bg-cyan-500/30">
      <Navbar showLinks={false} />

      <main className="max-w-4xl mx-auto px-6 py-12">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-cyan-400 transition-colors mb-8 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/50 rounded"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          Back to marketplace
        </Link>

        {/* Header */}
        <div className="flex items-start gap-6 mb-10">
          <div className="p-4 bg-linear-to-br from-cyan-500/20 to-blue-500/20 rounded-2xl shrink-0">
            <Package className="text-cyan-400" size={36} aria-hidden="true" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap mb-2">
              <h1 className="text-3xl font-bold">{plugin.name}</h1>
              <span className="text-xs font-mono text-cyan-500/70 bg-cyan-500/10 px-2 py-0.5 rounded">
                v{plugin.version}
              </span>
              <span className="text-xs font-mono bg-black/50 px-3 py-1 rounded-lg text-gray-400 border border-white/5 capitalize">
                {plugin.category}
              </span>
            </div>
            <p className="text-gray-400 text-lg mb-3">{plugin.description}</p>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span>by {plugin.author}</span>
                <span className="flex items-center gap-1">
                  <Download size={14} aria-hidden="true" />
                  {plugin.install_count} installs
                </span>
              </div>
              <ShareButton
                slug={plugin.slug}
                name={plugin.name}
                initialShareCount={plugin.share_count}
              />
            </div>
          </div>
        </div>

        {/* Tags */}
        {plugin.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-10">
            {plugin.tags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 text-xs bg-white/5 border border-white/10 rounded-lg text-gray-400"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Install command */}
        <CommandCopy
          command={`/plugin install ${plugin.slug}`}
          className="mb-12 max-w-full"
        />

        {/* Capabilities */}
        {Object.keys(capsByType).length > 0 && (
          <section className="mb-12">
            <h2 className="text-xl font-bold mb-6">Capabilities</h2>
            {Object.entries(capsByType).map(([type, items]) => (
              <div key={type} className="mb-6">
                <h3 className="text-sm font-semibold text-cyan-400 uppercase tracking-wider mb-3">
                  {typeLabels[type] || type}
                </h3>
                <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="text-left px-4 py-2.5 text-gray-500 font-medium">
                          Name
                        </th>
                        <th className="text-left px-4 py-2.5 text-gray-500 font-medium">
                          Description
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item) => (
                        <tr
                          key={item.name}
                          className="border-b border-white/5 last:border-0"
                        >
                          <td className="px-4 py-2.5 font-mono text-white">
                            {item.name}
                          </td>
                          <td className="px-4 py-2.5 text-gray-400">
                            {item.description}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </section>
        )}

        {/* Environment variables */}
        {plugin.env_vars.length > 0 && (
          <section className="mb-12">
            <h2 className="text-xl font-bold mb-6">
              Required Environment Variables
            </h2>
            <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left px-4 py-2.5 text-gray-500 font-medium">
                      Variable
                    </th>
                    <th className="text-left px-4 py-2.5 text-gray-500 font-medium">
                      Description
                    </th>
                    <th className="text-left px-4 py-2.5 text-gray-500 font-medium">
                      Required
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {plugin.env_vars.map((ev) => (
                    <tr
                      key={ev.var_name}
                      className="border-b border-white/5 last:border-0"
                    >
                      <td className="px-4 py-2.5 font-mono text-cyan-400">
                        {ev.var_name}
                      </td>
                      <td className="px-4 py-2.5 text-gray-400">
                        {ev.description}
                      </td>
                      <td className="px-4 py-2.5 text-gray-400">
                        {ev.required ? "Yes" : "No"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </main>

      <footer className="border-t border-white/10 py-12 mt-20">
        <div className="max-w-7xl mx-auto px-6 text-center text-gray-500 text-sm">
          &copy; 2026 AgentHaus Team. Built for Claude Code & Cowork.
        </div>
      </footer>
    </div>
  );
}
