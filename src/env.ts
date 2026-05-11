import { z } from "zod";

const serverSchema = z.object({
  CLERK_SECRET_KEY: z.string().min(1),
  FAL_API_KEY: z.string().min(1).optional(),
  LUMA_API_KEY: z.string().min(1).optional(),
  OPENAI_API_KEY: z.string().min(1).optional(),
  ANTHROPIC_API_KEY: z.string().min(1).optional(),
  WHATFONTIS_API_KEY: z.string().min(1).optional(),
});

const clientSchema = z.object({
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1),
  NEXT_PUBLIC_CLERK_SIGN_IN_URL: z.string().default("/sign-in"),
  NEXT_PUBLIC_CLERK_SIGN_UP_URL: z.string().default("/sign-up"),
});

export function getServerEnv() {
  return serverSchema.parse({
    CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
    FAL_API_KEY: process.env.FAL_API_KEY,
    LUMA_API_KEY: process.env.LUMA_API_KEY,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
    WHATFONTIS_API_KEY: process.env.WHATFONTIS_API_KEY,
  });
}

export function getClientEnv() {
  return clientSchema.parse({
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    NEXT_PUBLIC_CLERK_SIGN_IN_URL: process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL,
    NEXT_PUBLIC_CLERK_SIGN_UP_URL: process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL,
  });
}
