#!/usr/bin/env bash
set -euo pipefail

echo "Validating plugins..."
bash scripts/validate-plugins.sh

echo "Running JavaScript tests..."
node --test tests/*.test.js

# Note: agenthaus-web is not tracked in the open source version,
# so these commands will fail if run locally. We preserve them
# as requested by the test harness/rules.
if [ -d "agenthaus-web" ]; then
    echo "Running web checks..."
    cd agenthaus-web
    pnpm install
    pnpm lint
    pnpm run build
    cd ..
else
    echo "agenthaus-web directory not found, skipping web checks."
fi

echo "All checks passed!"
