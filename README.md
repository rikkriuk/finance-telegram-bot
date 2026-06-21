# BCA-DANA Bot

Bot Telegram untuk mencatat pemasukan/pengeluaran dengan saldo dompet yang **bercampur antar pemilik** — misal 1 wallet BCA dimiliki bareng oleh beberapa orang sekaligus, dicatat berdasarkan **nama**, bukan akun Telegram. Lengkap dengan sistem **hutang/piutang** (termasuk tagihan bulanan **SPayLater**) dan **rekap otomatis**. Semua alur input utama (buat wallet, catat transaksi, bayar hutang) memakai **wizard bertahap + tombol** supaya gampang dipakai dari HP.

## Konsep Utama

- **Wallet** (mis. `BCA`, `DANA`) dibuat lewat `/tambahwallet`, dan saat dibuat kamu langsung menentukan **daftar nama pemilik** wallet itu (bukan akun Telegram, cuma nama bebas).
- Tiap **nama pemilik** punya bagian saldonya sendiri di dalam wallet yang sama (`WalletBalance` per `wallet + ownerName`). Jadi walau BCA "tercampur" antara kamu, Andi, dan Budi, saldo masing-masing tetap kelihatan terpisah, sekaligus totalnya bisa dilihat gabungan.
- Kalau transaksi dicatat **tanpa menyebut nama**, otomatis masuk kategori `Tanpa Nama`.
- Bot ini didesain dipakai dari **satu akun Telegram** yang mencatat semua transaksi (kamu), jadi pemilik dana tidak perlu punya akun Telegram sendiri.
- Hutang & piutang dicatat terpisah dari saldo wallet, tapi pembayarannya tetap memotong/menambah saldo milik nama pemilik yang kamu pilih.
- **SPayLater** dimodelkan sebagai hutang berulang (`isRecurring`): begitu lunas, tagihan bulan berikutnya otomatis dibuat lagi.

## Struktur Folder

```
src/
  config/        konfigurasi env & konstanta (teks wizard, label tombol, kategori default)
  types/         tipe, enum, dan state wizard yang dipakai lintas modul
  db/
    connection.ts
    models/      schema Mongoose (User, Wallet, WalletBalance, Transaction, Debt, DebtPayment)
  utils/         helper murni (format rupiah, parsing jumlah, tanggal)
  services/      logika bisnis (user, wallet, transaction, debt, recap)
  bot/
    context.ts         tipe BotContext (gabungan session + scene + wizard + appUser)
    bot.ts              registrasi command & wiring session/stage
    middlewares/        auto-registrasi user (audit trail siapa yang mencatat)
    commands/           command sederhana (bukan wizard): /wallets, /saldo, /berhutang, dst
    keyboards/           generator inline keyboard (pilih wallet, pemilik, kategori, dll)
    scenes/              wizard bertahap: buat wallet, catat transaksi, bayar hutang
  jobs/          cron job (reminder jatuh tempo, rekap bulanan otomatis)
  index.ts       entry point
```

## Setup

1. Salin `.env.example` menjadi `.env`, isi `BOT_TOKEN` (dari @BotFather) dan `MONGODB_URI`.
2. Install dependency:
   ```bash
   npm install
   ```
3. Jalankan mode development:
   ```bash
   npm run dev
   ```
4. Build & jalankan production:
   ```bash
   npm run build
   npm start
   ```

## Daftar Perintah

### Wallet & Saldo
- `/tambahwallet` — wizard buat wallet baru: tanya nama wallet → jumlah pemilik → nama tiap pemilik satu-satu
- `/wallets` — lihat semua wallet beserta daftar pemiliknya
- `/saldo` — lihat saldo tiap wallet, dipecah per nama pemilik + totalnya

### Transaksi (wizard + tombol)
- `/masuk` — catat pemasukan: pilih wallet (tombol) → pilih nama pemilik (tombol, atau "Tanpa Nama") → ketik jumlah → pilih kategori (tombol) → catatan opsional
- `/keluar` — sama seperti `/masuk`, untuk pengeluaran

Jumlah mendukung format `200000`, `200.000`, `200k`, `2jt`.

### Hutang & Piutang
- `/berhutang <nama> <jumlah> [catatan]` — kamu berhutang ke orang lain
- `/piutang <nama> <jumlah> [catatan]` — orang lain berhutang ke kamu
- `/bayarhutang` — wizard bayar cicilan hutang: pilih hutang (tombol) → pilih wallet → pilih nama pemilik dana → ketik jumlah
- `/tagihpiutang` — wizard sama untuk menerima pembayaran piutang
- `/hutangku` — daftar hutang & piutang yang masih aktif (beserta ID-nya)

### SPayLater
- `/spaylatersetup <jumlah> <tanggal_jatuh_tempo>` — atur tagihan bulanan
  Contoh: `/spaylatersetup 350000 25`
- `/spaylaterbayar` — wizard bayar tagihan SPayLater bulan berjalan (tagihan langsung terpilih otomatis, tinggal pilih wallet & nama pemilik), tagihan bulan depan otomatis dibuat lagi setelah lunas

### Rekap
- `/rekap` — rekap bulan ini: total pemasukan/pengeluaran, saldo per wallet (dipecah per nama pemilik), hutang & piutang aktif
- `/rekap MM-YYYY` — rekap bulan tertentu, contoh `/rekap 05-2026`

### Membatalkan Wizard
Ketik `/batal` kapan saja selama wizard berlangsung untuk membatalkan.

## Otomatisasi (Cron)

- Setiap hari jam 08:00 — reminder tagihan yang jatuh tempo dalam 3 hari ke depan.
- Setiap tanggal 1 jam 07:00 — kirim rekap bulan sebelumnya otomatis ke semua user terdaftar.

Timezone diatur lewat `TIMEZONE` di `.env` (default `Asia/Jakarta`).

## Catatan Teknis

- Wizard session disimpan **in-memory** (bawaan Telegraf), jadi state wizard akan hilang kalau bot di-restart di tengah proses input — tapi data yang sudah dikonfirmasi tetap aman tersimpan di MongoDB.
- `Transaction.recordedByUserId` dan `Debt.userId` itu cuma audit trail "siapa yang mencatat dari Telegram", **bukan** penentu kepemilikan saldo. Kepemilikan saldo sepenuhnya ditentukan oleh `ownerName` di `WalletBalance` & `Transaction.ownerName`.

## Menambah Fitur

Karena terstruktur per-layer (`models` → `services` → `bot/commands` / `bot/scenes`), menambah fitur baru cukup:
1. Tambah/ubah schema di `db/models` bila perlu data baru.
2. Tambah fungsi logika di `services/*`.
3. Untuk command sederhana satu langkah, tambah di `bot/commands/*`. Untuk alur tanya-jawab bertahap, tambah wizard scene baru di `bot/scenes/*` lalu daftarkan di `bot/scenes/index.ts`.
4. Daftarkan command/trigger barunya di `bot/bot.ts`.

