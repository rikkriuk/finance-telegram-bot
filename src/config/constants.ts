export const DEFAULT_CATEGORIES = {
  income: [
    "gaji",
    "bonus",
    "transfer",
    "lainnya",
  ],
  expense: [
    "makan",
    "transport",
    "tagihan",
    "belanja",
    "hiburan",
    "lainnya",
  ],
};

export const SPAYLATER_WALLET_NAME = "SPayLater";

export const MAX_WALLET_OWNERS = 10;

export const SCENE_IDS = {
  createWallet: "create-wallet-wizard",
  addTransaction: "add-transaction-wizard",
  payDebt: "pay-debt-wizard",
};

export const WIZARD_TEXT = {
  cancelHint: "Ketik /batal kapan saja untuk membatalkan.",
  askWalletName: "Mau bikin wallet/bank apa? (contoh: BCA)",
  askOwnerCount:
    "Wallet ini disimpan/dipakai buat berapa orang? Ketik angkanya saja.",
  askOwnerNameTemplate: (index: number, total: number) =>
    `Sebutkan nama orang ke-${index} dari ${total}:`,
  walletCreatedTemplate: (name: string, owners: string[]) =>
    `✅ Wallet *${name}* dibuat dengan pemilik: ${owners.join(", ")}`,
  chooseWallet: "Pilih wallet/dompet tujuan:",
  chooseOwner: "Saldo ini milik siapa?",
  askAmount: "Masukkan jumlah uangnya (contoh: 200000, 200k, 2jt):",
  chooseCategory: "Pilih kategori, atau pilih 'Lainnya' untuk isi manual:",
  askCustomCategory: "Ketik nama kategorinya:",
  askNote: "Mau tambah catatan? Ketik catatannya, atau pilih 'Lewati'.",
  confirmPrompt: "Cek dulu, sudah benar?",
  cancelled: "❌ Dibatalkan.",
  invalidAmount: "Jumlah tidak valid. Contoh: 200000, 200k, atau 2jt",
  invalidNumber: "Masukkan angka yang valid.",
};

export const BUTTON_TEXT = {
  unnamedOwner: "Tanpa Nama",
  otherCategory: "Lainnya",
  skip: "Lewati",
  confirm: "✅ Simpan",
  cancel: "❌ Batal",
};

export const COMMANDS_HELP_TEXT = [
  "📌 *Daftar Perintah Bot*",
  "",
  "*Wallet & Saldo*",
  "/tambahwallet - buat wallet/bank baru (langkah demi langkah)",
  "/wallets - lihat semua dompet & pemiliknya",
  "/saldo - lihat saldo tiap dompet per nama pemilik",
  "",
  "*Transaksi*",
  "/masuk - catat pemasukan (langkah demi langkah)",
  "/keluar - catat pengeluaran (langkah demi langkah)",
  "",
  "*Hutang & Piutang*",
  "/berhutang <nama> <jumlah> [catatan] - kamu berhutang ke orang lain",
  "/piutang <nama> <jumlah> [catatan] - orang lain berhutang ke kamu",
  "/bayarhutang - bayar cicilan hutang kamu (langkah demi langkah)",
  "/tagihpiutang - terima pembayaran piutang (langkah demi langkah)",
  "/hutangku - daftar hutang & piutang aktif",
  "",
  "*SPayLater*",
  "/spaylatersetup <jumlah> <tgl_jatuh_tempo> - atur tagihan bulanan SPayLater",
  "/spaylaterbayar - bayar tagihan SPayLater bulan ini (langkah demi langkah)",
  "",
  "*Rekap*",
  "/rekap [MM-YYYY] - rekap transaksi & hutang bulan tertentu (default bulan ini)",
].join("\n");


export const BOT_COMMAND_LIST = [
  {
    command: "start",
    description: "Mulai & lihat daftar perintah",
  },
  {
    command: "help",
    description: "Bantuan & daftar perintah",
  },
  {
    command: "tambahwallet",
    description: "Buat wallet/bank baru",
  },
  {
    command: "wallets",
    description: "Lihat semua wallet & pemiliknya",
  },
  {
    command: "saldo",
    description: "Lihat saldo tiap wallet per pemilik",
  },
  {
    command: "masuk",
    description: "Catat pemasukan",
  },
  {
    command: "keluar",
    description: "Catat pengeluaran",
  },
  // {
  //   command: "berhutang",
  //   description: "Catat kamu berhutang ke orang lain",
  // },
  // {
  //   command: "piutang",
  //   description: "Catat orang lain berhutang ke kamu",
  // },
  // {
  //   command: "bayarhutang",
  //   description: "Bayar cicilan hutang kamu",
  // },
  // {
  //   command: "tagihpiutang",
  //   description: "Terima pembayaran piutang",
  // },
  // {
  //   command: "hutangku",
  //   description: "Daftar hutang & piutang aktif",
  // },
  // {
  //   command: "spaylatersetup",
  //   description: "Atur tagihan bulanan SPayLater",
  // },
  // {
  //   command: "spaylaterbayar",
  //   description: "Bayar tagihan SPayLater bulan ini",
  // },
  {
    command: "rekap",
    description: "Rekap transaksi bulanan",
  },
];
