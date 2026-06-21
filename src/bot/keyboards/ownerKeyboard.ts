import { Markup } from "telegraf";
import { BUTTON_TEXT } from "../../config/constants";

export function buildOwnerKeyboard(owners: string[]) {
  const ownerButtons = owners.map((owner, index) =>
    Markup.button.callback(owner, `owner:${index}`)
  );

  const unnamedButton = Markup.button.callback(
    BUTTON_TEXT.unnamedOwner,
    "owner:unnamed"
  );

  return Markup.inlineKeyboard([...ownerButtons, unnamedButton], {
    columns: 2,
  });
}
