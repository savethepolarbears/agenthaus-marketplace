#!/bin/bash
set -e

echo "Backing up local untracked directories..."
mkdir -p /tmp/agenthaus_local_backups
cp -a agenthaus-web /tmp/agenthaus_local_backups/ || true
cp -a .planning /tmp/agenthaus_local_backups/ || true
cp -a .claude /tmp/agenthaus_local_backups/ || true
cp -a .jules /tmp/agenthaus_local_backups/ || true
cp skills_index.json /tmp/agenthaus_local_backups/ || true
cp run_checks.sh /tmp/agenthaus_local_backups/ || true

echo "Running git filter-repo to scrub history..."
git filter-repo \
  --path agenthaus-web/ \
  --path .planning/ \
  --path .claude/settings.local.json \
  --path .jules/bolt.md \
  --path reports/SECURITY_SCAN_2026-02-06.md \
  --path reports/TEST_COVERAGE_ANALYSIS_2026-03-20.md \
  --path skills_index.json \
  --path run_checks.sh \
  --invert-paths \
  --force

echo "Restoring local backups..."
cp -R /tmp/agenthaus_local_backups/agenthaus-web . || true
cp -R /tmp/agenthaus_local_backups/.planning . || true
cp -R /tmp/agenthaus_local_backups/.claude . || true
cp -R /tmp/agenthaus_local_backups/.jules . || true
cp /tmp/agenthaus_local_backups/skills_index.json . || true
cp /tmp/agenthaus_local_backups/run_checks.sh . || true

echo "Restoring remote origin..."
git remote add origin https://github.com/savethepolarbears/agenthaus-marketplace.git

echo "Force pushing all branches and tags to origin..."
git push origin --force --all
git push origin --force --tags

echo "Scrub complete."
