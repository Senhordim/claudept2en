# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this project is

A VS Code extension (**Claude PT→EN Translator**) that intercepts Portuguese prompts typed in Claude Code terminals and translates them to English via LibreTranslate before they reach the model. It also ships a standalone `install.sh` for users who don't use VS Code.

## Commands

### Extension (TypeScript)

```bash
npm install          # install dev dependencies
npm run compile      # compile extension.ts → out/extension.js
npm run watch        # compile in watch mode
npx vsce package     # build .vsix for distribution
code --install-extension claude-pt-translator-1.0.0.vsix
```

Press **F5** inside VS Code (with the folder open) to launch an Extension Development Host.

### Standalone installer

```bash
# Local LibreTranslate (no API key)
bash install.sh http://localhost:5000

# Public server with API key
bash install.sh https://libretranslate.com MY_API_KEY
```

### LibreTranslate server (required dependency)

```bash
pip install libretranslate
libretranslate --load-only pt,en      # starts on http://localhost:5000

# Or via Docker
docker run -ti --rm -p 5000:5000 libretranslate/libretranslate --load-only pt,en
```

### Python tooling (uv)

```bash
uv sync          # install dependencies from uv.lock
uv run main.py   # run main.py (currently a stub)
```

## Architecture

### How translation is wired in

The core mechanism is **shell function injection**, not a VS Code PTY or `sendText` override. On activation (and on enable/config-change), the extension generates a bash function and appends it to `~/.bashrc` and `~/.zshrc` between two marker comments (`MARKER_START` / `MARKER_END`). The injected `claude()` function wraps the real `claude` binary: it reads lines interactively, runs a heuristic to detect Portuguese, calls LibreTranslate via `curl` if needed, echoes the translation to stderr, then pipes the (possibly translated) text to `command claude`.

On disable/deactivate the extension removes that block by re-writing the rc files.

The extension code in `extension.ts` also contains two *unused* alternative approaches (a custom PTY terminal `createTranslatingTerminal` and a `sendText` monkey-patch via `patchTerminalSendText`) that were explored but are not called from `activate`. Only the shell-rc injection path is live.

### Language detection

`looksLikePortuguese()` (TypeScript) and `__claude_pt_looks_portuguese()` (bash) use regex heuristics — common Portuguese prepositions, pronouns, verbs, and accented characters. A text must match ≥ 2 patterns (TypeScript side) to be considered Portuguese. No external API call is made for detection.

### Key files

| File | Role |
|---|---|
| `extension.ts` | Full VS Code extension source — the only TypeScript file |
| `package.json` | Extension manifest: commands, keybindings, config schema |
| `install.sh` | Standalone bash installer; mirrors the shell-rc injection logic |
| `pyproject.toml` / `uv.lock` | Python environment with `libretranslate` dep (for local server) |
| `main.py` | Stub — not part of the extension |

### Config settings (all under `claudePtTranslator.*`)

| Key | Default | Purpose |
|---|---|---|
| `enabled` | `true` | Master toggle |
| `libreTranslateUrl` | `https://libretranslate.com` | Translation endpoint |
| `libreTranslateApiKey` | `""` | API key (omit for local server) |
| `showNotification` | `true` | VS Code info toast on each translation |
| `wrapperScriptPath` | `""` | Auto-filled path to the generated wrapper script |

### Shell rc injection markers

The injected block is always bounded by:
```
# ── Claude PT→EN Translator (auto-injected by VSCode extension) ──
...
# ── end Claude PT→EN ──
```

Both `extension.ts` and `install.sh` use these same markers so they are mutually compatible (installing one then the other won't create duplicate blocks).
