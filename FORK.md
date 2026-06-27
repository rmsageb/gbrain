# FORK.md — why this fork exists & how to run it safely

This is a **soft fork** of [garrytan/gbrain](https://github.com/garrytan/gbrain).
It exists ONLY to carry a small patch series upstream doesn't ship. Treat the fork
as **debt to keep small**, not a permanent home — upstream the generic parts when you can.

## The patch series — branch `autolink-trust-fix`, base `bb2e88c` (v0.42.52.0)

1. **`fix(sync)`: op-checkpoint raw-array bind ("Fix B")** — upstream double-encodes
   `completed_keys` into a jsonb *string* scalar, violating the v119 array CHECK and
   aborting every `gbrain sync`. This is a **genuine upstream bug** → first candidate to upstream.
2. **`feat(autolink)`: explicit-only mode for trusted-local stdio MCP** — the local
   `gbrain serve` (stdio) is the machine owner's own process, so it is trusted to
   auto-link, but in **explicit-only** mode: author-written `[[wikilinks]]` + markdown
   links only; bare `dir/slug` in prose is skipped as an injection guard. Lets writes
   from Conductor / Claude Desktop / Code auto-link instead of returning `{skipped:"remote"}`.
   The network HTTP server (`serve-http.ts`) deliberately does NOT get this trust.

## THE RULE (load-bearing — this is what bites)

**Never `bun install -g github:garrytan/gbrain` (bare upstream).** It silently
replaces this fork, reverting BOTH patches, and `gbrain sync` + stdio auto-link break
with **no error**. Always install the PINNED fork SHA via `./install.sh`.

## Install / update a machine

```sh
git -C <path-to-this-fork> pull      # get the latest pinned SHA + scripts
./install.sh                          # removes any global gbrain, installs pinned SHA, verifies
# then: start a NEW Conductor session so the stdio serve respawns on the patched code
```

`install.sh` is the only supported install path. It pins the exact commit, so you
cannot accidentally land on bare upstream.

## Update to newer upstream gbrain (deliberate — never automatic)

```sh
git fetch upstream
git rebase <upstream-tag> autolink-trust-fix     # replay the 2 patches onto newer upstream
bun test test/explicit-only-autolink.test.ts && bun test test/link-extraction.test.ts && bunx tsc --noEmit
git push --force-with-lease
# bump PINNED_SHA in install.sh to the new HEAD; commit; push
# re-run ./install.sh on EVERY machine
```

If a rebase conflicts, it will only be in the 3 files the patches touch
(`op-checkpoint.ts`, `link-extraction.ts`, `operations.ts`, `dispatch.ts`, `server.ts`).
The fork-only files (`FORK.md`, `install.sh`, `test/explicit-only-autolink.test.ts`)
are additive and never conflict.

## Machines running this fork

Each machine runs its OWN stdio gbrain against the shared Supabase brain, so each
must be installed/updated independently:

- [ ] MacBook (Conductor) — installed 2026-06-24 @ `24dd1394`
- [ ] (add other Conductor machines here)
