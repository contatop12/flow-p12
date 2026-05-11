import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth-session";

function isPublicPath(pathname: string, method: string) {
  if (pathname.startsWith("/sign-in")) return true;
  if (pathname === "/api/health") return true;
  if (pathname === "/api/auth/login" && method === "POST") return true;
  if (pathname === "/api/auth/logout" && method === "POST") return true;
  if (pathname === "/api/auth/me" && method === "GET") return true;
  return false;
}

async function getAuthSecret(): Promise<string> {
  try {
    const ctx = await getCloudflareContext({ async: true });
    return (ctx.env as Record<string, string | undefined>).AUTH_SECRET ?? "";
  } catch {
    return process.env.AUTH_SECRET ?? "";
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (isPublicPath(pathname, request.method)) {
    return NextResponse.next();
  }

  const secret = await getAuthSecret();
  if (!secret) {
    return NextResponse.json(
      { error: "AUTH_SECRET não configurado (wrangler / .dev.vars)" },
      { status: 503 }
    );
  }

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? await verifySessionToken(token, secret) : null;
  if (!session) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }
    const signIn = new URL("/sign-in", request.url);
    signIn.searchParams.set("next", pathname);
    return NextResponse.redirect(signIn);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
