# PRD — TIVAsk (TI Virtual Assistant School Knowledge)

**Program:** DIGIForward — Seri DIGIFORWARD/RT/1.0/2026
**Tim:** SMK Negeri 1 Adiwerna – Adaptiva
**Fase:** Hackathon (11–12 September 2026)
**Versi Dokumen:** 2.1 — Revised PRD (patch terarah atas v2.0)
**Status:** Source of truth untuk development
**Pasangan teknis:** `TRD-TIVAsk-Revised.md`

---

## 0. Ringkasan Perubahan dari Draft Prototype

Dokumen ini adalah hasil review dan penyempurnaan dari `PRD-TIVAsk-DIGIForward.md` (draft v1.0). Tujuan utama produk **tidak diubah**. Perubahan yang dilakukan:

- Menstrukturkan ulang dokumen mengikuti format PRD standar (Overview → Persona → Scope → User Journey → FR → AC → NFR → AI Behaviour → Error States → DoD) agar dapat dikonsumsi coding agent tanpa ambiguitas.
- Memecah requirement menjadi ID unik per modul (`FR-XXX-NNN`) beserta Acceptance Criteria Given/When/Then.
- Mengeksplisitkan beberapa hal yang di draft prototype masih implisit (lihat `Assumptions & Technical Decisions` di bagian akhir).
- Tidak menambahkan fitur besar baru di luar yang sudah ada di draft.
- Patch v2.1: menu teks dua tingkat tanpa Gemini, histori eskalasi dengan maksimal satu pending, dedup WhatsApp persisten, eligibility KB bersama, validasi atribusi evidence, SDK `@google/genai`, dan autentikasi JWT melalui HttpOnly cookie. Scope hackathon, strategi QA, serta milestone M0–M7 dipertahankan.

---

## 1. Product Overview

**Nama produk:** TIVAsk (TI Virtual Assistant School Knowledge)

**Problem statement:**
Orang tua/wali calon siswa berulang kali menanyakan pertanyaan yang sama seputar PPDB/SPMB (jalur pendaftaran, biaya, syarat dokumen, jadwal daftar ulang, jurusan, kegiatan) melalui pesan manual ke panitia sekolah. Informasi di brosur/media sosial bersifat pasif dan mudah tertimbun, sehingga balasan panitia sering lambat dan repetitif.

**Tujuan:**
Menyediakan asisten percakapan berbasis AI di WhatsApp yang menjawab pertanyaan calon wali murid secara instan, akurat, dan bersumber dari data resmi sekolah (Knowledge Base yang dikelola panitia), dengan jalur eskalasi otomatis ke admin manusia ketika AI tidak memiliki jawaban yang cukup grounded.

**Target pengguna:**
1. Orang tua/wali calon siswa yang mencari informasi PPDB via WhatsApp.
2. Admin/panitia sekolah yang mengelola Knowledge Base dan menangani eskalasi.

**Value proposition:**
- Untuk orang tua: jawaban cepat (hitungan detik), 24/7, tanpa install aplikasi baru, lewat kanal yang sudah familiar (WhatsApp).
- Untuk panitia: bebas dari pertanyaan repetitif, satu antarmuka terpusat untuk mengelola konten dan menangani kasus yang butuh sentuhan manusia, tanpa perlu bantuan developer untuk update konten.

---

## 2. User Persona

| Persona | Kebutuhan Utama | Touchpoint | Tingkat Literasi Digital |
|---|---|---|---|
| **Orang tua/wali calon siswa** (pengguna utama) | Jawaban cepat, akurat, tanpa install app baru, bisa diakses kapan saja termasuk malam/hari libur | WhatsApp (chat dengan bot) | Bervariasi — bahasa bot harus sederhana, ramah, lintas usia |
| **Admin/panitia sekolah** | Mudah menautkan nomor WA sekolah, mengelola isi Knowledge Base tanpa bantuan developer, memantau dan membalas manual saat terjadi fallback | Web Admin Panel | Asumsi melek komputer dasar (staf tata usaha/panitia PPDB) |

---

## 3. Product Scope (MoSCoW)

### Must Have
- M1. Autentikasi admin (login).
- M2. Koneksi WhatsApp lewat scan QR Code, status koneksi tersimpan dan dapat dipantau (connected/disconnected/pairing).
- M3. CRUD Knowledge Base (kategori, judul, isi jawaban, tanggal berlaku opsional, status aktif).
- M4. Bot membalas otomatis: sapaan pertama → menu teks bernomor → user memilih topik **atau** mengetik bebas.
- M5. AI (Gemini) menjawab pertanyaan bebas dengan konteks dari Knowledge Base (RAG berbasis kategori/kata kunci, bukan vector search).
- M6. Fallback otomatis ke admin saat pertanyaan di luar cakupan Knowledge Base atau bersifat pribadi/administratif spesifik.
- M7. Inbox percakapan di Admin Panel: melihat histori chat per kontak, membalas manual untuk kasus fallback, menandai eskalasi selesai.

### Should Have
- S1. Menu builder (admin mengatur urutan & label menu teks bernomor tanpa mengubah kode).
- S2. Dashboard ringkas (jumlah percakapan, top pertanyaan, rasio fallback vs terjawab otomatis).
- S3. Dark/light mode dan notifikasi toast di Admin Panel.
- S4. Indikator tanggal berlaku informasi ditampilkan pada jawaban AI ke user.

### Could Have
- C1. Filter/pencarian pada tabel Knowledge Base dan Inbox.
- C2. Export sederhana daftar pertanyaan yang sering fallback (untuk bahan evaluasi konten KB pasca-hackathon).

### Won't Have (di luar cakupan hackathon)
- W1. Multi-sekolah/multi-tenant.
- W2. Vector search/semantic search skala besar (embedding database khusus).
- W3. Role & permission admin bertingkat (single role: admin).
- W4. Integrasi pembayaran atau sistem akademik lain.
- W5. Training/fine-tuning model AI sendiri.
- W6. Dukungan multi-media (gambar/dokumen/voice note) sebagai input yang diproses AI.
- W7. Dukungan multi-nomor WhatsApp (satu sekolah = satu sesi WhatsApp aktif).

---

## 4. User Journey

### Flow A — User pertama kali chat TIVAsk
1. Orang tua mengirim pesan apa pun ke nomor WhatsApp sekolah untuk pertama kali (belum ada `Conversation` tercatat, atau `Conversation` lama berstatus `resolved` — lihat Flow konteks di bagian AI Behaviour).
2. Sistem membuat/menemukan `Conversation` untuk nomor tersebut.
3. Bot membalas dengan sapaan singkat + mengirim **Menu Utama** berupa teks bernomor, hanya berisi `MenuItem` aktif yang kategorinya memiliki minimal satu entri eligible (FR-KB-005). Pesan pertama yang lolos filter memicu sapaan/menu; pertanyaan bebas dapat dikirim berikutnya. Jika tidak ada kategori eligible, lanjut Flow E.

### Flow B — User memilih menu
1. User membalas nomor pada menu terakhir; `1`, `1.`, `nomor 1`, dan `menu 1` berarti pilihan yang sama setelah trim dan normalisasi huruf.
2. Menu Utama memetakan nomor ke `MenuItem.categoryRef`, dengan urutan `order ASC, id ASC`. Hanya kategori dengan entri eligible yang ditampilkan.
3. Bot mengirim sub-menu teks bernomor berisi judul seluruh entries eligible pada kategori tersebut, terurut `title ASC, id ASC`; termasuk jika hanya ada satu entri. Nomor sub-menu dipetakan ke ID entri, bukan memilih entri pertama secara implisit.
4. User memilih nomor entri pada sub-menu; bot memeriksa ulang eligibility dan mengirim `content` terbaru dari entri itu, mencatat `matchedKbId`. Seluruh alur menu, termasuk pilihan tidak valid, **tidak memanggil Gemini**.
5. Nomor mengikuti snapshot menu terakhir pada conversation (TRD §12.1), sehingga perubahan urutan oleh admin tidak mengalihkan pilihan ke entri berbeda. `menu` atau `0` menampilkan ulang Menu Utama; ini hanya navigasi, bukan reset histori.
6. Nomor di luar pilihan atau snapshot tidak tersedia → tampilkan petunjuk/menu terkini tanpa Gemini. Entri yang sudah dihapus, nonaktif, atau expired tidak dikirim: tampilkan sub-menu terkini; jika kategori tidak punya entri eligible → Flow E. Kategori yang hilang/nonaktif → tampilkan Menu Utama terkini; jika kosong → Flow E.
7. Pertanyaan natural yang bukan perintah/pilihan menu → Flow C. Saat `escalated`, FR-CHAT-004 tetap mengalahkan seluruh balasan otomatis menu.

### Flow C — User mengetik pertanyaan bebas
1. User mengetik pertanyaan dalam bahasa natural (bukan perintah/pilihan menu).
2. Sistem menjalankan pipeline retrieval (lihat TRD §10) untuk mencari evidence dari Knowledge Base.
3. Evidence + pertanyaan dikirim ke Gemini dengan system prompt yang mengunci jawaban hanya dari evidence yang diberikan.
4. Sistem menentukan apakah jawaban grounded (lanjut Flow D) atau tidak (lanjut Flow E).

### Flow D — Pertanyaan berhasil dijawab berdasarkan sumber resmi
1. Gemini menghasilkan jawaban yang tervalidasi grounded terhadap evidence.
2. Sistem mencatat `Message` (sender: bot) dengan `matchedKbId` terisi.
3. Bot mengirim jawaban ke WhatsApp dalam bahasa ringkas dan ramah.
4. (Should Have) Jika entri KB memiliki `validUntil`, tampilkan info tanggal berlaku pada jawaban.

### Flow E — Pertanyaan tidak memiliki sumber yang cukup
1. Evidence tidak ditemukan, atau Gemini menandakan informasi tidak cukup untuk menjawab.
2. Sistem **tidak** mengirim jawaban spekulatif.
3. Sistem membuat atau menggunakan kembali `Escalation` berstatus `pending`, tertaut ke `Conversation`. Relasi menyimpan histori one-to-many; maksimal satu tiket pending per conversation pada satu waktu, termasuk saat request bersamaan.
4. Hanya saat tiket pending baru dibuat, bot membalas user dengan konfirmasi bahwa pertanyaan diteruskan ke panitia dan admin akan merespons; penggunaan ulang tiket tidak mengirim konfirmasi ganda.
5. `Conversation.status` diubah menjadi `escalated`.

### Flow F — Pertanyaan sensitif/personal dan harus dieskalasikan
1. Sistem mendeteksi pertanyaan bersifat pribadi/administratif spesifik (mis. menyebut nomor pendaftaran pribadi, komplain, data pribadi calon siswa) melalui daftar keyword/pola yang dikonfigurasi (lihat Assumptions).
2. Sistem langsung membuat/menggunakan kembali tiket pending `Escalation` **tanpa** memanggil Gemini untuk menjawab isi pertanyaan (mencegah AI memproses data pribadi tanpa perlu).
3. Lanjut seperti Flow E langkah 4–5.

### Flow G — Admin menerima fallback
1. `Escalation` baru muncul di Inbox Admin Panel dengan badge status `pending`.
2. Admin dapat melihat histori percakapan penuh terkait eskalasi tersebut.

### Flow H — Admin membalas pengguna
1. Admin mengetik balasan manual di detail percakapan.
2. Sistem mengirim balasan tersebut ke WhatsApp user melalui gateway, mencatat `Message` (sender: admin).
3. Admin menandai `Escalation` sebagai `handled`/resolved bila dianggap selesai.
4. Resolve tiket pending dan perubahan `Conversation.status` ke `active` dilakukan atomik. Tiket `handled` tetap tersimpan; fallback berikutnya membuat tiket pending baru pada conversation yang sama. Mengulang resolve tiket lama mengembalikan hasil yang sama tanpa membuka conversation yang memiliki tiket pending baru.

### Flow I — Admin mengelola Knowledge Base
1. Admin login ke Admin Panel.
2. Admin membuka halaman Knowledge Base, melakukan create/update/delete/nonaktifkan entri.
3. Perubahan langsung tersedia untuk bot pada request berikutnya (tanpa redeploy), karena bot query KB dari database secara real-time.

---

## 5. Functional Requirements

### Modul Autentikasi (AUTH)
- **FR-AUTH-001** — Sistem harus menyediakan endpoint login admin dengan email + password.
- **FR-AUTH-002** — Password admin harus disimpan dalam bentuk hash, tidak pernah plaintext.
- **FR-AUTH-003** — Semua endpoint Admin Panel (selain login) harus dilindungi autentikasi; request tanpa JWT valid pada HttpOnly cookie ditolak dengan 401; tidak ada alternatif Bearer token pada MVP.
- **FR-AUTH-004** — Sistem harus menyediakan logout yang menghapus cookie sesi. JWT stateless berlaku maksimal 8 jam; pencabutan token yang sudah disalin sebelum expiry tidak disediakan pada MVP (TRD §9).

### Modul Knowledge Base (KB)
- **FR-KB-001** — Admin dapat membuat entri Knowledge Base baru (kategori, judul, isi jawaban, tanggal berlaku opsional).
- **FR-KB-002** — Admin dapat mengubah entri Knowledge Base yang sudah ada.
- **FR-KB-003** — Admin dapat menonaktifkan (soft) atau menghapus entri Knowledge Base.
- **FR-KB-004** — Admin dapat melihat daftar seluruh entri Knowledge Base beserta status aktif/nonaktif.
- **FR-KB-005** — Eligibility KB wajib sama pada retrieval dan menu: `isActive=true AND (validUntil IS NULL OR validUntil >= now)`. Batas waktu inklusif; gunakan waktu server dan shared eligibility logic. Periksa ulang sebelum mengirim jawaban; entri nonaktif/expired tidak boleh digunakan (TRD §10.3).

### Modul Menu Teks Bernomor (MENU)
- **FR-MENU-001** — Admin dapat melihat, membuat, mengubah urutan, dan menonaktifkan `MenuItem` yang tertaut ke kategori KB.
- **FR-MENU-002** — Sistem harus mengirim Menu Utama teks bernomor sesuai Flow A–B. `MenuItem` aktif terurut `order ASC, id ASC`, hanya kategori dengan entri eligible. Menu/sub-menu dan parser pilihan wajib tersedia; UI menu builder S1 tetap Should Have, dapat memakai konfigurasi seed untuk menu MVP.

### Modul WhatsApp Gateway (WA)
- **FR-WA-001** — Sistem harus dapat menghasilkan QR Code untuk pairing sesi WhatsApp dan menampilkannya di Admin Panel.
- **FR-WA-002** — Sistem harus menyimpan dan memperbarui status sesi WhatsApp (`pairing`/`connected`/`disconnected`) secara real-time/near real-time agar dapat dipantau dari Admin Panel.
- **FR-WA-003** — Sistem harus mempertahankan sesi WhatsApp antar-restart proses (tanpa perlu scan ulang QR) selama sesi masih valid.
- **FR-WA-004** — Sistem harus mengabaikan pesan yang berasal dari grup, broadcast, dan pesan dari nomor bot itu sendiri (self-message).
- **FR-WA-005** — Sistem harus memfilter pesan kosong, pesan berupa media (gambar/dokumen/voice note/stiker), dan pesan duplikat/stale sebelum masuk ke pipeline AI (lihat FR-CHAT dan Error States §9 untuk perilaku balasan).

### Modul Percakapan & Chat (CHAT)
- **FR-CHAT-001** — Sistem harus membuat `Conversation` baru untuk nomor kontak yang belum pernah memulai percakapan, atau melanjutkan `Conversation` aktif yang sudah ada.
- **FR-CHAT-002** — Setiap pesan masuk yang diterima setelah filter dan pesan keluar harus dicatat sebagai `Message` dengan `sender` (`user`/`bot`/`admin`) dan timestamp. Pesan WhatsApp masuk menyimpan `externalMessageId = message.id._serialized` dengan unique constraint untuk dedup persisten sebelum efek samping; pesan yang diabaikan tidak wajib dicatat (TRD §12).
- **FR-CHAT-003** — Sistem harus membedakan input berupa pilihan teks bernomor pada menu terakhir vs. teks bebas, dan memproses sesuai Flow B/Flow C.
- **FR-CHAT-004** — Ketika `Conversation.status = escalated`, bot tidak boleh mengirim balasan otomatis untuk pesan user berikutnya sampai admin menandai eskalasi selesai (lihat Flow H).

### Modul RAG / AI (RAG)
- **FR-RAG-001** — Untuk setiap pertanyaan bebas, sistem harus melakukan retrieval evidence dari Knowledge Base sebelum memanggil Gemini.
- **FR-RAG-002** — System prompt Gemini harus secara eksplisit membatasi jawaban hanya berdasarkan evidence yang disertakan dalam konteks.
- **FR-RAG-003** — Sistem harus dapat mendeteksi dari respons Gemini apakah jawaban tersebut grounded atau tidak, dan memicu fallback bila tidak grounded. Backend memverifikasi `sourceKbIds` berasal dari evidence yang dikirim dan setiap `supportingEvidence.text` benar-benar terdapat pada `content` sumber terkait. JSON salah, atribusi tidak valid, atau eligibility gagal → fallback (TRD §10.5–10.7). Validasi ini bukan jaminan semantik 100%.
- **FR-RAG-004** — Setiap `Message` dari bot yang merupakan hasil AI harus mencatat entri KB utama yang menjadi dasar jawaban (`matchedKbId`), untuk keperluan traceability.

### Modul Eskalasi (ESC)
- **FR-ESC-001** — Sistem harus membuat `Escalation` berstatus `pending` ketika retrieval tidak menemukan evidence cukup, Gemini menandakan tidak grounded, atau terdeteksi kata kunci sensitif. Gunakan tiket pending yang sudah ada; histori tiket handled dipertahankan dan fallback baru setelah resolve membuat tiket baru. Aturan maksimal satu pending harus tahan concurrency.
- **FR-ESC-002** — Admin dapat melihat daftar `Escalation` beserta status (`pending`/`handled`) di Inbox.
- **FR-ESC-003** — Admin dapat membalas manual pesan pada percakapan yang berstatus `escalated`.
- **FR-ESC-004** — Admin dapat menandai `Escalation` sebagai selesai (`handled`), secara atomik dengan pengembalian `Conversation.status` menjadi `active`. Resolve ulang tiket handled bersifat idempotent dan tidak mengubah status conversation/tiket pending yang lebih baru.

### Modul Admin Panel — Inbox (INBOX)
- **FR-INBOX-001** — Admin dapat melihat daftar seluruh `Conversation`, dengan indikator status (`active`/`escalated`/`resolved`) dan waktu pesan terakhir.
- **FR-INBOX-002** — Admin dapat membuka detail sebuah `Conversation` untuk melihat seluruh histori `Message`.
- **FR-INBOX-003** — Admin dapat memfilter daftar percakapan berdasarkan status (minimal: semua / escalated).

---

## 6. Acceptance Criteria (untuk semua fitur Must Have)

**AC-AUTH-001**
- Given admin memasukkan email dan password yang benar
- When admin menekan tombol login
- Then sistem memasang JWT pada HttpOnly cookie, body respons hanya berisi profil admin tanpa token, dan admin diarahkan ke Dashboard/Admin Panel

**AC-AUTH-002**
- Given admin memasukkan password yang salah
- When admin menekan tombol login
- Then sistem menolak login dengan pesan error yang jelas dan tidak membocorkan apakah email terdaftar atau tidak

**AC-WA-001**
- Given admin membuka halaman "Hubungkan WhatsApp" dan sesi belum terhubung
- When halaman dimuat
- Then sistem menampilkan QR Code yang valid untuk dipindai

**AC-WA-002**
- Given QR Code berhasil dipindai dari perangkat WhatsApp sekolah
- When proses pairing selesai
- Then status sesi berubah menjadi `connected` dan tampil secara real-time/near real-time di Admin Panel tanpa perlu reload manual

**AC-KB-001**
- Given admin mengisi form Knowledge Base dengan data valid (kategori, judul, isi jawaban)
- When admin menekan simpan
- Then entri baru tersimpan dan langsung muncul di daftar Knowledge Base

**AC-KB-002**
- Given sebuah entri Knowledge Base diubah isinya oleh admin
- When user WhatsApp mengajukan pertanyaan yang match dengan entri tersebut setelah perubahan
- Then bot membalas dengan isi jawaban yang sudah diperbarui (tanpa redeploy backend)

**AC-CHAT-001**
- Given kontak WhatsApp baru mengirim pesan pertama kali
- When pesan diterima sistem
- Then bot membalas Menu Utama teks bernomor berisi kategori dengan MenuItem aktif dan entri eligible, tanpa Gemini

**AC-CHAT-002**
- Given Menu Utama terakhir memiliki kategori dengan beberapa entri eligible
- When user memilih kategori, kemudian memilih nomor entri pada sub-menu menggunakan `1`, `1.`, `nomor 1`, atau `menu 1` sesuai nomor yang tersedia
- Then bot menampilkan sub-menu judul entries dalam urutan stabil lalu mengirim content terbaru tepat dari ID entri pilihan; total panggilan Gemini = 0

**AC-CHAT-003**
- Given user menerima menu, kemudian admin mengubah urutan atau menonaktifkan/menghapus entri
- When user memilih nomor lama, nomor di luar rentang, atau `menu`/`0`
- Then nomor lama tetap merujuk ID pada snapshot; entri tidak eligible tidak dikirim, menu diperbarui sesuai Flow B, kategori kosong fallback, dan tidak ada panggilan Gemini

**AC-KB-003**
- Given entries dengan isActive false, validUntil null, sebelum now, tepat now, dan sesudah now
- When retrieval atau menu menyeleksi sumber pada waktu server yang sama
- Then hanya isActive true dengan validUntil null atau >= now yang eligible; aturan juga diperiksa ulang sebelum jawaban dikirim

**AC-WA-003**
- Given satu externalMessageId WhatsApp sudah dicatat
- When event identik datang kembali, bersamaan, atau setelah restart
- Then tidak ada Message kedua, balasan ganda, panggilan Gemini tambahan, atau tiket tambahan dari event tersebut

**AC-RAG-001**
- Given user mengetik pertanyaan bebas yang jawabannya tersedia jelas di salah satu entri KB aktif
- When sistem menjalankan pipeline RAG
- Then bot membalas jawaban yang sesuai isi KB tersebut dan mencatat `matchedKbId` yang benar

**AC-RAG-002**
- Given user mengetik pertanyaan bebas yang topiknya tidak tercakup di entri KB manapun
- When sistem menjalankan pipeline RAG
- Then sistem tidak menghasilkan jawaban spekulatif, melainkan memicu fallback (Escalation dibuat, `Conversation.status` menjadi `escalated`)

**AC-ESC-001**
- Given sebuah `Escalation` berstatus `pending` telah dibuat
- When admin membuka Inbox
- Then eskalasi tersebut tampil dengan badge/indikator status pending

**AC-ESC-002**
- Given admin membalas manual pada percakapan berstatus `escalated`
- When balasan dikirim
- Then pesan tersebut diteruskan ke WhatsApp user dan tercatat sebagai `Message` dengan sender `admin`

**AC-ESC-003**
- Given admin menandai sebuah `Escalation` sebagai `handled`
- When user pada percakapan tersebut mengirim pesan baru
- Then bot kembali dapat merespons otomatis (Conversation tidak lagi terkunci di mode escalated)


**AC-ESC-004**
- Given conversation memiliki tiket handled dari fallback pertama
- When fallback berikutnya terjadi dan dua pemroses mencoba membuat tiket bersamaan
- Then histori lama tetap ada, tepat satu tiket pending baru dibuat, dan maksimal satu konfirmasi dikirim; resolve ulang tiket lama tidak membuka conversation yang sedang escalated

**AC-RAG-003**
- Given respons Gemini terstruktur memiliki source ID yang tidak dikirim, kutipan yang tidak terdapat pada content sumber, atau sumber yang sudah tidak eligible
- When backend menjalankan grounding validation
- Then jawaban AI ditolak dan fallback dijalankan; kasus atribusi valid dapat lolos, tetapi tidak diklaim sebagai jaminan semantik 100%

**AC-AUTH-003**
- Given admin sudah login melalui HttpOnly cookie
- When logout dilakukan, lalu browser mengakses endpoint terproteksi tanpa cookie valid (termasuk request Bearer-only)
- Then cookie dihapus, cache profil dibersihkan, dan akses ditolak 401

---

## 7. Non-Functional Requirements

| Kategori | Requirement |
|---|---|
| **Reliability** | Backend (termasuk proses WhatsApp gateway) harus berjalan persisten selama sesi demo/operasional; sesi WhatsApp dipertahankan lewat `LocalAuth` agar tidak perlu scan ulang QR setiap restart proses. |
| **Security** | Password admin di-hash (bcrypt/argon2); seluruh endpoint Admin Panel diproteksi autentikasi; environment variable (API key Gemini, DB URL, secret token) tidak boleh hardcode atau ter-commit ke repository. |
| **Response Time** | Balasan menu (tanpa panggil AI) < 5 detik. Balasan berbasis AI generatif < 10 detik dalam kondisi normal. |
| **Usability** | Bahasa bot ringkas, ramah, dan dapat dipahami lintas usia serta tingkat literasi digital yang bervariasi. Admin Panel harus dapat digunakan oleh staf non-developer. |
| **Maintainability** | Perubahan Knowledge Base dan menu tidak memerlukan perubahan kode maupun redeploy. |
| **Observability** | Setiap keputusan AI (grounded/fallback) harus dapat ditelusuri: query, evidence yang ditemukan, evidence yang dipilih, hasil grounding, dan alasan fallback (lihat TRD §14). |
| **Data Integrity** | Setiap `Message` hasil AI harus tertaut ke evidence yang benar-benar digunakan (`matchedKbId`), tidak boleh kosong ketika jawaban diklaim grounded. |
| **Error Handling** | Kegagalan pada layanan eksternal (Gemini, WhatsApp, database) tidak boleh membuat sistem crash; harus ada fallback/pesan error yang informatif (lihat §9). |
| **AI Grounding** | AI tidak boleh menjawab pertanyaan faktual tanpa evidence yang memadai dari Knowledge Base (lihat §8). |

---

## 8. AI Behaviour Requirements

1. **Sumber jawaban** — Bot hanya boleh menjawab pertanyaan faktual berdasarkan konten Knowledge Base aktif. Bot tidak boleh menggunakan pengetahuan umum model (world knowledge) untuk menjawab pertanyaan terkait sekolah/PPDB.
2. **Larangan mengarang** — Jika evidence tidak mencukupi untuk menjawab, bot **wajib** menolak menjawab secara spekulatif dan memicu fallback ke admin (bukan menebak atau menghasilkan jawaban "terdengar masuk akal").
3. **Traceability** — Setiap jawaban AI harus dapat ditelusuri ke minimal satu entri Knowledge Base spesifik (`matchedKbId`). Jawaban tanpa entri yang dapat ditelusuri dianggap tidak valid dan harus fallback.
4. **Kondisi wajib fallback**, minimal mencakup:
   - Tidak ada entri KB yang relevan ditemukan pada tahap retrieval.
   - Evidence ditemukan tetapi tidak cukup untuk menjawab pertanyaan secara spesifik.
   - Pertanyaan mengandung indikasi data pribadi/administratif spesifik (nomor pendaftaran pribadi, komplain, dsb).
   - Gemini secara eksplisit menandakan tidak dapat menjawab dari konteks yang diberikan.
   - Terjadi kegagalan teknis (timeout, error API Gemini) sebelum jawaban final terbentuk (lihat §9).
5. **Pertanyaan ambigu** — Jika pertanyaan bebas terlalu umum/ambigu untuk dipetakan ke kategori KB tertentu (mis. "gimana ya"), bot boleh mengirim balasan klarifikasi singkat atau menampilkan kembali Menu Utama, sebelum memutuskan fallback. Ini bukan fallback ke admin, melainkan re-prompt ke user.
6. **Follow-up question** — Bot boleh mempertimbangkan histori beberapa pesan terakhir dalam `Conversation` yang sama untuk memahami konteks follow-up (mis. "kalau untuk jurusan itu gimana?" merujuk topik sebelumnya), namun tetap wajib melakukan retrieval evidence ulang berdasarkan topik yang teridentifikasi — histori percakapan tidak boleh menjadi pengganti evidence.
7. **Informasi tidak ditemukan** — Direspons sebagai fallback terkonfirmasi (lihat Flow E), bukan dijawab dengan permintaan maaf generik yang tidak actionable; bot harus menyampaikan bahwa pertanyaan diteruskan ke panitia.

---

## 9. Error & Empty States

| Kondisi | Perilaku yang Diharapkan |
|---|---|
| Database gagal diakses | Backend mengembalikan error terstruktur (bukan crash); permintaan dari WhatsApp yang gagal diproses dijawab dengan pesan generik "sedang ada gangguan, coba beberapa saat lagi" tanpa membuat state tidak konsisten. |
| Gemini API gagal/timeout | Sistem melakukan retry terbatas (lihat TRD §10); jika tetap gagal, perlakukan sebagai fallback (buat Escalation), bukan mengirim error mentah ke user. |
| WhatsApp disconnect | Status di Admin Panel berubah menjadi `disconnected`; admin diarahkan untuk scan ulang QR; pesan masuk selama disconnect tidak dapat diproses (di luar cakupan buffering pesan untuk MVP). |
| Knowledge source kosong (kategori tanpa entri eligible) | Bot tidak menampilkan kategori tersebut di menu, atau jika terpilih, membalas bahwa informasi belum tersedia dan meneruskan ke fallback. |
| Pertanyaan tidak ditemukan jawabannya | Fallback terkonfirmasi sesuai Flow E — bukan silent fail. |
| User mengirim pesan kosong | Pesan diabaikan oleh pipeline AI (tidak membuat `Message` baru bertipe kosong, tidak memicu balasan). |
| User mengirim media (gambar/dokumen/voice note/stiker) | Bot membalas dengan pesan standar bahwa saat ini hanya bisa memproses teks, dan mengarahkan user mengetik pertanyaan atau memilih menu. |
| Request timeout (ke Gemini atau internal) | Diperlakukan sebagai kegagalan teknis → fallback ke admin (lihat AI Behaviour poin 4). |
| API backend unavailable (dari sisi Admin Panel) | Frontend menampilkan state error yang jelas dan tombol retry, bukan layar kosong tanpa keterangan. |

---

## 10. Definition of Done

TIVAsk dianggap siap masuk UAT ketika:

- [ ] Seluruh Functional Requirement Must Have (§5) terimplementasi dan lulus Acceptance Criteria (§6).
- [ ] Seluruh Error & Empty States (§9) tertangani sesuai tabel, tidak ada unhandled crash pada jalur utama.
- [ ] Bot tidak pernah mengirim jawaban tanpa `matchedKbId` yang valid untuk kasus jawaban grounded (§8 poin 3).
- [ ] Fallback berjalan konsisten untuk seluruh kondisi wajib fallback (§8 poin 4) — divalidasi manual oleh QA dengan skenario uji.
- [ ] Admin dapat menyelesaikan siklus penuh: login → hubungkan WhatsApp → kelola KB → terima fallback → balas manual → tandai selesai, tanpa error.
- [ ] Tidak ada secret (API key, kredensial DB) yang ter-commit ke repository.
- [ ] Non-Functional Requirements response time (§7) terverifikasi pada kondisi jaringan demo.

---

## Assumptions & Technical Decisions

Bagian ini mendokumentasikan keputusan yang diambil untuk hal-hal yang ambigu atau belum dijelaskan secara lengkap di draft prototype, mengikuti prinsip "solusi paling sederhana dan aman untuk MVP".

| # | Area Ambigu di Draft | Keputusan untuk Final Spec | Alasan |
|---|---|---|---|
| 1 | Mekanisme retrieval "kategori/kata kunci" tidak dijelaskan detail | MVP menggunakan lexical/keyword matching terhadap `title` + `content` + `category`, tanpa vector database (konsisten dengan "Di Luar Cakupan" di draft). Detail teknis di TRD §10. | Menjaga kompleksitas sesuai skala hackathon 2 hari, sesuai batasan eksplisit di draft (W2). |
| 2 | Daftar kata kunci/pola untuk trigger eskalasi sensitif tidak dienumerasi | Kata kunci dikonfigurasi sebagai daftar sederhana yang dapat diubah tanpa deploy ulang kode inti (lihat TRD §13), diisi awal dengan contoh dari draft ("komplain", "nomor pendaftaran saya"). | Draft hanya memberi contoh, bukan daftar final; perlu titik ekstensi agar tidak hardcode permanen. |
| 3 | Mekanisme deteksi "AI menandakan tidak yakin" tidak dijelaskan cara parsing-nya | Gemini diminta merespons dalam format terstruktur (mengandung penanda eksplisit grounded/tidak), bukan mengandalkan pencocokan teks bebas seperti "maaf saya tidak tahu". | Free-text parsing rawan gagal/hallucination tersembunyi; format terstruktur lebih andal untuk validasi otomatis (risiko yang diidentifikasi di Bagian A review). |
| 4 | Multiple evidence untuk satu jawaban vs. skema `matchedKbId` tunggal | MVP tetap mencatat satu `matchedKbId` sebagai sumber berskor tertinggi di antara `sourceKbIds` yang lolos validasi; seluruh source IDs dan hasil pemeriksaan supportingEvidence dicatat di log terstruktur. Sumber yang sekadar retrieved tetapi tidak digunakan tidak boleh menjadi primary source. | Menjaga skema data sederhana sesuai draft, sambil tetap memenuhi kebutuhan multi-evidence pada level pemrosesan (bukan level penyimpanan). |
| 5 | Penanganan pesan grup, broadcast, self-message, media, pesan kosong, duplikat/stale tidak dibahas di draft | Didefinisikan eksplisit sebagai filter pre-AI-pipeline (FR-WA-004, FR-WA-005, §9). | Ini adalah gap penting untuk demo yang stabil — pesan tak terduga dapat merusak pipeline jika tidak difilter. |
| 6 | Mekanisme sesi/token autentikasi admin tidak dijelaskan (hanya "login sederhana") | Menggunakan token (JWT) yang dikirim sebagai HttpOnly cookie, masa berlaku terbatas. Detail di TRD §9. | Cukup aman untuk skala hackathon tanpa menambah kompleksitas signifikan. |
| 7 | Penanganan follow-up question & pergantian topik tidak dijelaskan | Bot mempertimbangkan histori pesan terbatas (beberapa pesan terakhir) untuk memahami konteks, tetapi tetap wajib retrieval evidence ulang (§8 poin 6). | Mencegah histori percakapan "membajak" grounding dan menyebabkan halusinasi kontekstual. |
| 8 | Reset conversation context tidak dijelaskan | `Conversation` tetap sama selama status bukan `resolved`; tidak ada auto-expire dan tidak ada perintah eksplisit reset histori di MVP (`menu`/`0` hanya navigasi) — histori context yang dipakai untuk follow-up dibatasi jumlah pesan terakhir, bukan direset manual. | Menghindari fitur tambahan yang tidak esensial untuk demo. |
| 9 | Chunking/pemecahan konten KB panjang tidak dibahas | Untuk MVP, satu `KnowledgeBaseEntry.content` diperlakukan sebagai satu chunk utuh (tidak dipecah otomatis); admin disarankan menulis entri per-topik yang ringkas. | Skala data hackathon kecil; chunking otomatis menambah kompleksitas RAG yang tidak proporsional (selaras larangan over-engineering di brief). |
