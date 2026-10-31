#!/bin/bash
# Double-click this file in Finder to start FoodBridge (macOS).
cd "$(dirname "$0")" || exit 1

# Fallback locations for Node.js installed with Homebrew, in case the shell profile doesn't add them.
export PATH="$PATH:/opt/homebrew/opt/node@24/bin:/opt/homebrew/bin:/usr/local/opt/node@24/bin:/usr/local/bin"

if ! command -v node >/dev/null 2>&1; then
  echo
  echo "  Node.js is not installed. Follow step 2 in README.md, then try again."
  echo
  read -r -p "  Press Enter to close this window."
  exit 1
fi

node scripts/start.mjs
status=$?
echo
read -r -p "  FoodBridge has stopped. Press Enter to close this window."
exit $status
