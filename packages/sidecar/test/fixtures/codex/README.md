# Fixture Codex CLI

Direkam dari Codex CLI 0.163.0 asli pada 2026-10-18 (T-101). Isi file tidak diubah.

| File | Perintah | Isi penting |
|---|---|---|
| `exec-image-cwd-job-assets.jsonl` | `codex exec --cd <proyek>/jobs/job-1/assets --sandbox workspace-write --skip-git-repo-check --json --ephemeral --ignore-user-config "<prompt gambar>"` | `AGENTS.md` di folder induk tidak terbaca |
| `exec-image-cwd-project.jsonl` | `codex exec --cd <proyek> --sandbox read-only --skip-git-repo-check --json --ephemeral --ignore-user-config "<prompt gambar>" < /dev/null` | `AGENTS.md` di cwd terbaca (pesan akhir memuat `AGENTS-OK`) |

Gambar hasil tersimpan di `~/.codex/generated_images/<thread_id>/exec-<uuid>.png`, dengan `<thread_id>` dari event `thread.started`. Stream `--json` tidak memuat event khusus gambar. Detail di `docs/KNOWLEDGE.md` (Codex CLI).
