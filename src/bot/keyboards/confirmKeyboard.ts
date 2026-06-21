import { Markup } from "telegraf";
import { BUTTON_TEXT } from "../../config/constants";

export function buildConfirmKeyboard() {
  return Markup.inlineKeyboard([
    Markup.button.callback(BUTTON_TEXT.confirm, "confirm:yes"),
    Markup.button.callback(BUTTON_TEXT.cancel, "confirm:no"),
  ]);
}

export function buildSkipKeyboard() {
  return Markup.inlineKeyboard([
    Markup.button.callback(BUTTON_TEXT.skip, "note:skip"),
  ]);
}

export function buildDebtListKeyboard(
  debts: Array<{
    id: string;
    counterpartyName: string;
    remainingAmount: number;
  }>
) {
  const buttons = debts.map((debt) =>
    Markup.button.callback(
      `${debt.counterpartyName} - ${debt.remainingAmount}`,
      `debt:${debt.id}`
    )
  );

  return Markup.inlineKeyboard(buttons, {
    columns: 1,
  });
}
