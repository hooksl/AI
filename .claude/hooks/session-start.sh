#!/bin/bash
set -euo pipefail

# Only run in Claude Code cloud sessions
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

# Install the Binance Agentic Wallet CLI (baw) used by the binance-agentic-wallet skill
if ! command -v baw >/dev/null 2>&1; then
  npm install -g @binance/agentic-wallet
fi

baw --version
