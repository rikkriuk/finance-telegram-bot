import { Markup } from "telegraf";
import { TransactionType } from "../../types";
import { DEFAULT_CATEGORIES, BUTTON_TEXT } from "../../config/constants";

export function buildCategoryKeyboard(type: TransactionType) {
  const categories =
    type === TransactionType.INCOME
      ? DEFAULT_CATEGORIES.income
      : DEFAULT_CATEGORIES.expense;

  const buttons = categories
    .filter((category) => category !== "lainnya")
    .map((category) => Markup.button.callback(category, `category:${category}`));

  const otherButton = Markup.button.callback(
    BUTTON_TEXT.otherCategory,
    "category:other"
  );

  return Markup.inlineKeyboard([...buttons, otherButton], {
    columns: 2,
  });
}
