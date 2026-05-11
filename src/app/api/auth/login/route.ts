import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { z } from "zod";
import {
  createSessionToken,
  SESSION_COOKIE_NAME,
  timingSafeEqualStr,
} from "@/lib/auth-session";

const bodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

function readAuthEnv(env: Record<string, string | undefined>) {
  return {
    secret: env.AUTH_SECRET ?? "",
    email: (env.AUTH_EMAIL ?? "").trim().toLowerCase(),
    password: env.AUTH_PASSWORD ?? "",
  };
}

export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }
  const { email, password } = parsed.data;
  const { env } = getCloudflareContext();
  const { secret, email: wantEmail, password: wantPassword } = readAuthEnv(
    env as Record<string, string | undefined>
  );
  if (!secret || !wantEmail || !wantPassword) {
    return NextResponse.json(
      { error: "Variáveis AUTH_SECRET, AUTH_EMAIL e AUTH_PASSWORD não configuradas" },
      { status: 500 }
    );
  }
  const norm = email.trim().toLowerCase();
  if (norm !== wantEmail || !timingSafeEqualStr(password, wantPassword)) {
    return NextResponse.json({ error: "E-mail ou senha incorretos" }, { status: 401 });
  }
  const token = await createSessionToken(norm, secret);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}
