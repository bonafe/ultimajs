#!/usr/bin/env bash
# Runs the browser test suite headless and exits non-zero on any failure.
# Needs: python3 and Chrome/Chromium (override with CHROME=/path/to/browser).
set -u
cd "$(dirname "$0")/.."

CHROME="${CHROME:-$(command -v google-chrome || command -v chromium || command -v chromium-browser || true)}"
[ -n "$CHROME" ] || { echo "Chrome/Chromium not found (set CHROME=...)" >&2; exit 2; }

PORT="${PORT:-8791}"
python3 -m http.server "$PORT" >/dev/null 2>&1 &
SERVER=$!
trap 'kill $SERVER 2>/dev/null' EXIT
sleep 1

DOM=$("$CHROME" --headless=new --no-sandbox --disable-gpu --virtual-time-budget=60000 \
      --dump-dom "http://localhost:$PORT/tests/" 2>/dev/null)

# The page puts one line per test in #results (HTML-escaped in the dump)
echo "$DOM" | sed -n '/<pre id="results">/,/<\/pre>/p' | sed 's/<[^>]*>//g;s/&lt;/</g;s/&gt;/>/g;s/&quot;/"/g;s/&amp;/\&/g'
SUMMARY=$(echo "$DOM" | grep -o 'id="summary">[^<]*' | sed 's/.*>//')
echo "$SUMMARY"

# Succeeds only if the summary is "N/N passed" and no line is a FAIL
PASSED=${SUMMARY%%/*}
TOTAL=${SUMMARY#*/}; TOTAL=${TOTAL%% *}
[ -n "$PASSED" ] && [ "$PASSED" = "$TOTAL" ] && [ "$PASSED" -gt 0 ] && ! echo "$DOM" | grep -q '^FAIL'
