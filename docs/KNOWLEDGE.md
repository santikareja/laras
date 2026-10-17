# KNOWLEDGE

Fakta yang sudah terverifikasi. Setiap butir menyebut cara verifikasinya. Hal yang belum terverifikasi ditandai **belum diuji** beserta task yang akan mengujinya.

## Lingkungan (versi tool, chip, macOS)

Diverifikasi 2026-10-17 (sesi #1).

| Item | Nilai | Cara cek |
|---|---|---|
| macOS | 27.0.1 (build 26A434) | `sw_vers` |
| Chip | Apple Silicon (arm64) | `uname -m` |
| Xcode Command Line Tools | 27.0, Apple clang 21.0.0, di `/Library/Developer/CommandLineTools` (Xcode penuh tidak terpasang dan tidak dibutuhkan untuk Tauri macOS) | `xcode-select -p`, `pkgutil --pkg-info=com.apple.pkg.CLTools_Executables` |
| git | 2.54.0 | `git --version` |
| Node | v22.22.2 (LTS) lewat fnm, alias `default`. Ada juga v20.20.2 | `node -v`, `fnm list` |
| pnpm | 12.11.2 | `pnpm -v` |
| Rust / cargo | **Belum terpasang** per 2026-10-18 (T-005) | `rustc --version` |
| Claude CLI | 2.1.302 di `~/.local/bin/claude` (symlink ke `~/.local/share/claude/versions/2.1.302`) | `claude --version` |
| Codex CLI | 0.163.0 di `~/.local/bin/codex` (symlink ke `~/.codex/packages/standalone/current/bin/codex`), dipasang lewat installer standalone, bukan Homebrew | `codex --version` |
| Google Chrome | Terpasang (fallback renderer `channel: "chrome"`) | `ls /Applications` |
| Playwright browsers | Sudah ada di `~/Library/Caches/ms-playwright` (antara lain `chromium-1223`) | `ls ~/Library/Caches/ms-playwright` |

- **PATH aplikasi GUI:** `launchctl getenv PATH` kosong, jadi aplikasi GUI hanya mendapat `/usr/bin:/bin:/usr/sbin:/sbin`. Node (fnm), Claude, dan Codex tidak ada di sana.
- **Path Node yang stabil:** `~/.local/share/fnm/aliases/default/bin/node` (symlink ke `~/.local/share/fnm/node-versions/v22.22.2/installation`). Path `~/.local/state/fnm_multishells/<id>/bin` berubah setiap shell dan tidak boleh disimpan.
- **Login shell menemukan CLI:** `/bin/zsh -lic 'command -v claude codex'` mengembalikan `~/.local/bin/claude` dan `~/.local/bin/codex` (diverifikasi setelah instalasi standalone). Untuk `node` dan `pnpm`, login shell mengembalikan path fnm multishell yang berubah-ubah, jadi resolusi Node (ADR-008) harus menormalkannya ke path alias `default`.

## Claude CLI (versi teruji, flag terverifikasi, perilaku output)

Versi teruji: **2.1.302** (standalone). Diverifikasi dari `claude --help` tanpa memakai kuota.

**Login dan status (tanpa kuota)**
- `claude auth status --json` (default JSON) mengembalikan antara lain `loggedIn`, `authMethod` (`claude.ai`), `subscriptionType`. `--text` untuk teks biasa. Mac ini: login aktif, paket **Team**.
- `claude --version` mencetak `2.1.302 (Claude Code)`.

**Flag yang ada di `--help` dan relevan untuk adapter**

| Flag | Fungsi menurut `--help` |
|---|---|
| `-p, --print` | Mode non-interaktif. Dialog workspace trust dilewati; file settings yang gagal validasi diabaikan diam-diam |
| `--model <model>` | Alias (`opus`, `sonnet`, `fable`) atau nama penuh (`claude-opus-5-5`) |
| `--output-format text\|json\|stream-json` | Hanya dengan `--print` |
| `--input-format text\|stream-json` | Hanya dengan `--print` |
| `--include-partial-messages` | Potongan pesan parsial; hanya dengan `--print` dan stream-json |
| `--verbose` | Override mode verbose |
| `--tools <tools...>` | Membatasi daftar tool bawaan yang tersedia (`""` = tanpa tool) |
| `--allowedTools` / `--disallowedTools` | Menyetujui otomatis / menolak tool. **Tidak membatasi** tool yang tersedia |
| `--permission-mode` | `acceptEdits`, `auto`, `bypassPermissions`, `manual`, `dontAsk`, `plan` |
| `--permission-prompts host\|none` | Dengan `--print`: `none` = semua yang butuh izin langsung ditolak |
| `--json-schema <schema>` | Validasi structured output dengan JSON Schema |
| `--no-session-persistence` | Sesi tidak disimpan ke disk; hanya dengan `--print` |
| `--setting-sources <sources>` | Sumber settings yang dimuat (`user`, `project`, `local`) |
| `--strict-mcp-config` | Hanya server MCP dari `--mcp-config` |
| `--disable-slash-commands` | Mematikan semua skill |
| `--restricted` | Menghapus tool yang menjalankan kode dan WebFetch (kecuali disebut di `--tools`), mengabaikan file settings user/project/local, membatasi tool file ke direktori kerja |
| `--append-system-prompt`, `--system-prompt` | Menambah / mengganti system prompt |
| `--effort <level>` | `low`, `medium`, `high`, `xhigh`, `max` |
| `--fallback-model <model>` | Model cadangan saat model utama overload |
| `--add-dir <dirs...>` | Direktori tambahan untuk akses tool |

**Flag yang tidak boleh dipakai dengan subscription**
- `--bare`: autentikasi hanya `ANTHROPIC_API_KEY` atau `apiKeyHelper` (OAuth dan keychain tidak dibaca), dan auto-discovery `CLAUDE.md` mati.
- `--safe-mode`: mematikan semua kustomisasi, termasuk `CLAUDE.md`.

**Belum diuji (T-102)**
- Apakah `-p` + `--output-format stream-json` wajib `--verbose`. Claude desktop app sendiri memanggil keduanya bersama.
- Apakah `--tools "Read"` + `--permission-prompts none` berjalan tanpa menggantung.
- Kombinasi isolasi yang mematikan hook, plugin, MCP, dan `~/.claude/CLAUDE.md` global, tetapi tetap membaca `CLAUDE.md` project dan memakai login subscription.
- Bentuk event stream-json dan pola pesan batas kuota.

## Codex CLI (versi teruji, flag terverifikasi, cara generasi gambar)

Versi teruji: **0.163.0** (standalone). Diverifikasi dari `codex --help`, `codex exec --help`, `codex login --help`, dan `codex features list` tanpa memakai kuota. Output `codex exec --help` identik dengan 0.162.0-alpha.17.2.

**Login dan status (tanpa kuota)**
- `codex login status` mencetak `Logged in using ChatGPT`.
- `codex --version` mencetak `codex-cli 0.163.0`.

**Flag `codex exec` yang relevan**

| Flag | Fungsi menurut `--help` |
|---|---|
| `[PROMPT]` atau `-` | Prompt sebagai argumen atau dari stdin |
| `-C, --cd <DIR>` | Direktori kerja agent |
| `-s, --sandbox` | `read-only`, `workspace-write`, `danger-full-access` |
| `--skip-git-repo-check` | Izinkan berjalan di luar repo git (folder job bukan repo git) |
| `--json` | Event JSONL ke stdout |
| `-o, --output-last-message <FILE>` | Pesan terakhir agent ditulis ke file |
| `--output-schema <FILE>` | JSON Schema untuk bentuk respons akhir |
| `--ephemeral` | Tidak menyimpan file sesi ke disk |
| `--ignore-user-config` | Tidak memuat `$CODEX_HOME/config.toml` (auth tetap dari `CODEX_HOME`) |
| `--ignore-rules` | Tidak memuat file `.rules` execpolicy |
| `-m, --model <MODEL>` | Model agent |
| `-i, --image <FILE>...` | Melampirkan gambar ke prompt awal |
| `--enable` / `--disable <FEATURE>` | Menyalakan atau mematikan feature flag |
| `--add-dir <DIR>` | Direktori tambahan yang boleh ditulis |

**Generasi gambar**
- Didukung lewat tool bawaan **`image_gen`**, bukan flag CLI. `codex features list`: `image_generation  stable  true`. Model memakai tool ini bila prompt meminta gambar. Ada skill bawaan `$imagegen`.
- Mode bawaan memakai login ChatGPT dan **tidak butuh `OPENAI_API_KEY`**. Mode cadangan (`scripts/image_gen.py`, model `gpt-image-2`) butuh `OPENAI_API_KEY`, jadi tidak dipakai Laras.
- `image_gen` tidak punya argumen path tujuan. Hasil disimpan di `$CODEX_HOME/generated_images/...` (`~/.codex/generated_images/`) lalu harus disalin ke lokasi yang diinginkan.
- Kontrol ukuran dan kualitas hanya ada di mode cadangan. Di mode bawaan, rasio hanya bisa diminta lewat prompt.
- Background transparan didukung oleh tool bawaan.
- Sumber: teks instruksi skill `$imagegen` di dalam binary Codex (`strings`), diperiksa pada 0.162.0-alpha dan 0.163.0, ditambah `codex features list`.

**Belum diuji (T-101)**
- Event `--json` yang memuat path gambar di `generated_images`.
- Apakah `AGENTS.md` di folder induk terbaca saat cwd bukan repo git.
- Apakah `~/.codex/AGENTS.md` global ikut terbaca walau `--ignore-user-config` dipakai (file ini ada, saat ini kosong).
- Perilaku daemon app-server bersama (`daemon_auto_start` aktif) saat `exec`; `--no-daemon` hanya ada di level atas, tidak di `exec --help`.
- Durasi per gambar dan pola pesan batas kuota.
- `~/.codex/generated_images/` belum ada di Mac ini, artinya `image_gen` belum pernah dipakai.

## Gotcha dan pelajaran

- **Salinan CLI bawaan jangan dipakai.** Claude desktop app membawa `claude` di `~/Library/Application Support/Claude/claude-code/<versi>/<hash>/claude.app/...`, dan ekstensi ChatGPT di VS Code, Kiro, dan Antigravity membawa `codex` versi alpha. Path-nya berubah setiap update. Sebelum instalasi standalone, inilah satu-satunya salinan di Mac ini.
- **Konfigurasi global pengguna ikut terbawa ke panggilan CLI runtime.** Mac ini punya banyak plugin, hook (SessionStart, UserPromptSubmit), server MCP, dan `~/.claude/CLAUDE.md` global untuk Claude, serta puluhan agent GSD, hook, dan plugin di `~/.codex/config.toml`. Tanpa isolasi, semua ini masuk ke setiap panggilan Laras, memboroskan kuota, dan mencemari prompt. Lihat flag isolasi di atas (T-101, T-102).
- **Paket Claude adalah Team** (dikelola organisasi), bukan langganan pribadi seperti asumsi PRD 2. Pemilik perlu memastikan kebijakan organisasi mengizinkan pemakaian ini.
- **`accent` di shadcn/ui ≠ aksen Laras.** shadcn memakai `accent` untuk latar hover menu. Pemetaan yang benar ada di DESIGN 15: aksen Laras → `primary`, `accent` shadcn → `--surface-hover`.
- **Kontras token DESIGN (dihitung 2026-10-17, rumus WCAG):** `--text-disabled` 2.4–2.9:1 (dikecualikan WCAG). `#8A949B` hanya 2.83:1 di atas `--surface-app`, jadi diganti `#848D94` (3.38 panel, 3.09 app). Teks putih di atas `--danger` mode gelap hanya 2.47:1, jadi ditambah `--danger-on` `#1C1E20` (6.76:1).
- **Folder skill agent:** `.claude/skills` dan `.kiro/skills` adalah symlink ke `.agents/skills` (7.6 MB). Ketiganya di-gitignore; sumbernya tercatat di `skills-lock.json`.

## Keputusan kecil (tanggal, keputusan, alasan)

| Tanggal | Keputusan | Alasan |
|---|---|---|
| 2026-10-17 | Semua rekomendasi audit Tahap A (Q1–Q8) dan perbaikan c-1 sampai c-19 disetujui pemilik | Keputusan pemilik di sesi #1 |
| 2026-10-17 | Pemilik sendiri yang memasang Rust, Claude CLI, Codex CLI, dan identitas git | Installer mengunduh file dan mengubah sistem (Q1, Q2) |
| 2026-10-17 | `⌘Z` / `⇧⌘Z` tetap undo/redo standar; navigasi versi memakai `⌘[` / `⌘]` | Editor teks butuh undo standar; DESIGN prinsip 4 (Q4) |
| 2026-10-17 | `docs/KNOWLEDGE.md` jadi satu-satunya sumber fakta CLI; `VERSIONS.md` tidak dipakai | Hindari dua sumber yang bisa berbeda (Q6) |
| 2026-10-17 | `.agents/`, `.kiro/`, `.claude/skills/` di-gitignore; `skills-lock.json` di-commit | Repo tetap bersih, sumber skill tetap tercatat (Q7) |
| 2026-10-17 | Branch utama `main` | Konvensi umum; `init.defaultBranch` global belum diset |
| 2026-10-17 | Keputusan arsitektur dicatat sebagai ADR-008 (path Node), ADR-009 (identifier dan folder data), ADR-010 (Tailwind v4), ADR-011 (cwd Claude) di ARCHITECTURE 12 | Q3, Q5, c-7, c-12 |
