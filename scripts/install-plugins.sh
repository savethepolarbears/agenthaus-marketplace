#!/usr/bin/env bash
# =============================================================================
# AgentHaus Universal Plugin Installer
# =============================================================================
# Installs all AgentHaus marketplace plugins for Claude Code and provides
# interactive installation via symlink or copy to other CLI agents:
# Goose, Codex, Gemini CLI, OpenClaw, and more.
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
PLUGINS_DIR="$REPO_ROOT/plugins"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
BOLD='\033[1m'
DIM='\033[2m'
NC='\033[0m'

# =============================================================================
# Helpers
# =============================================================================

print_banner() {
  echo ""
  echo -e "${CYAN}${BOLD}  ╔══════════════════════════════════════════════════════════╗${NC}"
  echo -e "${CYAN}${BOLD}  ║          AgentHaus Universal Plugin Installer            ║${NC}"
  echo -e "${CYAN}${BOLD}  ╚══════════════════════════════════════════════════════════╝${NC}"
  echo ""
}

print_section() {
  echo ""
  echo -e "${BLUE}${BOLD}━━━ $1 ━━━${NC}"
  echo ""
}

info()    { echo -e "  ${BLUE}[INFO]${NC}    $1"; }
success() { echo -e "  ${GREEN}[OK]${NC}      $1"; }
warn()    { echo -e "  ${YELLOW}[WARN]${NC}    $1"; }
error()   { echo -e "  ${RED}[ERROR]${NC}   $1"; }
skip()    { echo -e "  ${DIM}[SKIP]${NC}    $1"; }

# Get all plugin names from the plugins directory
get_plugins() {
  find "$PLUGINS_DIR" -maxdepth 1 -mindepth 1 -type d -exec basename {} \; | sort
}

# Count plugins
count_plugins() {
  get_plugins | wc -l | tr -d ' '
}

# Check if a command exists
has_cmd() {
  command -v "$1" &>/dev/null
}

# Prompt yes/no with default
confirm() {
  local prompt="$1"
  local default="${2:-y}"
  local yn
  if [[ "$default" == "y" ]]; then
    read -rp "  $prompt [Y/n]: " yn
    yn="${yn:-y}"
  else
    read -rp "  $prompt [y/N]: " yn
    yn="${yn:-n}"
  fi
  [[ "$yn" =~ ^[Yy] ]]
}

# =============================================================================
# Claude Code Installation
# =============================================================================

install_claude_code() {
  print_section "Claude Code Plugin Installation"

  local claude_dir=""
  local install_mode=""

  # Determine installation target
  echo -e "  ${BOLD}Where should plugins be installed for Claude Code?${NC}"
  echo ""
  echo -e "    ${CYAN}1)${NC} Current project   ${DIM}(.claude/plugins/ in cwd)${NC}"
  echo -e "    ${CYAN}2)${NC} User global        ${DIM}(~/.claude/plugins/)${NC}"
  echo -e "    ${CYAN}3)${NC} Custom path"
  echo ""
  read -rp "  Select [1-3] (default: 1): " choice
  choice="${choice:-1}"

  case "$choice" in
    1)
      claude_dir="$(pwd)/.claude/plugins"
      install_mode="project"
      ;;
    2)
      claude_dir="$HOME/.claude/plugins"
      install_mode="global"
      ;;
    3)
      read -rp "  Enter custom path: " claude_dir
      install_mode="custom"
      ;;
    *)
      error "Invalid selection"
      return 1
      ;;
  esac

  # Ask symlink or copy
  echo ""
  echo -e "  ${BOLD}Installation method:${NC}"
  echo -e "    ${CYAN}1)${NC} Symlink  ${DIM}(recommended — stays in sync with repo)${NC}"
  echo -e "    ${CYAN}2)${NC} Copy     ${DIM}(standalone — no dependency on repo)${NC}"
  echo ""
  read -rp "  Select [1-2] (default: 1): " method
  method="${method:-1}"

  mkdir -p "$claude_dir"

  local installed=0
  local skipped=0
  local total
  total=$(count_plugins)

  echo ""
  info "Installing $total plugins to $claude_dir"
  echo ""

  for plugin in $(get_plugins); do
    local src="$PLUGINS_DIR/$plugin"
    local dst="$claude_dir/$plugin"

    if [[ -e "$dst" || -L "$dst" ]]; then
      skip "$plugin (already exists)"
      ((skipped++))
      continue
    fi

    if [[ "$method" == "1" ]]; then
      ln -s "$src" "$dst"
      success "$plugin -> symlinked"
    else
      cp -r "$src" "$dst"
      success "$plugin -> copied"
    fi
    ((installed++))
  done

  echo ""
  info "Installed: $installed | Skipped: $skipped | Total: $total"

  if [[ "$install_mode" == "project" ]]; then
    echo ""
    warn "Add .claude/plugins/ to .gitignore if you don't want to track installed plugins"
  fi
}

# =============================================================================
# Goose Installation (by Block)
# =============================================================================
# Goose uses ~/.config/goose/ for extensions and GOOSE_GLOBAL_PROFILE for skills.
# Skills are defined as markdown files in the profile extensions directory.

install_goose() {
  print_section "Goose (by Block) Plugin Installation"

  if ! has_cmd goose; then
    warn "Goose CLI not found. Install it from: https://github.com/block/goose"
    if ! confirm "Install anyway to pre-configure?"; then
      return 0
    fi
  fi

  local goose_dir="$HOME/.config/goose/extensions/agenthaus"
  echo -e "  ${BOLD}Goose skills directory:${NC} $goose_dir"
  echo ""

  # Ask method
  echo -e "  ${BOLD}Installation method:${NC}"
  echo -e "    ${CYAN}1)${NC} Symlink  ${DIM}(recommended)${NC}"
  echo -e "    ${CYAN}2)${NC} Copy"
  echo ""
  read -rp "  Select [1-2] (default: 1): " method
  method="${method:-1}"

  mkdir -p "$goose_dir"

  local installed=0
  for plugin in $(get_plugins); do
    local src="$PLUGINS_DIR/$plugin"
    local dst="$goose_dir/$plugin"

    if [[ -e "$dst" || -L "$dst" ]]; then
      skip "$plugin (already exists)"
      continue
    fi

    if [[ "$method" == "1" ]]; then
      ln -s "$src" "$dst"
    else
      cp -r "$src" "$dst"
    fi
    success "$plugin"
    ((installed++))
  done

  echo ""
  info "Installed $installed plugins for Goose"
  info "Reference skills in your Goose profile with: extensions.agenthaus.<plugin>"
}

# =============================================================================
# Codex Installation (by OpenAI)
# =============================================================================
# Codex CLI uses project-level configuration via codex.md or .codex/ directory.
# Instructions and tools are defined in markdown files.

install_codex() {
  print_section "Codex CLI (by OpenAI) Plugin Installation"

  if ! has_cmd codex; then
    warn "Codex CLI not found. Install it from: https://github.com/openai/codex"
    if ! confirm "Install anyway to pre-configure?"; then
      return 0
    fi
  fi

  local codex_dir=""
  echo -e "  ${BOLD}Where should skills be installed for Codex?${NC}"
  echo ""
  echo -e "    ${CYAN}1)${NC} Current project   ${DIM}(.codex/plugins/ in cwd)${NC}"
  echo -e "    ${CYAN}2)${NC} User global        ${DIM}(~/.codex/plugins/)${NC}"
  echo ""
  read -rp "  Select [1-2] (default: 1): " choice
  choice="${choice:-1}"

  case "$choice" in
    1) codex_dir="$(pwd)/.codex/plugins" ;;
    2) codex_dir="$HOME/.codex/plugins" ;;
    *) error "Invalid selection"; return 1 ;;
  esac

  echo ""
  echo -e "  ${BOLD}Installation method:${NC}"
  echo -e "    ${CYAN}1)${NC} Symlink  ${DIM}(recommended)${NC}"
  echo -e "    ${CYAN}2)${NC} Copy"
  echo ""
  read -rp "  Select [1-2] (default: 1): " method
  method="${method:-1}"

  mkdir -p "$codex_dir"

  local installed=0
  for plugin in $(get_plugins); do
    local src="$PLUGINS_DIR/$plugin"
    local dst="$codex_dir/$plugin"

    if [[ -e "$dst" || -L "$dst" ]]; then
      skip "$plugin (already exists)"
      continue
    fi

    if [[ "$method" == "1" ]]; then
      ln -s "$src" "$dst"
    else
      cp -r "$src" "$dst"
    fi
    success "$plugin"
    ((installed++))
  done

  echo ""
  info "Installed $installed plugins for Codex"
  info "Reference in AGENTS.md or codex.md with paths to the skills"
}

# =============================================================================
# Gemini CLI Installation
# =============================================================================
# Gemini CLI uses ~/.gemini/ for global config and project-level .gemini/ folders.
# Extensions and tools are defined in GEMINI.md or .gemini/settings.json.

install_gemini() {
  print_section "Gemini CLI Plugin Installation"

  if ! has_cmd gemini; then
    warn "Gemini CLI not found. Install: npm install -g @anthropic-ai/gemini-cli"
    if ! confirm "Install anyway to pre-configure?"; then
      return 0
    fi
  fi

  local gemini_dir=""
  echo -e "  ${BOLD}Where should skills be installed for Gemini CLI?${NC}"
  echo ""
  echo -e "    ${CYAN}1)${NC} Current project   ${DIM}(.gemini/plugins/ in cwd)${NC}"
  echo -e "    ${CYAN}2)${NC} User global        ${DIM}(~/.gemini/plugins/)${NC}"
  echo ""
  read -rp "  Select [1-2] (default: 1): " choice
  choice="${choice:-1}"

  case "$choice" in
    1) gemini_dir="$(pwd)/.gemini/plugins" ;;
    2) gemini_dir="$HOME/.gemini/plugins" ;;
    *) error "Invalid selection"; return 1 ;;
  esac

  echo ""
  echo -e "  ${BOLD}Installation method:${NC}"
  echo -e "    ${CYAN}1)${NC} Symlink  ${DIM}(recommended)${NC}"
  echo -e "    ${CYAN}2)${NC} Copy"
  echo ""
  read -rp "  Select [1-2] (default: 1): " method
  method="${method:-1}"

  mkdir -p "$gemini_dir"

  local installed=0
  for plugin in $(get_plugins); do
    local src="$PLUGINS_DIR/$plugin"
    local dst="$gemini_dir/$plugin"

    if [[ -e "$dst" || -L "$dst" ]]; then
      skip "$plugin (already exists)"
      continue
    fi

    if [[ "$method" == "1" ]]; then
      ln -s "$src" "$dst"
    else
      cp -r "$src" "$dst"
    fi
    success "$plugin"
    ((installed++))
  done

  echo ""
  info "Installed $installed plugins for Gemini CLI"
  info "Reference skills in GEMINI.md or .gemini/settings.json"
}

# =============================================================================
# OpenClaw Installation
# =============================================================================
# OpenClaw uses ~/.openclaw/skills/ for skill definitions.
# Skills are markdown files with frontmatter.

install_openclaw() {
  print_section "OpenClaw Plugin Installation"

  if ! has_cmd openclaw; then
    warn "OpenClaw CLI not found. Install from: https://github.com/openclaw-ai/openclaw"
    if ! confirm "Install anyway to pre-configure?"; then
      return 0
    fi
  fi

  local openclaw_dir="$HOME/.openclaw/skills/agenthaus"

  echo -e "  ${BOLD}OpenClaw skills directory:${NC} $openclaw_dir"
  echo ""
  echo -e "  ${BOLD}Installation method:${NC}"
  echo -e "    ${CYAN}1)${NC} Symlink  ${DIM}(recommended)${NC}"
  echo -e "    ${CYAN}2)${NC} Copy"
  echo ""
  read -rp "  Select [1-2] (default: 1): " method
  method="${method:-1}"

  mkdir -p "$openclaw_dir"

  local installed=0
  for plugin in $(get_plugins); do
    local src="$PLUGINS_DIR/$plugin"
    local dst="$openclaw_dir/$plugin"

    if [[ -e "$dst" || -L "$dst" ]]; then
      skip "$plugin (already exists)"
      continue
    fi

    if [[ "$method" == "1" ]]; then
      ln -s "$src" "$dst"
    else
      cp -r "$src" "$dst"
    fi
    success "$plugin"
    ((installed++))
  done

  echo ""
  info "Installed $installed plugins for OpenClaw"
  info "Use the openclaw-bridge plugin to convert formats: /migrate plugins/<name>"
}

# =============================================================================
# Custom Agent Installation
# =============================================================================

install_custom() {
  print_section "Custom Agent Installation"

  echo -e "  ${BOLD}Enter the target directory for plugin installation:${NC}"
  read -rp "  Path: " custom_dir

  if [[ -z "$custom_dir" ]]; then
    error "No path provided"
    return 1
  fi

  # Expand ~ if present
  custom_dir="${custom_dir/#\~/$HOME}"

  echo ""
  echo -e "  ${BOLD}Installation method:${NC}"
  echo -e "    ${CYAN}1)${NC} Symlink  ${DIM}(recommended)${NC}"
  echo -e "    ${CYAN}2)${NC} Copy"
  echo ""
  read -rp "  Select [1-2] (default: 1): " method
  method="${method:-1}"

  mkdir -p "$custom_dir"

  local installed=0
  for plugin in $(get_plugins); do
    local src="$PLUGINS_DIR/$plugin"
    local dst="$custom_dir/$plugin"

    if [[ -e "$dst" || -L "$dst" ]]; then
      skip "$plugin (already exists)"
      continue
    fi

    if [[ "$method" == "1" ]]; then
      ln -s "$src" "$dst"
    else
      cp -r "$src" "$dst"
    fi
    success "$plugin"
    ((installed++))
  done

  echo ""
  info "Installed $installed plugins to $custom_dir"
}

# =============================================================================
# Uninstall
# =============================================================================

uninstall_from() {
  local target_dir="$1"
  local agent_name="$2"

  if [[ ! -d "$target_dir" ]]; then
    warn "Directory $target_dir does not exist"
    return 0
  fi

  local removed=0
  for plugin in $(get_plugins); do
    local dst="$target_dir/$plugin"
    if [[ -L "$dst" ]]; then
      rm "$dst"
      success "Removed symlink: $plugin"
      ((removed++))
    elif [[ -d "$dst" ]]; then
      rm -rf "$dst"
      success "Removed copy: $plugin"
      ((removed++))
    fi
  done

  echo ""
  info "Removed $removed plugins from $agent_name"
}

# =============================================================================
# Status / List
# =============================================================================

show_status() {
  print_section "Plugin Status"

  echo -e "  ${BOLD}Available plugins ($(count_plugins)):${NC}"
  echo ""

  for plugin in $(get_plugins); do
    local manifest="$PLUGINS_DIR/$plugin/.claude-plugin/plugin.json"
    if [[ -f "$manifest" ]]; then
      local version desc
      version=$(grep -o '"version"[[:space:]]*:[[:space:]]*"[^"]*"' "$manifest" | head -1 | cut -d'"' -f4)
      desc=$(grep -o '"description"[[:space:]]*:[[:space:]]*"[^"]*"' "$manifest" | head -1 | cut -d'"' -f4 | cut -c1-60)
      printf "  ${GREEN}%-25s${NC} ${DIM}v%-8s${NC} %s\n" "$plugin" "$version" "$desc"
    else
      printf "  ${YELLOW}%-25s${NC} ${DIM}%-9s${NC} %s\n" "$plugin" "n/a" "(no manifest)"
    fi
  done

  echo ""

  # Check installation status
  echo -e "  ${BOLD}Installation status:${NC}"
  echo ""

  local check_dirs=(
    "$HOME/.claude/plugins|Claude Code (global)"
    "$(pwd)/.claude/plugins|Claude Code (project)"
    "$HOME/.config/goose/extensions/agenthaus|Goose"
    "$HOME/.codex/plugins|Codex (global)"
    "$(pwd)/.codex/plugins|Codex (project)"
    "$HOME/.gemini/plugins|Gemini CLI (global)"
    "$(pwd)/.gemini/plugins|Gemini CLI (project)"
    "$HOME/.openclaw/skills/agenthaus|OpenClaw"
  )

  for entry in "${check_dirs[@]}"; do
    local dir="${entry%%|*}"
    local label="${entry##*|}"
    if [[ -d "$dir" ]]; then
      local count
      count=$(find "$dir" -maxdepth 1 -mindepth 1 \( -type d -o -type l \) 2>/dev/null | wc -l | tr -d ' ')
      if [[ "$count" -gt 0 ]]; then
        printf "  ${GREEN}%-30s${NC} %s plugins installed\n" "$label" "$count"
      else
        printf "  ${DIM}%-30s${NC} empty\n" "$label"
      fi
    else
      printf "  ${DIM}%-30s${NC} not configured\n" "$label"
    fi
  done
}

# =============================================================================
# Non-Interactive Mode (install all for Claude Code)
# =============================================================================

install_all_claude_quick() {
  local claude_dir="${1:-$(pwd)/.claude/plugins}"
  local method="${2:-symlink}"

  mkdir -p "$claude_dir"

  local installed=0
  local skipped=0

  for plugin in $(get_plugins); do
    local src="$PLUGINS_DIR/$plugin"
    local dst="$claude_dir/$plugin"

    if [[ -e "$dst" || -L "$dst" ]]; then
      ((skipped++))
      continue
    fi

    if [[ "$method" == "copy" ]]; then
      cp -r "$src" "$dst"
    else
      ln -s "$src" "$dst"
    fi
    ((installed++))
  done

  echo "Installed $installed plugins (skipped $skipped) to $claude_dir"
}

# =============================================================================
# Interactive Menu
# =============================================================================

interactive_menu() {
  while true; do
    print_banner

    echo -e "  ${BOLD}Select an action:${NC}"
    echo ""
    echo -e "    ${CYAN}1)${NC}  Install all plugins for ${BOLD}Claude Code${NC}"
    echo -e "    ${CYAN}2)${NC}  Install all plugins for ${BOLD}Goose${NC} (by Block)"
    echo -e "    ${CYAN}3)${NC}  Install all plugins for ${BOLD}Codex${NC} (by OpenAI)"
    echo -e "    ${CYAN}4)${NC}  Install all plugins for ${BOLD}Gemini CLI${NC}"
    echo -e "    ${CYAN}5)${NC}  Install all plugins for ${BOLD}OpenClaw${NC}"
    echo -e "    ${CYAN}6)${NC}  Install to ${BOLD}custom path${NC}"
    echo -e "    ${CYAN}7)${NC}  Install for ${BOLD}all detected agents${NC}"
    echo ""
    echo -e "    ${CYAN}s)${NC}  Show plugin status"
    echo -e "    ${CYAN}q)${NC}  Quit"
    echo ""
    read -rp "  Select [1-7, s, q]: " choice

    case "$choice" in
      1) install_claude_code ;;
      2) install_goose ;;
      3) install_codex ;;
      4) install_gemini ;;
      5) install_openclaw ;;
      6) install_custom ;;
      7)
        install_claude_code
        install_goose
        install_codex
        install_gemini
        install_openclaw
        ;;
      s|S) show_status ;;
      q|Q)
        echo ""
        info "Goodbye!"
        echo ""
        exit 0
        ;;
      *)
        error "Invalid selection. Please try again."
        ;;
    esac

    echo ""
    read -rp "  Press Enter to continue..."
  done
}

# =============================================================================
# CLI Entry Point
# =============================================================================

usage() {
  echo "Usage: $0 [OPTIONS]"
  echo ""
  echo "AgentHaus Universal Plugin Installer"
  echo ""
  echo "Options:"
  echo "  (no args)           Interactive menu"
  echo "  --claude [path]     Quick install all plugins for Claude Code"
  echo "  --goose             Quick install for Goose"
  echo "  --codex             Quick install for Codex"
  echo "  --gemini            Quick install for Gemini CLI"
  echo "  --openclaw          Quick install for OpenClaw"
  echo "  --all               Install for all agents"
  echo "  --method <m>        Installation method: symlink (default) or copy"
  echo "  --status            Show installation status"
  echo "  --list              List available plugins"
  echo "  -h, --help          Show this help"
  echo ""
  echo "Examples:"
  echo "  $0                                   # Interactive mode"
  echo "  $0 --claude                          # Install for Claude Code (project)"
  echo "  $0 --claude ~/.claude/plugins        # Install to specific path"
  echo "  $0 --claude --method copy            # Copy instead of symlink"
  echo "  $0 --all                             # Install for all detected agents"
  echo "  $0 --status                          # Show what's installed where"
}

main() {
  local method="symlink"
  local action=""
  local target_path=""

  # Parse args
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --claude)
        action="claude"
        if [[ "${2:-}" && ! "${2:-}" == --* ]]; then
          target_path="$2"
          shift
        fi
        ;;
      --goose)   action="goose" ;;
      --codex)   action="codex" ;;
      --gemini)  action="gemini" ;;
      --openclaw) action="openclaw" ;;
      --all)     action="all" ;;
      --method)
        method="${2:-symlink}"
        shift
        ;;
      --status)  action="status" ;;
      --list)    action="list" ;;
      -h|--help) usage; exit 0 ;;
      *)
        error "Unknown option: $1"
        usage
        exit 1
        ;;
    esac
    shift
  done

  # Execute
  case "$action" in
    claude)
      print_banner
      local path="${target_path:-$(pwd)/.claude/plugins}"
      install_all_claude_quick "$path" "$method"
      ;;
    goose)
      print_banner
      install_goose
      ;;
    codex)
      print_banner
      install_codex
      ;;
    gemini)
      print_banner
      install_gemini
      ;;
    openclaw)
      print_banner
      install_openclaw
      ;;
    all)
      print_banner
      install_claude_code
      install_goose
      install_codex
      install_gemini
      install_openclaw
      ;;
    status)
      print_banner
      show_status
      ;;
    list)
      get_plugins
      ;;
    "")
      interactive_menu
      ;;
  esac
}

main "$@"
