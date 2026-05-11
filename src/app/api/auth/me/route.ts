import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth-session";

export async function GET() {
  const token = (await cookies()).get(SESSION_COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.json({ user: null }, { status: 401 });
  }
  const { env } = getCloudflareContext();
  const secret = (env as Record<string, string | undefined>).AUTH_SECRET ?? "";
  if (!secret) {
    return NextResponse.json({ user: null }, { status: 500 });
  }
  const session = await verifySessionToken(token, secret);
  if (!session) {
    return NextResponse.json({ user: null }, { status: 401 });
  }
  return NextResponse.json({ user: { email: session.email } });
}
