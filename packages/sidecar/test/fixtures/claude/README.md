# Fixture Claude CLI

Direkam dari Claude Code 2.1.302 asli pada 2026-10-18 (T-102), cwd di folder project tiruan (bukan repo git) yang berisi `CLAUDE.md` dengan penanda `PROJECT-OK`. Isi file tidak diubah.

Flag dasar semua panggilan: `--model claude-opus-5-5 --output-format stream-json --verbose --tools "Read" --permission-prompts none --no-session-persistence --setting-sources project --strict-mcp-config --disable-slash-commands`, stdin ditutup.

| File | Tambahan flag / prompt | Isi penting |
|---|---|---|
| `stream-json-without-verbose.stderr.txt` | tanpa `--verbose` | Ditolak sebelum request: "requires --verbose", exit 1 |
| `print-isolated-basic.jsonl` | `--include-hook-events` | Event `system/init` (tools hanya `Read`, tanpa MCP/skill/plugin pengguna), `rate_limit_event`, `result` |
| `print-json-schema.jsonl` | `--json-schema <skema headline>` | Tool `StructuredOutput`; `result.structured_output` berisi objek tervalidasi |
| `print-permission-denied.jsonl` | prompt meminta shell dan baca `/etc/hosts` | Event `system/permission_denied`, `tool_result` `is_error`, `result.permission_denials` |

Detail di `docs/KNOWLEDGE.md` (Claude CLI).
