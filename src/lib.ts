import * as fs from "fs";

export const MARKER_START = "# ── claudept2en (auto-injected by VSCode extension) ──";
export const MARKER_END   = "# ── end claudept2en ──";

export function looksLikePortuguese(text: string): boolean {
  if (text.trim().length < 3) { return false; }

  const ptMarkers = [
    /\b(o|a|os|as|um|uma|uns|umas)\b/i,
    /\b(de|do|da|dos|das|em|no|na|nos|nas|ao|aos|à|às)\b/i,
    /\b(e|ou|mas|porém|portanto|então|porque|que|se|como)\b/i,
    /\b(eu|você|ele|ela|nós|eles|elas|meu|minha|seu|sua)\b/i,
    /\b(é|está|são|estão|tem|têm|vai|vão|foi|foram)\b/i,
    /\b(para|com|por|sobre|entre|até|após|antes)\b/i,
    /\b(fazer|criar|adicionar|remover|alterar|verificar|mostrar|listar)\b/i,
    /[çã]/,
    /[ãõ]/,
    /[áéíóúâêîôû]/,
  ];

  const matches = ptMarkers.filter((re) => re.test(text)).length;
  return matches >= 2;
}

export function injectIntoBashRc(content: string, rcPath: string) {
  let existing = "";
  try { existing = fs.readFileSync(rcPath, "utf8"); } catch { /* new file */ }

  const startIdx = existing.indexOf(MARKER_START);
  const endIdx   = existing.indexOf(MARKER_END);
  if (startIdx !== -1 && endIdx !== -1) {
    existing = existing.slice(0, startIdx) + existing.slice(endIdx + MARKER_END.length + 1);
  }

  fs.writeFileSync(rcPath, existing.trimEnd() + "\n\n" + content + "\n", "utf8");
}

export function removeFromBashRc(rcPath: string) {
  try {
    let existing = fs.readFileSync(rcPath, "utf8");
    const startIdx = existing.indexOf(MARKER_START);
    const endIdx   = existing.indexOf(MARKER_END);
    if (startIdx !== -1 && endIdx !== -1) {
      existing = existing.slice(0, startIdx) + existing.slice(endIdx + MARKER_END.length + 1);
      fs.writeFileSync(rcPath, existing, "utf8");
    }
  } catch { /* ignore */ }
}

export function generateBashFunction(libreTranslateUrl: string, apiKey: string): string {
  const keyParam = apiKey ? `, "api_key": "${apiKey}"` : "";
  return `${MARKER_START}
__claude_pt_translate() {
  local text="$1"
  local url="${libreTranslateUrl}/translate"
  local payload="{\"q\": $(echo "$text" | python3 -c 'import json,sys; print(json.dumps(sys.stdin.read().strip()))'), \"source\": \"pt\", \"target\": \"en\", \"format\": \"text\"${keyParam}}"
  curl -sf -X POST "$url" -H 'Content-Type: application/json' -d "$payload" | python3 -c 'import json,sys; d=json.load(sys.stdin); print(d.get("translatedText",""))' 2>/dev/null
}

__claude_pt_looks_portuguese() {
  echo "$1" | grep -qiP '(\\b(o|a|de|do|da|em|para|que|se|é|você|fazer|criar|adicionar|remover|verificar|mostrar|listar)\\b|[ãõção])'
}

claude() {
  if [ -t 0 ] && [ $# -eq 0 ]; then
    local TMPFILE
    TMPFILE=$(mktemp /tmp/claude_input.XXXXXX)
    while IFS= read -r -e -p $'\\001\\033[1;36m\\002claude❯ \\001\\033[0m\\002' line; do
      history -s "$line"
      if __claude_pt_looks_portuguese "$line"; then
        local translated
        translated=$(__claude_pt_translate "$line")
        if [ -n "$translated" ]; then
          echo -e "  \\033[2m[PT→EN] $translated\\033[0m" >&2
          line="$translated"
        fi
      fi
      printf '%s\\n' "$line" >> "$TMPFILE"
    done
    command claude < "$TMPFILE"
    rm -f "$TMPFILE"
  else
    command claude "$@"
  fi
}
export -f claude 2>/dev/null || true
${MARKER_END}
`;
}
