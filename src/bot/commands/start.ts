import { BotContext } from "../context";
import { COMMANDS_HELP_TEXT } from "../../config/constants";

export async function startCommand(ctx: BotContext): Promise<void> {
  const name = ctx.appUser?.name || "kamu";

  const message = [
    `Halo ${name}! 👋`,
    "",
    "Aku bot pencatat transaksi & hutang-piutang.",
    "Satu wallet/bank bisa dimiliki beberapa orang sekaligus —",
    "tinggal sebut nama pemiliknya tiap kali catat transaksi,",
    "jadi saldo yang bercampur tetap bisa dipantau per orang.",
    "",
    COMMANDS_HELP_TEXT,
  ].join("\n");

  await ctx.reply(message, {
    parse_mode: "Markdown",
  });
}

export async function helpCommand(ctx: BotContext): Promise<void> {
  await ctx.reply(COMMANDS_HELP_TEXT, {
    parse_mode: "Markdown",
  });
}
