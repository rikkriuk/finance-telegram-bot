import { Scenes } from "telegraf";
import { BotContext } from "../context";
import { createWalletScene } from "./createWalletScene";
import { addTransactionScene } from "./addTransactionScene";
import { payDebtScene } from "./payDebtScene";

export function createStage(): Scenes.Stage<BotContext> {
  return new Scenes.Stage<BotContext>([
    createWalletScene,
    addTransactionScene,
    payDebtScene,
  ]);
}
