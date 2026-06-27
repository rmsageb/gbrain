#!/usr/bin/env bash
# install.sh — the ONLY supported way to install this gbrain fork on a machine.
# Pins an exact commit so you can never accidentally land on bare upstream
# (which silently reverts the patches — see FORK.md "THE RULE").
set -euo pipefail

# ── Pinned fork commit. Bump THIS LINE ONLY when you rebase onto newer upstream. ──
PINNED_SHA="24dd13941a888a682ebd281650bafe332d36df88"

export PATH="$HOME/.bun/bin:$PATH"
command -v bun >/dev/null 2>&1 || { echo "✗ bun not found on PATH"; exit 1; }

echo "[gbrain-fork] removing any existing global gbrain (avoids bun DependencyLoop)…"
bun remove -g gbrain >/dev/null 2>&1 || true

echo "[gbrain-fork] installing rmsageb/gbrain#${PINNED_SHA:0:8} …"
bun install -g "github:rmsageb/gbrain#${PINNED_SHA}"

GBSRC="$HOME/.bun/install/global/node_modules/gbrain/src"
ok=1
grep -q "trust: { autolink: 'explicit' }" "$GBSRC/mcp/server.ts"  2>/dev/null || { echo "  ✗ stdio trust marker missing";  ok=0; }
grep -q "explicitAutolink"                 "$GBSRC/core/operations.ts" 2>/dev/null || { echo "  ✗ explicit-only gate missing"; ok=0; }
grep -q "key.fingerprint, sorted]"         "$GBSRC/core/op-checkpoint.ts" 2>/dev/null || { echo "  ✗ Fix B missing";            ok=0; }

if [ "$ok" = 1 ]; then
  echo "[gbrain-fork] ✓ all patches present — gbrain $(gbrain --version 2>/dev/null)"
  echo "[gbrain-fork] Done. Start a NEW Conductor session so the stdio serve loads the patched code."
else
  echo "[gbrain-fork] ✗ verification FAILED — patches not present. Do NOT rely on this install."
  exit 1
fi
