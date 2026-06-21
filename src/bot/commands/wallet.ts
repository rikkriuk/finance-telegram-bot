import { BotContext } from "../context";
import { listWallets } from "../../services/walletService";

export async function walletsCommand(ctx: BotContext): Promise<void> {
  const wallets = await listWallets();

  if (wallets.length === 0) {
    await ctx.reply(
      "Belum ada wallet. Buat dulu pakai /tambahwallet"
    );
    return;
  }

  const lines = wallets.map(
    (wallet) => `• *${wallet.name}* — pemilik: ${wallet.owners.join(", ") || "_belum ada_"}`
  );

  await ctx.reply(["📂 *Daftar Wallet*", "", ...lines].join("\n"), {
    parse_mode: "Markdown",
  });
}
