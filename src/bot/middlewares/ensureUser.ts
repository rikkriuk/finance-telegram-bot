import { MiddlewareFn } from "telegraf";
import { findOrCreateUser } from "../../services/userService";
import { BotContext } from "../context";

export type AppContext = BotContext;

export const ensureUser: MiddlewareFn<AppContext> = async (ctx, next) => {
  const from = ctx.from;

  if (!from) {
    return next();
  }

  const fullName = [from.first_name, from.last_name]
    .filter(Boolean)
    .join(" ")
    .trim() || "Pengguna";

  ctx.appUser = await findOrCreateUser(from.id, fullName, from.username);

  return next();
};
