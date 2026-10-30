#!/usr/bin/env bash
# Run before every push to main (main is the live site). Usage: bash tools/check.sh [--browser]
#   --browser  also load every page in Chromium (needs Playwright: npm i -g playwright && npx playwright install chromium)
set -euo pipefail
cd "$(dirname "$0")/.."
python3 tools/build.py --check
python3 tests/test_site.py
node --test tests/scripts.test.cjs 2>&1 | tail -n 8 | grep -E "^# (pass|fail)"
node --test tests/scripts.test.cjs >/dev/null 2>&1 || { echo "script tests failed: node --test tests/scripts.test.cjs"; exit 1; }
if [[ "${1:-}" == "--browser" ]]; then node tools/browser_check.cjs; fi
echo "All checks passed."
