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
| Rust / cargo | rustc 1.99.1, cargo 1.99.1, rustup 1.29.1, toolchain `stable-aarch64-apple-darwin` (default), target `aarch64-apple-darwin`; di `~/.cargo/bin`, dipasang pemilik 2026-10-18 | `rustc --version`, `rustup target list --installed` |
| Claude CLI | 2.1.302 di `~/.local/bin/claude` (symlink ke `~/.local/share/claude/versions/2.1.302`) | `claude --version` |
| Codex CLI | 0.163.0 di `~/.local/bin/codex` (symlink ke `~/.codex/packages/standalone/current/bin/codex`), dipasang lewat installer standalone, bukan Homebrew | `codex --version` |
| Google Chrome | Terpasang (fallback renderer `channel: "chrome"`) | `ls /Applications` |
| Playwright browsers | Sudah ada di `~/Library/Caches/ms-playwright` (antara lain `chromium-1223`) | `ls ~/Library/Caches/ms-playwright` |

- **PATH aplikasi GUI:** `launchctl getenv PATH` kosong, jadi aplikasi GUI hanya mendapat `/usr/bin:/bin:/usr/sbin:/sbin`. Node (fnm), Claude, Codex, dan cargo tidak ada di sana. `~/.cargo/bin` hanya masuk PATH lewat profil shell (login shell menemukannya).
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

**Hasil uji headless (T-102, 2026-10-18, 4 pemanggilan `claude -p`, Claude Code 2.1.302)**

Perintah yang terverifikasi (fixture di `packages/sidecar/test/fixtures/claude/`), dijalankan dengan cwd di folder project dan stdin ditutup:

```bash
claude -p "<prompt>" --model claude-opus-5-5 --output-format stream-json --verbose \
  --tools "Read" --permission-prompts none --no-session-persistence \
  --setting-sources project --strict-mcp-config --disable-slash-commands
```

- **`stream-json` wajib `--verbose`.** Tanpa `--verbose`, CLI keluar dengan exit 1 dalam 1 detik dan pesan `Error: When using --print, --output-format=stream-json requires --verbose`, sebelum request apa pun (tanpa kuota).
- **Isolasi bekerja dengan `--setting-sources project --strict-mcp-config --disable-slash-commands`.** Event `system/init` menunjukkan `tools: ["Read"]`, `mcp_servers: []`, `slash_commands: []`, `skills: []`, dan `plugins` hanya 4 plugin bawaan (`cc-plugin-sec-default`, `cc-plugin-agents-md`, `cc-plugin-telemetry`, `cc-plugin-plugin-authoring`); plugin pengguna tidak dimuat. Dengan `--include-hook-events` tidak ada event hook sama sekali. `~/.claude/CLAUDE.md` global tidak terbaca (model menjawab `GLOBAL-NO` untuk frasa yang hanya ada di file itu; total input sekitar 4.4k token), sedangkan `CLAUDE.md` di cwd terbaca (penanda `PROJECT-OK`).
- **Login subscription tetap dipakai:** `apiKeySource: "none"`, `model: "claude-opus-5-5"`.
- **`--tools "Read"` benar-benar membatasi:** tidak ada tool shell, model melaporkan tidak bisa menjalankan perintah.
- **`--permission-prompts none` tidak menggantung:** `Read` di dalam cwd berjalan tanpa izin; `Read` ke luar cwd (`/etc/hosts`) ditolak otomatis. Penolakan muncul sebagai event `{"type":"system","subtype":"permission_denied"}`, `tool_result` dengan `is_error: true`, dan daftar `result.permission_denials` (`tool_name`, `tool_use_id`, `tool_input`).
- **`--json-schema <skema>`:** CLI menambah tool `StructuredOutput` (terlihat di `init.tools`); model memanggilnya, `num_turns` menjadi 2. Event `result` memuat `structured_output` (objek tervalidasi) dan `result` (string JSON yang sama). Model bisa menulis teks bebas sebelum memanggil tool, jadi ambil data dari `structured_output`.
- **Urutan event stream-json:** `system/init` → `system/thinking_tokens` (estimasi) → `assistant` (blok `text`/`tool_use`) → `user` (blok `tool_result`) → `rate_limit_event` → `system/post_turn_summary` → `result` (`subtype`, `is_error`, `result`, `num_turns`, `duration_ms`, `total_cost_usd`, `usage`, `permission_denials`, `terminal_reason`).
- **`rate_limit_event`:** `{"type":"rate_limit_event","rate_limit_info":{"status":"allowed","resetsAt":<unix>,"rateLimitType":"five_hour","overageStatus":"rejected","overageDisabledReason":"org_level_disabled","isUsingOverage":false,"unifiedWindows":{"five_hour":{"utilization":0.14,"resetsAt":<unix>}}}}`. Bisa dipakai untuk deteksi kuota dan jam lanjut otomatis. Nilai `status` selain `allowed` belum terlihat.
- **Durasi:** 7–12 detik per panggilan pendek (satu sampai tiga turn).
- **Efek samping:** auto-memory membuat folder kosong `~/.claude/projects/<cwd-ter-encode>/memory/` untuk setiap cwd baru, walau `--no-session-persistence`.

**Belum diuji**
- `--restricted` (tidak dibutuhkan: isolasi di atas sudah cukup).
- Nilai `rate_limit_info.status` dan pesan error saat kuota benar-benar habis.
- Cara mematikan auto-memory tanpa `--bare`.

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

**Hasil uji generasi gambar (T-101, 2026-10-18, 2 panggilan `codex exec`, Codex 0.163.0)**

Panggilan yang dipakai (fixture di `packages/sidecar/test/fixtures/codex/`):
1. `codex exec --cd <proyek>/jobs/job-1/assets --sandbox workspace-write --skip-git-repo-check --json --ephemeral --ignore-user-config "<prompt>"`
2. `codex exec --cd <proyek> --sandbox read-only --skip-git-repo-check --json --ephemeral --ignore-user-config "<prompt>" < /dev/null`

- **Generasi gambar berhasil di kedua panggilan**, exit 0, tanpa `OPENAI_API_KEY`. Prompt cukup meminta "use your built-in image generation tool"; di panggilan 2 agent menyebut memakai skill `imagegen`.
- **Lokasi file:** `~/.codex/generated_images/<thread_id>/exec-<uuid>.png`. `<thread_id>` sama dengan nilai `thread_id` di event pertama `{"type":"thread.started","thread_id":...}`. Adapter bisa menemukan gambar secara deterministik dari folder itu, tanpa membaca teks jawaban model.
- **Stream `--json` tidak memuat event gambar.** Isinya hanya `thread.started`, `turn.started`, `item.completed` (tipe `agent_message`), dan `turn.completed` (berisi `usage`: `input_tokens`, `cached_input_tokens`, `output_tokens`, `reasoning_output_tokens`). Model yang dipakai tidak tercantum di event.
- **Ukuran:** permintaan "portrait, aspect ratio 4:5" menghasilkan 1122 × 1402 px (rasio 0.8003) di kedua panggilan; PNG RGB tanpa alpha, sekitar 2.5 MB. Cukup di-resize ke 1080 × 1350 dengan crop yang dapat diabaikan.
- **Teks di gambar:** kedua gambar bebas teks, huruf, logo, dan watermark dengan larangan eksplisit di prompt (dilihat langsung).
- **`AGENTS.md`:** tanpa repo git, hanya `AGENTS.md` di cwd yang terbaca. Dengan cwd `jobs/job-1/assets`, `AGENTS.md` di folder project (dua tingkat di atas) tidak terbaca; dengan cwd folder project, terbaca (penanda `AGENTS-OK` muncul) dan palet brand di dalamnya dipakai pada gambar. `--ignore-user-config` tidak mematikan pembacaan `AGENTS.md` project.
- **Sandbox `read-only` cukup** untuk generasi gambar, karena file ditulis Codex ke `CODEX_HOME`, bukan oleh agent ke workspace.
- **Durasi:** 43 dan 45 detik per gambar (satu gambar per panggilan).
- **Konsumsi token:** 52.5k input (32k cached) dan 79k input (55k cached) per panggilan, walau `--ignore-user-config`. Konteks dasar Codex besar; ini relevan untuk kuota.
- **stdin:** `codex exec` mencetak "Reading additional input from stdin..." ke stderr ketika stdin bukan TTY, termasuk dengan `< /dev/null` (langsung EOF). Adapter wajib menutup stdin (`stdio: ["ignore", ...]`). Belum diuji: proses menggantung bila stdin berupa pipe yang tidak pernah ditutup.

**Belum diuji**
- Apakah `~/.codex/AGENTS.md` global ikut terbaca walau `--ignore-user-config` dipakai (file ini ada, saat ini kosong; tidak diubah agar tidak menyentuh konfigurasi pemilik).
- Perilaku daemon app-server bersama (`daemon_auto_start` aktif) saat `exec`. Tidak ada masalah terlihat di dua panggilan; `--no-daemon` hanya ada di level atas.
- Pola pesan batas kuota (tidak terpicu).
- Permintaan ukuran selain 4:5 dan background transparan.

## Gotcha dan pelajaran

- **Salinan CLI bawaan jangan dipakai.** Claude desktop app membawa `claude` di `~/Library/Application Support/Claude/claude-code/<versi>/<hash>/claude.app/...`, dan ekstensi ChatGPT di VS Code, Kiro, dan Antigravity membawa `codex` versi alpha. Path-nya berubah setiap update. Sebelum instalasi standalone, inilah satu-satunya salinan di Mac ini.
- **Konfigurasi global pengguna ikut terbawa ke panggilan CLI runtime.** Mac ini punya banyak plugin, hook (SessionStart, UserPromptSubmit), server MCP, dan `~/.claude/CLAUDE.md` global untuk Claude, serta puluhan agent GSD, hook, dan plugin di `~/.codex/config.toml`. Tanpa isolasi, semua ini masuk ke setiap panggilan Laras, memboroskan kuota, dan mencemari prompt. Lihat flag isolasi di atas (T-101, T-102).
- **Paket Claude adalah Team** (dikelola organisasi), bukan langganan pribadi seperti asumsi PRD 2. Pemilik perlu memastikan kebijakan organisasi mengizinkan pemakaian ini.
- **`accent` di shadcn/ui ≠ aksen Laras.** shadcn memakai `accent` untuk latar hover menu. Pemetaan yang benar ada di DESIGN 15: aksen Laras → `primary`, `accent` shadcn → `--surface-hover`.
- **Kontras token DESIGN (dihitung 2026-10-17, rumus WCAG):** `--text-disabled` 2.4–2.9:1 (dikecualikan WCAG). `#8A949B` hanya 2.83:1 di atas `--surface-app`, jadi diganti `#848D94` (3.38 panel, 3.09 app). Teks putih di atas `--danger` mode gelap hanya 2.47:1, jadi ditambah `--danger-on` `#1C1E20` (6.76:1).
- **Folder skill agent:** `.claude/skills` dan `.kiro/skills` adalah symlink ke `.agents/skills` (7.6 MB). Ketiganya di-gitignore; sumbernya tercatat di `skills-lock.json`.
- **TypeScript 7 (native) dipakai sejak T-003.** Versi 7.0.2 rilis 2026-07-08; `tsc --version` mencetak `Version 7.0.2`. Laras tidak memakai alat yang bergantung pada API JS TypeScript lama (lint memakai Biome).
- **Vitest 5 `test.projects` gagal bila glob tidak cocok dengan folder apa pun** ("No projects were found"). Selama semua paket memakai lingkungan yang sama, pakai `test.include` di root.
- **`pnpm -r --if-present <skrip>` tanpa paket workspace** mencetak "No projects matched" tetapi exit 0.
- **`biome init` (2.5.15) default memakai indentasi tab.** Laras memakai 2 spasi dan `lineWidth` 100 (`biome.json`).

- **Tauri 2 di Laras (T-007):** CLI `@tauri-apps/cli` 2.12.3, crate `tauri` 2.12.4, `tauri-build` 2.7.3. Opsi jendela macOS dari `config.schema.json`: `titleBarStyle` bernilai `"Visible"`, `"Transparent"`, atau `"Overlay"`; `hiddenTitle` (bool); `minWidth`/`minHeight`; `theme` dibiarkan kosong agar mengikuti tema sistem; `trafficLightPosition` untuk posisi tombol jendela.
- **`tauri init --ci` menambahkan `tauri-plugin-log` dan crate `log`** ke template, serta identifier `com.tauri.dev`. Keduanya dihapus/diganti di Laras (Rust minimal, ADR-009).
- **Title bar `Overlay` menutup area seret bawaan.** Jendela hanya bisa digeser lewat elemen `data-tauri-drag-region`, dan itu butuh izin `core:window:allow-start-dragging` di capability. Nama izin divalidasi saat build: izin yang salah membuat build gagal.
- **`cargo` hanya ada di PATH login shell.** Jalankan `pnpm dev` atau `cargo` lewat `/bin/zsh -lic '...'` dari proses yang tidak memuat profil shell.
- **Sesi agent tidak punya izin Screen Recording** (`CGPreflightScreenCaptureAccess()` = false), jadi `screencapture -l <id>` gagal ("could not create image from window"). Verifikasi visual jendela native perlu dilihat pemilik; HTML/CSS bisa dicek di browser bawaan lewat `http://localhost:1420`.
- **Jendela Tauri dev bisa terbuka dengan `onscreen=false`** di CGWindowList (misalnya di Space lain), walaupun prosesnya berjalan.

- **Node 22.22 menjalankan file `.ts` langsung** (type stripping aktif tanpa flag, tanpa ExperimentalWarning di Mac ini): `node scripts/lint-tokens.ts`. Syaratnya sintaks yang bisa dihapus saja (tanpa `enum` atau parameter property) dan impor relatif memakai ekstensi `.ts`, sehingga tsconfig root butuh `allowImportingTsExtensions`.

- **Biome 2.5 dan Tailwind v4:** directive Tailwind (`@theme`, `@apply`) membuat Biome gagal parse kecuali `css.parser.tailwindDirectives: true`. Formatter Biome juga menulis ulang `tokens.css` (satu deklarasi per baris, hex huruf kecil), jadi file itu dikecualikan dari formatter agar tetap identik dengan DESIGN 15.
- **`@theme inline` tidak membuat variabel `--color-*` di `:root`**; nilainya langsung disisipkan ke utility yang dipakai. Jadi `getPropertyValue("--color-primary")` kosong, dan itu normal.
- **Spacing Tailwind v4 berbasis rem** (`--spacing: .25rem`): `h-11` = 44 px selama ukuran font root 16 px.

- **Membaca isi WebView Tauri tanpa screenshot:** jalankan Vite dengan config diagnostik sementara yang menyuntik skrip lewat `transformIndexHtml` dan menerima laporan di middleware `/__diag` (ditulis ke file), lalu `pnpm tauri dev --config '{"build":{"beforeDevCommand":""}}'` agar Tauri memakai server itu. User agent WebView: `AppleWebKit/605.1.15`, `window.__TAURI_INTERNALS__` ada. Config diagnostik tidak di-commit.

- **Diagnostik WebView tidak merekam peralihan Appearance saat jendela Laras di belakang.** Saat pemilik mengganti Appearance di System Settings (Laras tidak di depan), tidak ada event `change` dari `matchMedia` maupun hasil polling 1 detik yang terkirim, padahal latar terlihat berubah gelap. Dugaan (belum diuji): WebKit/macOS memperlambat timer dan fetch WebView aplikasi latar belakang. Untuk mengukur dark di jendela native: ganti ke Dark, lalu klik jendela Laras agar event `focus` mengirim laporan.
- **Jendela kosong di Fase 0 itu disengaja** (PRD 11). Latar `#F3F5F6` sangat terang dan mudah dikira "blank"; jelaskan ke pemilik sebelum verifikasi visual.

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
