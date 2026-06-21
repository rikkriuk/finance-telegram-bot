import { Scenes } from "telegraf";
import { UserDocument } from "../db/models/User";

export interface BotContext extends Scenes.WizardContext {
  appUser?: UserDocument;
}
