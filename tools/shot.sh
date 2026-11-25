#!/bin/bash
# usage: shot.sh name "query" [WxH]
root="$(cd "$(dirname "$0")/.." && pwd)"; out="${QA_DIR:-/tmp}/$1.png"; size="${3:-1400,950}"
"${CHROME:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}" --headless=new --disable-gpu --no-sandbox --hide-scrollbars --virtual-time-budget=6000 --window-size=$size --screenshot="$out" "file://${root// /%20}/dist/index.html?$2" >/dev/null 2>&1
echo "$out"
