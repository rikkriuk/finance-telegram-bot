import { Scenes } from "telegraf";
import { BotContext } from "../context";
import {
  TransactionWizardState,
  TransactionType,
  UNNAMED_OWNER,
} from "../../types";
import { listWallets, findWalletById, listOwnersWithUnnamedOption } from "../../services/walletService";
import { recordIncome, recordExpense } from "../../services/transactionService";
import { parseAmount } from "../../utils/parser";
import { formatRupiah } from "../../utils/formatCurrency";
import { buildWalletKeyboard } from "../keyboards/walletKeyboard";
import { buildOwnerKeyboard } from "../keyboards/ownerKeyboard";
import { buildCategoryKeyboard } from "../keyboards/categoryKeyboard";
import { buildSkipKeyboard } from "../keyboards/confirmKeyboard";
import { WIZARD_TEXT, SCENE_IDS } from "../../config/constants";

function getState(ctx: BotContext): TransactionWizardState {
  const state = ctx.wizard.state as {
    data?: TransactionWizardState;
  };

  if (!state.data) {
    state.data = {};
  }

  return state.data;
}

function getReplyText(ctx: BotContext): string | null {
  const message = ctx.message;
  if (message && "text" in message) {
    return message.text.trim();
  }
  return null;
}

function getCallbackData(ctx: BotContext): string | null {
  const query = ctx.callbackQuery;
  if (query && "data" in query) {
    return query.data;
  }
  return null;
}

function getScratch(ctx: BotContext): Record<string, unknown> {
  return ctx.wizard.state as Record<string, unknown>;
}

async function stepChooseWallet(ctx: BotContext): Promise<void> {
  const wallets = await listWallets();

  if (wallets.length === 0) {
    await ctx.reply(
      "Belum ada wallet sama sekali. Buat dulu pakai /tambahwallet ya."
    );
    await ctx.scene.leave();
    return;
  }

  await ctx.reply(
    `${WIZARD_TEXT.chooseWallet}\n\n${WIZARD_TEXT.cancelHint}`,
    buildWalletKeyboard(wallets)
  );
  ctx.wizard.next();
}

async function stepChooseOwner(ctx: BotContext): Promise<void> {
  const data = getCallbackData(ctx);

  if (!data || !data.startsWith("wallet:")) {
    await ctx.reply("Pilih salah satu wallet lewat tombol di atas ya.");
    return;
  }

  await ctx.answerCbQuery();

  const walletId = data.split(":")[1];
  const wallet = await findWalletById(walletId);

  if (!wallet) {
    await ctx.reply("Wallet tidak ditemukan, coba lagi dari awal.");
    await ctx.scene.leave();
    return;
  }

  const state = getState(ctx);
  state.walletId = walletId;
  state.walletName = wallet.name;

  const owners = listOwnersWithUnnamedOption(wallet);
  getScratch(ctx).ownersCache = owners;

  await ctx.reply(WIZARD_TEXT.chooseOwner, buildOwnerKeyboard(wallet.owners));
  ctx.wizard.next();
}

async function stepAskAmount(ctx: BotContext): Promise<void> {
  const data = getCallbackData(ctx);

  if (!data || !data.startsWith("owner:")) {
    await ctx.reply("Pilih salah satu nama lewat tombol di atas ya.");
    return;
  }

  await ctx.answerCbQuery();

  const state = getState(ctx);
  const ownersCache = (getScratch(ctx).ownersCache as string[]) || [];

  if (data === "owner:unnamed") {
    state.ownerName = UNNAMED_OWNER;
  } else {
    const index = parseInt(data.split(":")[1], 10);
    state.ownerName = ownersCache[index] || UNNAMED_OWNER;
  }

  await ctx.reply(WIZARD_TEXT.askAmount);
  ctx.wizard.next();
}

async function stepChooseCategory(ctx: BotContext): Promise<void> {
  const text = getReplyText(ctx);

  if (!text) {
    await ctx.reply(WIZARD_TEXT.invalidAmount);
    return;
  }

  const amount = parseAmount(text);

  if (amount === null || amount <= 0) {
    await ctx.reply(WIZARD_TEXT.invalidAmount);
    return;
  }

  const state = getState(ctx);
  state.amount = amount;

  await ctx.reply(
    WIZARD_TEXT.chooseCategory,
    buildCategoryKeyboard(state.transactionType as TransactionType)
  );
  ctx.wizard.next();
}

async function stepAskNote(ctx: BotContext): Promise<void> {
  const data = getCallbackData(ctx);

  if (!data || !data.startsWith("category:")) {
    await ctx.reply("Pilih salah satu kategori lewat tombol di atas ya.");
    return;
  }

  await ctx.answerCbQuery();

  const value = data.split(":")[1];
  const state = getState(ctx);

  if (value === "other") {
    await ctx.reply(WIZARD_TEXT.askCustomCategory);
    getScratch(ctx).awaitingCustomCategory = true;
    return;
  }

  state.category = value;

  await ctx.reply(WIZARD_TEXT.askNote, buildSkipKeyboard());
  ctx.wizard.next();
}

async function stepConfirm(ctx: BotContext): Promise<void> {
  const state = getState(ctx);
  const scratch = getScratch(ctx);

  if (scratch.awaitingCustomCategory) {
    const text = getReplyText(ctx);

    if (!text) {
      await ctx.reply(WIZARD_TEXT.askCustomCategory);
      return;
    }

    state.category = text;
    scratch.awaitingCustomCategory = false;

    await ctx.reply(WIZARD_TEXT.askNote, buildSkipKeyboard());
    ctx.wizard.next();
    return;
  }

  const text = getReplyText(ctx);
  const data = getCallbackData(ctx);

  if (data === "note:skip") {
    await ctx.answerCbQuery();
    state.note = undefined;
  } else if (text) {
    state.note = text;
  } else {
    await ctx.reply("Ketik catatannya, atau pilih 'Lewati'.");
    return;
  }

  await saveTransaction(ctx, state);
  await ctx.scene.leave();
}

async function saveTransaction(
  ctx: BotContext,
  state: TransactionWizardState
): Promise<void> {
  try {
    const result =
      state.transactionType === TransactionType.INCOME
        ? await recordIncome({
            telegramId: ctx.from!.id,
            walletId: state.walletId as string,
            ownerName: state.ownerName as string,
            amount: state.amount as number,
            category: state.category,
            note: state.note,
          })
        : await recordExpense({
            telegramId: ctx.from!.id,
            walletId: state.walletId as string,
            ownerName: state.ownerName as string,
            amount: state.amount as number,
            category: state.category,
            note: state.note,
          });

    const label =
      state.transactionType === TransactionType.INCOME
        ? "Pemasukan"
        : "Pengeluaran";

    await ctx.reply(
      [
        `✅ ${label} dicatat di *${state.walletName}*`,
        `Pemilik: ${state.ownerName}`,
        `Jumlah: ${formatRupiah(state.amount as number)}`,
        state.category ? `Kategori: ${state.category}` : null,
        state.note ? `Catatan: ${state.note}` : null,
        `Saldo ${state.ownerName} di ${state.walletName} sekarang: ${formatRupiah(
          result.newBalance
        )}`,
      ]
        .filter(Boolean)
        .join("\n"),
      {
        parse_mode: "Markdown",
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal mencatat transaksi";
    await ctx.reply(`❌ ${message}`);
  }
}

export const addTransactionScene = new Scenes.WizardScene<BotContext>(
  SCENE_IDS.addTransaction,
  stepChooseWallet,
  stepChooseOwner,
  stepAskAmount,
  stepChooseCategory,
  stepAskNote,
  stepConfirm
);

addTransactionScene.command("batal", async (ctx) => {
  await ctx.reply(WIZARD_TEXT.cancelled);
  await ctx.scene.leave();
});
