#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────
# install.sh — Instalação standalone do claudept2en
# Não requer a extensão VSCode; injeta direto no .bashrc/.zshrc
# ─────────────────────────────────────────────────────────────────
set -euo pipefail

LIBRE_URL="${1:-http://localhost:5000}"
LIBRE_KEY="${2:-}"

MARKER_START="# ── claudept2en (auto-injected by VSCode extension) ──"
MARKER_END="# ── end claudept2en ──"

KEY_PARAM=""
[ -n "$LIBRE_KEY" ] && KEY_PARAM=", \"api_key\": \"$LIBRE_KEY\""

BASH_FUNCTION=$(cat <<ENDOFSCRIPT

$MARKER_START
__claude_pt_translate() {
  local text="\$1"
  local url="$LIBRE_URL/translate"
  local payload
  payload=\$(python3 -c "import json,sys; t=sys.argv[1]; print(json.dumps({'q':t,'source':'pt','target':'en','format':'text'${KEY_PARAM}}))" "\$text" 2>/dev/null) || return 1
  curl -sf -X POST "\$url" -H 'Content-Type: application/json' -d "\$payload" \\
    | python3 -c 'import json,sys; d=json.load(sys.stdin); print(d.get("translatedText",""))' 2>/dev/null
}

__claude_pt_looks_portuguese() {
  echo "\$1" | grep -qiP '(\\b(o|a|de|do|da|em|para|que|se|é|você|fazer|criar|adicionar|remover|verificar|mostrar|listar|preciso|quero|pode|como|qual|quando|onde)\\b|[ãõção\\u00e7])'
}

claude() {
  if [ -t 0 ] && [ \$# -eq 0 ]; then
    local line translated
    while IFS= read -r -e -p \$'\\001\\033[1;36m\\002claude❯ \\001\\033[0m\\002' line; do
      [ -z "\$line" ] && { echo; continue; }
      history -s "\$line"
      if __claude_pt_looks_portuguese "\$line"; then
        translated=\$(__claude_pt_translate "\$line" 2>/dev/null || echo "")
        if [ -n "\$translated" ] && [ "\$translated" != "\$line" ]; then
          printf '  \\033[2m[PT→EN] %s\\033[0m\\n' "\$translated" >&2
          line="\$translated"
        fi
      fi
      printf '%s\\n' "\$line"
    done | command claude
  else
    command claude "\$@"
  fi
}
export -f claude 2>/dev/null || true
$MARKER_END
ENDOFSCRIPT
)

inject_into_rc() {
  local rc_file="$1"
  [ -f "$rc_file" ] || touch "$rc_file"

  local content
  content=$(cat "$rc_file")

  # Remove existing injection
  if echo "$content" | grep -qF "$MARKER_START"; then
    local tmp
    tmp=$(mktemp)
    awk "/$MARKER_START/{found=1} !found{print} /$MARKER_END/{found=0}" "$rc_file" > "$tmp"
    cp "$tmp" "$rc_file"
    rm "$tmp"
  fi

  echo "$BASH_FUNCTION" >> "$rc_file"
  echo "  ✅ Injetado em $rc_file"
}

echo ""
echo "🌐 claudept2en — Instalador"
echo "  LibreTranslate URL: $LIBRE_URL"
echo ""

inject_into_rc "$HOME/.bashrc"
[ -f "$HOME/.zshrc" ] && inject_into_rc "$HOME/.zshrc"

echo ""
echo "✅ Instalação concluída!"
echo ""
echo "👉 Abra um novo terminal e execute: claude"
echo "   Prompts em português serão traduzidos automaticamente."
echo ""
echo "Para usar LibreTranslate local:"
echo "   pip install libretranslate"
echo "   libretranslate --load-only pt,en"
echo ""
