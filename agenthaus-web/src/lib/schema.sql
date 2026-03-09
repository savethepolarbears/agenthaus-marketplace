CREATE TABLE IF NOT EXISTS plugins (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  version TEXT NOT NULL DEFAULT '1.0.0',
  category TEXT NOT NULL,
  author TEXT NOT NULL DEFAULT 'AgentHaus Team',
  homepage TEXT,
  icon TEXT,
  tags TEXT[] DEFAULT '{}',
  install_count INTEGER DEFAULT 0,
  share_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS plugin_capabilities (
  id SERIAL PRIMARY KEY,
  plugin_id INTEGER NOT NULL REFERENCES plugins(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('command', 'agent', 'skill', 'hook', 'mcp')),
  name TEXT NOT NULL,
  description TEXT
);

CREATE TABLE IF NOT EXISTS plugin_env_vars (
  id SERIAL PRIMARY KEY,
  plugin_id INTEGER NOT NULL REFERENCES plugins(id) ON DELETE CASCADE,
  var_name TEXT NOT NULL,
  description TEXT,
  required BOOLEAN DEFAULT true
);

CREATE INDEX IF NOT EXISTS idx_plugins_category ON plugins(category);
CREATE INDEX IF NOT EXISTS idx_plugins_slug ON plugins(slug);
CREATE INDEX IF NOT EXISTS idx_plugin_capabilities_plugin_id ON plugin_capabilities(plugin_id);
CREATE INDEX IF NOT EXISTS idx_plugin_env_vars_plugin_id ON plugin_env_vars(plugin_id);
CREATE INDEX IF NOT EXISTS idx_plugins_install_count_name ON plugins(install_count DESC, name ASC);
