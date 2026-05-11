const encoder = new TextEncoder();

export const SESSION_COOKIE_NAME = "fp12_session";
const SESSION_MAX_SEC = 60 * 60 * 24 * 7;

function b64urlEncode(data: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < data.length; i++) bin += String.fromCharCode(data[i]!);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64urlDecode(s: string): Uint8Array {
  const pad = "=".repeat((4 - (s.length % 4)) % 4);
  const b64 = (s + pad).replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)!;
  return out;
}

async function hmacSha256(secret: string, message: Uint8Array): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, message as BufferSource);
  return new Uint8Array(sig);
}

export function timingSafeEqualStr(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let x = 0;
  for (let i = 0; i < a.length; i++) x |= a.charCodeAt(i)! ^ b.charCodeAt(i)!;
  return x === 0;
}

export async function createSessionToken(email: string, secret: string): Promise<string> {
  const exp = Math.floor(Date.now() / 1000) + SESSION_MAX_SEC;
  const payload = encoder.encode(JSON.stringify({ e: email, exp }));
  const sig = await hmacSha256(secret, payload);
  return `${b64urlEncode(payload)}.${b64urlEncode(sig)}`;
}

export async function verifySessionToken(
  token: string,
  secret: string
): Promise<{ email: string } | null> {
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [payloadB64, sigB64] = parts;
  if (!payloadB64 || !sigB64) return null;
  let payload: Uint8Array;
  let sig: Uint8Array;
  try {
    payload = b64urlDecode(payloadB64);
    sig = b64urlDecode(sigB64);
  } catch {
    return null;
  }
  const expected = await hmacSha256(secret, payload);
  if (expected.length !== sig.length) return null;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected[i]! ^ sig[i]!;
  if (diff !== 0) return null;
  try {
    const obj = JSON.parse(new TextDecoder().decode(payload)) as { e?: string; exp?: number };
    if (!obj.e || typeof obj.exp !== "number") return null;
    if (obj.exp < Math.floor(Date.now() / 1000)) return null;
    return { email: obj.e };
  } catch {
    return null;
  }
}
