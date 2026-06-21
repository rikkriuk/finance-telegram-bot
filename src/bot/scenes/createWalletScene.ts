import { Scenes } from "telegraf";
import { BotContext } from "../context";
import { CreateWalletWizardState } from "../../types";
import { createWalletWithOwners } from "../../services/walletService";
import { WIZARD_TEXT, MAX_WALLET_OWNERS, SCENE_IDS } from "../../config/constants";

function getState(ctx: BotContext): CreateWalletWizardState {
  const state = ctx.wizard.state as {
    data?: CreateWalletWizardState;
  };

  if (!state.data) {
    state.data = {
      owners: [],
    };
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

async function stepAskWalletName(ctx: BotContext): Promise<void> {
  getState(ctx);
  await ctx.reply(
    `${WIZARD_TEXT.askWalletName}\n\n${WIZARD_TEXT.cancelHint}`
  );
  ctx.wizard.next();
}

async function stepReceiveWalletName(ctx: BotContext): Promise<void> {
  const text = getReplyText(ctx);

  if (!text) {
    await ctx.reply("Ketik nama wallet-nya ya, contoh: BCA");
    return;
  }

  const state = getState(ctx);
  state.walletName = text;

  await ctx.reply(WIZARD_TEXT.askOwnerCount);
  ctx.wizard.next();
}

async function stepReceiveOwnerCount(ctx: BotContext): Promise<void> {
  const text = getReplyText(ctx);
  const count = text ? parseInt(text, 10) : NaN;

  if (Number.isNaN(count) || count < 1 || count > MAX_WALLET_OWNERS) {
    await ctx.reply(
      `Masukkan angka 1-${MAX_WALLET_OWNERS} ya.`
    );
    return;
  }

  const state = getState(ctx);
  state.ownerCount = count;
  state.owners = [];

  await ctx.reply(WIZARD_TEXT.askOwnerNameTemplate(1, count));
  ctx.wizard.next();
}

async function stepCollectOwnerNames(ctx: BotContext): Promise<void> {
  const text = getReplyText(ctx);

  if (!text) {
    await ctx.reply("Ketik namanya ya, contoh: Andi");
    return;
  }

  const state = getState(ctx);
  state.owners.push(text);

  const total = state.ownerCount as number;

  if (state.owners.length < total) {
    await ctx.reply(
      WIZARD_TEXT.askOwnerNameTemplate(state.owners.length + 1, total)
    );
    return;
  }

  try {
    const wallet = await createWalletWithOwners(
      state.walletName as string,
      state.owners
    );

    await ctx.reply(
      WIZARD_TEXT.walletCreatedTemplate(wallet.name, wallet.owners),
      {
        parse_mode: "Markdown",
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal membuat wallet";
    await ctx.reply(`❌ ${message}`);
  }

  await ctx.scene.leave();
}

export const createWalletScene = new Scenes.WizardScene<BotContext>(
  SCENE_IDS.createWallet,
  stepAskWalletName,
  stepReceiveWalletName,
  stepReceiveOwnerCount,
  stepCollectOwnerNames
);

createWalletScene.command("batal", async (ctx) => {
  await ctx.reply(WIZARD_TEXT.cancelled);
  await ctx.scene.leave();
});
