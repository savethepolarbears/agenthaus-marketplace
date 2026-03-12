export interface StaticPlugin {
  id: number;
  name: string;
  slug: string;
  description: string;
  version: string;
  category: string;
  author: string;
  tags: string[];
  install_count: number;
  icon: string;
  capabilities: { type: string; name: string; description: string }[];
  env_vars: { var_name: string; description: string; required: boolean }[];
}

export const STATIC_PLUGINS: StaticPlugin[] = [
  {
    id: 1,
    name: "social-media",
    slug: "social-media",
    description: "Generate high-engagement social media content with trend analysis and platform-specific commands.",
    version: "2.0.0",
    category: "content",
    author: "AgentHaus Team",
    tags: ["content", "social", "marketing"],
    install_count: 412,
    icon: "Share2",
    capabilities: [
      { type: "command", name: "tweet", description: "/tweet command" },
      { type: "command", name: "linkedin", description: "/linkedin command" },
      { type: "command", name: "instagram", description: "/instagram command" },
      { type: "command", name: "facebook", description: "/facebook command" },
      { type: "command", name: "analyze-trend", description: "/analyze-trend command" },
      { type: "agent", name: "content-writer", description: "content-writer subagent" },
      { type: "agent", name: "trend-analyzer", description: "trend-analyzer subagent" },
      { type: "hook", name: "hooks", description: "hooks event hook" },
    ],
    env_vars: [],
  },
  {
    id: 2,
    name: "github-integration",
    slug: "github-integration",
    description: "Full GitHub management: create/search issues and pull requests using GitHub's MCP server.",
    version: "1.0.0",
    category: "devops",
    author: "AgentHaus Team",
    tags: ["devops", "github", "version-control"],
    install_count: 389,
    icon: "Github",
    capabilities: [
      { type: "command", name: "issue", description: "/issue command" },
      { type: "command", name: "pr", description: "/pr command" },
      { type: "mcp", name: "github", description: "github MCP server" },
    ],
    env_vars: [{ var_name: "GITHUB_TOKEN", description: "GitHub personal access token", required: true }],
  },
  {
    id: 3,
    name: "cloudflare-platform",
    slug: "cloudflare-platform",
    description: "Deploy Workers, manage KV storage & AI Gateway via Cloudflare MCP.",
    version: "1.0.0",
    category: "cloud",
    author: "AgentHaus Team",
    tags: ["cloud", "cloudflare", "workers"],
    install_count: 301,
    icon: "Cloud",
    capabilities: [
      { type: "mcp", name: "cloudflare", description: "cloudflare MCP server" },
    ],
    env_vars: [
      { var_name: "CLOUDFLARE_API_TOKEN", description: "Cloudflare API token", required: true },
      { var_name: "CLOUDFLARE_ACCOUNT_ID", description: "Cloudflare account ID", required: true },
    ],
  },
  {
    id: 4,
    name: "vercel-deploy",
    slug: "vercel-deploy",
    description: "Manage Vercel projects and deployments via MCP server.",
    version: "1.0.0",
    category: "deployment",
    author: "AgentHaus Team",
    tags: ["deployment", "vercel", "hosting"],
    install_count: 278,
    icon: "Rocket",
    capabilities: [
      { type: "mcp", name: "vercel", description: "vercel MCP server" },
    ],
    env_vars: [{ var_name: "VERCEL_TOKEN", description: "Vercel authentication token", required: true }],
  },
  {
    id: 5,
    name: "devops-flow",
    slug: "devops-flow",
    description: "Cloudflare + GitHub + Slack integrations with event hooks for DevOps workflows.",
    version: "1.0.0",
    category: "devops",
    author: "AgentHaus Team",
    tags: ["devops", "infra", "slack"],
    install_count: 256,
    icon: "Zap",
    capabilities: [
      { type: "mcp", name: "cloudflare", description: "cloudflare MCP server" },
      { type: "mcp", name: "github", description: "github MCP server" },
      { type: "mcp", name: "slack", description: "slack MCP server" },
      { type: "hook", name: "hooks", description: "hooks event hook" },
    ],
    env_vars: [
      { var_name: "CLOUDFLARE_API_TOKEN", description: "Cloudflare API token", required: true },
      { var_name: "CLOUDFLARE_ACCOUNT_ID", description: "Cloudflare account ID", required: true },
      { var_name: "GITHUB_TOKEN", description: "GitHub personal access token", required: true },
      { var_name: "SLACK_BOT_TOKEN", description: "Slack bot token", required: true },
      { var_name: "SLACK_CHANNEL", description: "Slack channel ID", required: true },
    ],
  },
  {
    id: 6,
    name: "notion-workspace",
    slug: "notion-workspace",
    description: "Search and update Notion pages via MCP server.",
    version: "1.0.0",
    category: "knowledge",
    author: "AgentHaus Team",
    tags: ["knowledge", "notion", "wiki"],
    install_count: 334,
    icon: "FileText",
    capabilities: [
      { type: "mcp", name: "notion", description: "notion MCP server" },
    ],
    env_vars: [{ var_name: "NOTION_API_KEY", description: "Notion API integration key", required: true }],
  },
  {
    id: 7,
    name: "context7-docs",
    slug: "context7-docs",
    description: "Fetch hallucination-free library documentation via Context7 MCP.",
    version: "1.0.0",
    category: "docs",
    author: "AgentHaus Team",
    tags: ["docs", "context7", "documentation"],
    install_count: 445,
    icon: "Search",
    capabilities: [
      { type: "mcp", name: "context7", description: "context7 MCP server" },
    ],
    env_vars: [],
  },
  {
    id: 8,
    name: "knowledge-synapse",
    slug: "knowledge-synapse",
    description: "Context7 + Notion + Google Drive RAG system for knowledge retrieval.",
    version: "1.0.0",
    category: "rag",
    author: "AgentHaus Team",
    tags: ["rag", "knowledge", "ai"],
    install_count: 198,
    icon: "BookOpen",
    capabilities: [
      { type: "mcp", name: "context7", description: "context7 MCP server" },
      { type: "mcp", name: "notion", description: "notion MCP server" },
      { type: "mcp", name: "google-drive", description: "google-drive MCP server" },
    ],
    env_vars: [
      { var_name: "CONTEXT7_KEY", description: "Context7 API key", required: true },
      { var_name: "NOTION_KEY", description: "Notion API key", required: true },
      { var_name: "GOOGLE_DRIVE_TOKEN", description: "Google Drive OAuth token", required: true },
    ],
  },
  {
    id: 9,
    name: "clickup-tasks",
    slug: "clickup-tasks",
    description: "Manage ClickUp tasks, lists and time tracking via MCP.",
    version: "1.0.0",
    category: "productivity",
    author: "AgentHaus Team",
    tags: ["productivity", "clickup", "tasks"],
    install_count: 267,
    icon: "CheckSquare",
    capabilities: [
      { type: "mcp", name: "clickup", description: "clickup MCP server" },
    ],
    env_vars: [
      { var_name: "CLICKUP_API_TOKEN", description: "ClickUp API token", required: true },
      { var_name: "CLICKUP_TEAM_ID", description: "ClickUp team ID", required: true },
    ],
  },
  {
    id: 10,
    name: "task-commander",
    slug: "task-commander",
    description: "ClickUp + Slack + Gmail + Calendar integration for task management.",
    version: "1.0.0",
    category: "productivity",
    author: "AgentHaus Team",
    tags: ["productivity", "integration", "calendar"],
    install_count: 223,
    icon: "LayoutDashboard",
    capabilities: [
      { type: "mcp", name: "clickup", description: "clickup MCP server" },
      { type: "mcp", name: "slack", description: "slack MCP server" },
      { type: "mcp", name: "gmail", description: "gmail MCP server" },
      { type: "mcp", name: "google-calendar", description: "google-calendar MCP server" },
    ],
    env_vars: [
      { var_name: "CLICKUP_KEY", description: "ClickUp API key", required: true },
      { var_name: "SLACK_TOKEN", description: "Slack bot token", required: true },
      { var_name: "SLACK_CHANNEL", description: "Slack channel ID", required: true },
      { var_name: "GMAIL_CREDS", description: "Gmail OAuth credentials", required: true },
      { var_name: "GOOGLE_CALENDAR_TOKEN", description: "Google Calendar token", required: true },
    ],
  },
  {
    id: 11,
    name: "playwright-testing",
    slug: "playwright-testing",
    description: "E2E browser tests with QA engineer agent and Playwright MCP.",
    version: "1.0.0",
    category: "qa",
    author: "AgentHaus Team",
    tags: ["qa", "testing", "e2e"],
    install_count: 356,
    icon: "Play",
    capabilities: [
      { type: "agent", name: "qa-engineer", description: "qa-engineer subagent" },
      { type: "mcp", name: "playwright", description: "playwright MCP server" },
    ],
    env_vars: [],
  },
  {
    id: 12,
    name: "qa-droid",
    slug: "qa-droid",
    description: "Automated testing with Slack/Gmail notifications and SDET agent.",
    version: "1.0.0",
    category: "testing",
    author: "AgentHaus Team",
    tags: ["testing", "qa", "notifications"],
    install_count: 189,
    icon: "Play",
    capabilities: [
      { type: "agent", name: "sdet-agent", description: "sdet-agent subagent" },
      { type: "mcp", name: "playwright-local", description: "playwright-local MCP server" },
    ],
    env_vars: [
      { var_name: "SLACK_TOKEN", description: "Slack bot token", required: true },
      { var_name: "SLACK_CHANNEL", description: "Slack channel ID", required: true },
      { var_name: "GMAIL_CREDS", description: "Gmail OAuth credentials", required: true },
    ],
  },
  {
    id: 13,
    name: "neon-db",
    slug: "neon-db",
    description: "Serverless Postgres via Neon MCP server.",
    version: "1.0.0",
    category: "database",
    author: "AgentHaus Team",
    tags: ["database", "postgres", "neon"],
    install_count: 312,
    icon: "Database",
    capabilities: [
      { type: "mcp", name: "postgres", description: "postgres MCP server" },
    ],
    env_vars: [
      { var_name: "DATABASE_URL", description: "Neon Postgres connection string", required: true },
      { var_name: "NEON_API_KEY", description: "Neon platform API key", required: true },
    ],
  },
  {
    id: 14,
    name: "data-core",
    slug: "data-core",
    description: "Advanced Neon/Postgres with migrations and schema management.",
    version: "1.0.0",
    category: "database",
    author: "AgentHaus Team",
    tags: ["database", "postgres", "migrations"],
    install_count: 178,
    icon: "Database",
    capabilities: [
      { type: "mcp", name: "postgres", description: "postgres MCP server" },
      { type: "skill", name: "migrate", description: "migrate skill" },
    ],
    env_vars: [
      { var_name: "DATABASE_URL", description: "Neon Postgres connection string", required: true },
      { var_name: "NEON_API_KEY", description: "Neon platform API key", required: true },
    ],
  },
  {
    id: 15,
    name: "marketplace-cli",
    slug: "marketplace-cli",
    description: "CLI utilities for managing AgentHaus plugins.",
    version: "1.0.0",
    category: "utility",
    author: "AgentHaus Team",
    tags: ["utility", "cli", "management"],
    install_count: 467,
    icon: "Code2",
    capabilities: [
      { type: "command", name: "marketplace", description: "/marketplace command" },
    ],
    env_vars: [],
  },
  {
    id: 16,
    name: "ux-ui",
    slug: "ux-ui",
    description: "Polish and improve your front-end UX/UI, accessibility, design and responsiveness for Tailwind CSS projects.",
    version: "1.0.0",
    category: "ux",
    author: "AgentHaus Team",
    tags: ["ux", "ui", "accessibility", "tailwind"],
    install_count: 234,
    icon: "Palette",
    capabilities: [
      { type: "command", name: "improve-ui", description: "/improve-ui command" },
      { type: "agent", name: "ui-expert", description: "ui-expert subagent" },
    ],
    env_vars: [],
  },
  {
    id: 17,
    name: "agent-handoff",
    slug: "agent-handoff",
    description: "Orchestrate multi-agent workflows with structured handoffs and context passing between Claude agents.",
    version: "1.0.0",
    category: "orchestration",
    author: "AgentHaus Team",
    tags: ["orchestration", "agents", "workflow"],
    install_count: 145,
    icon: "GitBranch",
    capabilities: [
      { type: "command", name: "handoff", description: "/handoff command" },
      { type: "skill", name: "agent-routing", description: "agent-routing skill" },
    ],
    env_vars: [],
  },
  {
    id: 18,
    name: "circuit-breaker",
    slug: "circuit-breaker",
    description: "Safety guardrails for AI agents: rate limiting, cost caps, and automatic circuit breaking on failures.",
    version: "1.0.0",
    category: "safety",
    author: "AgentHaus Team",
    tags: ["safety", "guardrails", "monitoring"],
    install_count: 203,
    icon: "ShieldAlert",
    capabilities: [
      { type: "hook", name: "circuit-breaker", description: "circuit-breaker event hook" },
      { type: "skill", name: "rate-limiter", description: "rate-limiter skill" },
    ],
    env_vars: [],
  },
  {
    id: 19,
    name: "agent-memory",
    slug: "agent-memory",
    description: "Persistent memory for Claude agents across sessions using vector storage and semantic retrieval.",
    version: "1.0.0",
    category: "memory",
    author: "AgentHaus Team",
    tags: ["memory", "persistence", "vector"],
    install_count: 287,
    icon: "Brain",
    capabilities: [
      { type: "command", name: "remember", description: "/remember command" },
      { type: "command", name: "recall", description: "/recall command" },
      { type: "skill", name: "memory-manager", description: "memory-manager skill" },
    ],
    env_vars: [],
  },
  {
    id: 20,
    name: "shadow-mode",
    slug: "shadow-mode",
    description: "Run agents in shadow mode to observe and learn from real workflows without making changes.",
    version: "1.0.0",
    category: "training",
    author: "AgentHaus Team",
    tags: ["training", "observation", "learning"],
    install_count: 112,
    icon: "Eye",
    capabilities: [
      { type: "command", name: "shadow", description: "/shadow command" },
      { type: "hook", name: "shadow-observer", description: "shadow-observer event hook" },
    ],
    env_vars: [],
  },
  {
    id: 21,
    name: "fleet-commander",
    slug: "fleet-commander",
    description: "Coordinate fleets of Claude agents with task distribution, load balancing, and result aggregation.",
    version: "1.0.0",
    category: "orchestration",
    author: "AgentHaus Team",
    tags: ["orchestration", "fleet", "parallel"],
    install_count: 167,
    icon: "Network",
    capabilities: [
      { type: "command", name: "fleet", description: "/fleet command" },
      { type: "agent", name: "fleet-coordinator", description: "fleet-coordinator subagent" },
      { type: "skill", name: "task-distributor", description: "task-distributor skill" },
    ],
    env_vars: [],
  },
  {
    id: 22,
    name: "plugin-auditor",
    slug: "plugin-auditor",
    description: "Security auditing for Claude plugins: permission analysis, dependency scanning, and vulnerability detection.",
    version: "1.0.0",
    category: "security",
    author: "AgentHaus Team",
    tags: ["security", "audit", "scanning"],
    install_count: 156,
    icon: "Shield",
    capabilities: [
      { type: "command", name: "audit", description: "/audit command" },
      { type: "skill", name: "security-scanner", description: "security-scanner skill" },
    ],
    env_vars: [],
  },
  {
    id: 23,
    name: "openclaw-bridge",
    slug: "openclaw-bridge",
    description: "Bridge Claude agents with external AI platforms and APIs for cross-system integration.",
    version: "1.0.0",
    category: "integration",
    author: "AgentHaus Team",
    tags: ["integration", "bridge", "api"],
    install_count: 134,
    icon: "Plug",
    capabilities: [
      { type: "command", name: "bridge", description: "/bridge command" },
      { type: "mcp", name: "openclaw", description: "openclaw MCP server" },
    ],
    env_vars: [],
  },
];

export const ALL_CATEGORIES = [
  "all",
  ...Array.from(new Set(STATIC_PLUGINS.map((p) => p.category))).sort(),
];

export const CATEGORY_META: Record<string, { title: string; description: string }> = {
  content: {
    title: "Content & Social Media AI Plugins",
    description: "AI plugins for generating, analyzing, and managing high-engagement content and social media campaigns with Claude."
  },
  devops: {
    title: "DevOps & Infrastructure AI Plugins",
    description: "Automate CI/CD, manage GitHub repositories, and orchestrate cloud infrastructure directly from Claude."
  },
  cloud: {
    title: "Cloud Services AI Plugins",
    description: "Integrate Claude with cloud platforms like Cloudflare to deploy workers, manage storage, and monitor applications."
  },
  deployment: {
    title: "Deployment & Hosting AI Plugins",
    description: "Streamline your deployment workflows with Vercel and other hosting providers using Claude."
  },
  knowledge: {
    title: "Knowledge Management AI Plugins",
    description: "Connect Claude to Notion, wikis, and team workspaces for seamless knowledge retrieval and updates."
  },
  docs: {
    title: "Documentation & API AI Plugins",
    description: "Access hallucination-free library documentation and API references instantly with Claude."
  },
  rag: {
    title: "RAG & Search AI Plugins",
    description: "Enhance Claude's knowledge with Retrieval-Augmented Generation systems spanning Google Drive, Notion, and more."
  },
  productivity: {
    title: "Productivity & Task AI Plugins",
    description: "Manage tasks in ClickUp, coordinate via Slack, and schedule with Google Calendar using Claude."
  },
  qa: {
    title: "QA & Testing AI Plugins",
    description: "Automate E2E testing with Playwright and specialized QA engineer agents in Claude."
  },
  testing: {
    title: "Automated Testing AI Plugins",
    description: "Run test suites, generate reports, and notify teams automatically with Claude testing plugins."
  },
  database: {
    title: "Database Management AI Plugins",
    description: "Query, manage, and migrate Serverless Postgres databases like Neon directly from Claude."
  },
  utility: {
    title: "CLI & Utility AI Plugins",
    description: "Essential tools and CLI utilities to enhance your Claude workspace and development workflow."
  },
  ux: {
    title: "UX/UI & Design AI Plugins",
    description: "Improve frontend design, accessibility, and Tailwind CSS implementation with specialized Claude agents."
  },
  orchestration: {
    title: "Agent Orchestration Plugins",
    description: "Coordinate complex multi-agent workflows, task distribution, and handoffs between Claude agents."
  },
  safety: {
    title: "AI Safety & Guardrail Plugins",
    description: "Implement rate limiting, cost caps, and automated circuit breakers for secure AI operations."
  },
  memory: {
    title: "Agent Memory & Vector Plugins",
    description: "Give Claude persistent memory across sessions using vector storage and semantic retrieval."
  },
  training: {
    title: "AI Training & Observation Plugins",
    description: "Run agents in shadow mode to observe, log, and learn from real workflows securely."
  },
  security: {
    title: "Security & Auditing AI Plugins",
    description: "Scan dependencies, analyze permissions, and audit Claude plugins for vulnerabilities."
  },
  integration: {
    title: "Cross-Platform AI Integrations",
    description: "Bridge Claude agents with external AI platforms, APIs, and enterprise systems."
  }
};
