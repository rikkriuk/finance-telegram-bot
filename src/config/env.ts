import dotenv from "dotenv";

dotenv.config();

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Environment variable "${key}" wajib diisi di file .env`);
  }
  return value;
}

export const env = {
  botToken: requireEnv("BOT_TOKEN"),
  mongoUri: requireEnv("MONGODB_URI"),
  timezone: process.env.TIMEZONE || "Asia/Jakarta",
};
