import { Scenes } from "telegraf";
import { Types } from "mongoose";
import { BotContext } from "../context";
import { DebtPaymentWizardState, DebtKind, UNNAMED_OWNER } from "../../types";
import { listActiveDebts, payDebtOrReceivable } from "../../services/debtService";
import { listWallets, findWalletById, listOwnersWithUnnamedOption } from "../../services/walletService";
import { parseAmount } from "../../utils/parser";
import { formatRupiah } from "../../utils/formatCurrency";
import { buildWalletKeyboard } from "../keyboards/walletKeyboard";
import { buildOwnerKeyboard } from "../keyboards/ownerKeyboard";
import { buildDebtListKeyboard } from "../keyboards/confirmKeyboard";
import { WIZARD_TEXT, SCENE_IDS } from "../../config/constants";

function getState(ctx: BotContext): DebtPaymentWizardState {
  const state = ctx.wizard.state as {
    data?: DebtPaymentWizardState;
  };

  if (!state.data) {
    state.data = {};
  }

  return state.data;
}

function getScratch(ctx: BotContext): Record<string, unknown> {
  return ctx.wizard.state as Record<string, unknown>;
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

async function stepEnter(ctx: BotContext): Promise<void> {
  const state = getState(ctx);

  if (state.debtId) {
    await askWallet(ctx);
    ctx.wizard.selectStep(2);
    return;
  }

  const userId = ctx.appUser!._id as Types.ObjectId;
  const debts = await listActiveDebts(userId, state.kind as DebtKind);

  if (debts.length === 0) {
    await ctx.reply("Tidak ada hutang/piutang aktif.");
    await ctx.scene.leave();
    return;
  }

  await ctx.reply(
    `Pilih salah satu:\n\n${WIZARD_TEXT.cancelHint}`,
    buildDebtListKeyboard(
      debts.map((debt) => ({
        id: String(debt._id),
        counterpartyName: debt.counterpartyName,
        remainingAmount: debt.remainingAmount,
      }))
    )
  );
  ctx.wizard.next();
}

async function stepReceiveDebtSelection(ctx: BotContext): Promise<void> {
  const data = getCallbackData(ctx);

  if (!data || !data.startsWith("debt:")) {
    await ctx.reply("Pilih salah satu lewat tombol di atas ya.");
    return;
  }

  await ctx.answerCbQuery();

  const state = getState(ctx);
  state.debtId = data.split(":")[1];

  await askWallet(ctx);
  ctx.wizard.next();
}

async function askWallet(ctx: BotContext): Promise<void> {
  const wallets = await listWallets();

  if (wallets.length === 0) {
    await ctx.reply("Belum ada wallet. Buat dulu pakai /tambahwallet ya.");
    await ctx.scene.leave();
    return;
  }

  await ctx.reply(WIZARD_TEXT.chooseWallet, buildWalletKeyboard(wallets));
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

async function stepConfirmPayment(ctx: BotContext): Promise<void> {
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

  try {
    const result = await payDebtOrReceivable(
      {
        telegramId: ctx.from!.id,
        debtId: state.debtId as string,
        amount,
        walletId: state.walletId as string,
        ownerName: state.ownerName as string,
      },
      state.kind as DebtKind
    );

    const verb = state.kind === DebtKind.DEBT ? "Pembayaran hutang" : "Penerimaan piutang";

    await ctx.reply(
      [
        `✅ ${verb} sebesar ${formatRupiah(amount)} dicatat`,
        `Pemilik dana: ${state.ownerName}`,
        `Sisa tagihan: ${formatRupiah(result.debt.remainingAmount)}`,
        `Status: ${result.debt.status}`,
        `Saldo ${state.ownerName} di ${state.walletName} sekarang: ${formatRupiah(
          result.remainingWalletBalance
        )}`,
      ].join("\n")
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal memproses pembayaran";
    await ctx.reply(`❌ ${message}`);
  }

  await ctx.scene.leave();
}

export const payDebtScene = new Scenes.WizardScene<BotContext>(
  SCENE_IDS.payDebt,
  stepEnter,
  stepReceiveDebtSelection,
  stepChooseOwner,
  stepAskAmount,
  stepConfirmPayment
);

payDebtScene.command("batal", async (ctx) => {
  await ctx.reply(WIZARD_TEXT.cancelled);
  await ctx.scene.leave();
});
