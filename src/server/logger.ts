import pino, { type DestinationStream, type Logger } from "pino";

import { env } from "./env";

// Dados que nunca podem aparecer nos logs (CLAUDE.md › Arquitetura).
const SENSITIVE_KEYS = [
  "email",
  "token",
  "password",
  "cookie",
  "authorization",
];

const REDACT_PATHS = [
  ...SENSITIVE_KEYS,
  ...SENSITIVE_KEYS.map((key) => `*.${key}`),
  "req.headers.cookie",
  "req.headers.authorization",
];

export type CreateLoggerOptions = {
  level: string;
  destination?: DestinationStream;
};

export function createLogger({
  level,
  destination,
}: CreateLoggerOptions): Logger {
  return pino(
    {
      level,
      base: undefined,
      timestamp: pino.stdTimeFunctions.isoTime,
      formatters: {
        level: (label) => ({ level: label }),
      },
      redact: { paths: REDACT_PATHS, censor: "[REDACTED]" },
    },
    destination,
  );
}

export const logger = createLogger({ level: env.LOG_LEVEL });
