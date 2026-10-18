# Fixture deteksi CLI (T-111)

Direkam 2026-10-18 di Mac pemilik dengan Claude Code 2.1.302 dan Codex CLI 0.163.0, tanpa kuota, stdin ditutup. Email, organisasi, dan path pribadi disamarkan; struktur dan nilai lain apa adanya.

| File | Perintah | Exit | Stream |
|---|---|---|---|
| `claude-version.stdout.txt` | `claude --version` | 0 | stdout |
| `claude-auth-status-logged-in.json` | `claude auth status --json` | 0 | stdout |
| `claude-auth-status-logged-out.json` | `CLAUDE_CONFIG_DIR=<folder kosong> claude auth status --json` | 1 | stdout |
| `codex-version.stdout.txt` | `codex --version` | 0 | stdout |
| `codex-login-status-logged-in.stderr.txt` | `codex login status` | 0 | **stderr** |
| `codex-login-status-logged-out.stderr.txt` | `CODEX_HOME=<folder kosong> codex login status` | 1 | **stderr** |

Kondisi belum login direkam dengan folder konfigurasi sementara yang kosong, sehingga login pemilik tidak disentuh.
