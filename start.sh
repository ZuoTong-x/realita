#!/bin/sh
set -eu

# nginx official image runs /docker-entrypoint.d/*.sh before starting nginx.
# We generate a runtime env file that the frontend loads (see index.html).

HTML_DIR="${HTML_DIR:-/usr/share/nginx/html}"
OUT_FILE="${OUT_FILE:-${HTML_DIR}/env.js}"

RUNTIME_ENV_KEYS="${RUNTIME_ENV_KEYS:-VITE_API_BASE,VITE_GOOGLE_CLIENT_ID,VITE_APP_NAME}"

js_escape() {
  # Escape for JS double-quoted string
  # BusyBox sed compatible.
  printf '%s' "$1" | sed \
    -e 's/\\/\\\\/g' \
    -e 's/"/\\"/g' \
    -e 's/\r/\\r/g' \
    -e 's/\n/\\n/g'
}

mkdir -p "$(dirname "$OUT_FILE")"

{
  echo '(function(){'
  echo '  window.__ENV = window.__ENV || {};'

  # Split comma-separated keys
  OLD_IFS="$IFS"
  IFS=','
  for key in $RUNTIME_ENV_KEYS; do
    IFS="$OLD_IFS"
    key="$(printf '%s' "$key" | sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//')"
    [ -z "$key" ] && IFS=',' && continue

    # Only write if present in environment (allows intentionally empty values)
    if env | grep -q "^${key}="; then
      val="$(printenv "$key" 2>/dev/null || true)"
      esc="$(js_escape "$val")"
      echo "  window.__ENV[\"$key\"] = \"$esc\";"
    fi

    IFS=','
  done
  IFS="$OLD_IFS"

  echo '})();'
} > "$OUT_FILE"

echo "Generated runtime env: $OUT_FILE"


