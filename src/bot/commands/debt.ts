import { Types } from "mongoose";
import { BotContext } from "../context";
import { parseAmount } from "../../utils/parser";
import { formatRupiah } from "../../utils/formatCurrency";
import { formatDate } from "../../utils/dateHelper";
import {
  createDebt,
  listActiveDebts,
  setupSpaylater,
  findActiveSpaylaterDebt,
} from "../../services/debtService";
import { DebtKind } from "../../types";
import { SCENE_IDS } from "../../config/constants";

function getMessageText(ctx: BotContext): string {
  return "text" in ctx.message! ? ctx.message.text : "";
}

export async function addDebtCommand(ctx: BotContext): Promise<void> {
  const parts = getMessageText(ctx).trim().split(/\s+/).slice(1);

  if (parts.length < 2) {
    await ctx.reply("Format salah. Contoh:\n/berhutang Budi 200000 pinjam buat makan");
    return;
  }

  const counterpartyName = parts[0];
  const amount = parseAmount(parts[1]);
  const note = parts.slice(2).join(" ") || undefined;

  if (amount === null || amount <= 0) {
    await ctx.reply("Jumlah tidak valid. Contoh: 200000 atau 200k");
    return;
  }

  const debt = await createDebt(
    {
      telegramId: ctx.from!.id,
      counterpartyName,
      amount,
      note,
    },
    DebtKind.DEBT
  );

  await ctx.reply(
    [
      `✅ Hutang baru dicatat`,
      `Ke: ${counterpartyName}`,
      `Jumlah: ${formatRupiah(amount)}`,
      `ID: \`${debt._id}\``,
    ].join("\n"),
    {
      parse_mode: "Markdown",
    }
  );
}

export async function addReceivableCommand(ctx: BotContext): Promise<void> {
  const parts = getMessageText(ctx).trim().split(/\s+/).slice(1);

  if (parts.length < 2) {
    await ctx.reply("Format salah. Contoh:\n/piutang Budi 200000 pinjam buat makan");
    return;
  }

  const counterpartyName = parts[0];
  const amount = parseAmount(parts[1]);
  const note = parts.slice(2).join(" ") || undefined;

  if (amount === null || amount <= 0) {
    await ctx.reply("Jumlah tidak valid. Contoh: 200000 atau 200k");
    return;
  }

  const debt = await createDebt(
    {
      telegramId: ctx.from!.id,
      counterpartyName,
      amount,
      note,
    },
    DebtKind.RECEIVABLE
  );

  await ctx.reply(
    [
      `✅ Piutang baru dicatat`,
      `Dari: ${counterpartyName}`,
      `Jumlah: ${formatRupiah(amount)}`,
      `ID: \`${debt._id}\``,
    ].join("\n"),
    {
      parse_mode: "Markdown",
    }
  );
}

export async function listDebtsCommand(ctx: BotContext): Promise<void> {
  const userId = ctx.appUser!._id as Types.ObjectId;

  const debts = await listActiveDebts(userId, DebtKind.DEBT);
  const receivables = await listActiveDebts(userId, DebtKind.RECEIVABLE);

  const debtLines = debts.map(
    (debt) =>
      `• \`${debt._id}\` ke *${debt.counterpartyName}*: ${formatRupiah(
        debt.remainingAmount
      )}${debt.dueDate ? ` (jatuh tempo ${formatDate(debt.dueDate)})` : ""}`
  );

  const receivableLines = receivables.map(
    (debt) =>
      `• \`${debt._id}\` dari *${debt.counterpartyName}*: ${formatRupiah(
        debt.remainingAmount
      )}${debt.dueDate ? ` (jatuh tempo ${formatDate(debt.dueDate)})` : ""}`
  );

  const message = [
    "📋 *Hutang Aktif (kamu bayar ke orang lain)*",
    debtLines.length > 0 ? debtLines.join("\n") : "_Tidak ada_",
    "",
    "📋 *Piutang Aktif (orang lain bayar ke kamu)*",
    receivableLines.length > 0 ? receivableLines.join("\n") : "_Tidak ada_",
  ].join("\n");

  await ctx.reply(message, {
    parse_mode: "Markdown",
  });
}

export async function spaylaterSetupCommand(ctx: BotContext): Promise<void> {
  const parts = getMessageText(ctx).trim().split(/\s+/).slice(1);

  if (parts.length < 2) {
    await ctx.reply(
      "Format salah. Contoh:\n/spaylatersetup 350000 25\n(artinya tagihan 350rb, jatuh tempo tanggal 25 tiap bulan)"
    );
    return;
  }

  const amount = parseAmount(parts[0]);
  const dueDay = parseInt(parts[1], 10);

  if (amount === null || amount <= 0) {
    await ctx.reply("Jumlah tidak valid.");
    return;
  }

  if (Number.isNaN(dueDay) || dueDay < 1 || dueDay > 28) {
    await ctx.reply("Tanggal jatuh tempo harus angka 1-28.");
    return;
  }

  const debt = await setupSpaylater(ctx.from!.id, amount, dueDay);

  await ctx.reply(
    [
      "✅ Tagihan bulanan SPayLater berhasil diatur",
      `Jumlah: ${formatRupiah(amount)} / bulan`,
      `Jatuh tempo: tanggal ${dueDay}`,
      `ID tagihan aktif: \`${debt._id}\``,
      "",
      "Setiap bulan kamu cukup pakai /spaylaterbayar untuk melunasi,",
      "tagihan bulan berikutnya akan otomatis dibuat lagi.",
    ].join("\n"),
    {
      parse_mode: "Markdown",
    }
  );
}

export async function spaylaterPayTrigger(ctx: BotContext): Promise<void> {
  const userId = ctx.appUser!._id as Types.ObjectId;
  const activeDebt = await findActiveSpaylaterDebt(userId);

  if (!activeDebt) {
    await ctx.reply(
      "Belum ada tagihan SPayLater aktif. Atur dulu dengan /spaylatersetup <jumlah> <tanggal>"
    );
    return;
  }

  await ctx.scene.enter(SCENE_IDS.payDebt, {
    data: {
      kind: DebtKind.DEBT,
      debtId: String(activeDebt._id),
      counterpartyName: activeDebt.counterpartyName,
    },
  });
}
