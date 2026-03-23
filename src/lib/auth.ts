const encoder = new TextEncoder();
const decoder = new TextDecoder();

const DEFAULT_EMAIL = "admin@local";
const DEFAULT_PASSWORD = "admin1234";
const DEFAULT_SECRET = "dev-secret-change";
const SESSION_TTL_SECONDS = 60 * 60 * 12; // 12 hours

function getAdminConfig() {
  return {
    email: process.env.ADMIN_EMAIL || DEFAULT_EMAIL,
    password: process.env.ADMIN_PASSWORD || DEFAULT_PASSWORD,
    secret: process.env.ADMIN_SECRET || DEFAULT_SECRET
  };
}

function bytesToBase64(bytes: Uint8Array) {
  if (typeof btoa === "function") {
    let binary = "";
    bytes.forEach((b) => {
      binary += String.fromCharCode(b);
    });
    return btoa(binary);
  }
  return Buffer.from(bytes).toString("base64");
}

function base64ToBytes(base64: string) {
  if (typeof atob === "function") {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }
  return Uint8Array.from(Buffer.from(base64, "base64"));
}

function base64UrlEncode(bytes: Uint8Array) {
  return bytesToBase64(bytes).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function base64UrlDecode(value: string) {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  return base64ToBytes(padded);
}

async function sign(value: string, secret: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(value));
  return base64UrlEncode(new Uint8Array(signature));
}

export async function validateAdminCredentials(email: string, password: string) {
  const config = getAdminConfig();
  return email === config.email && password === config.password;
}

export async function createAdminSession(email: string) {
  const { secret } = getAdminConfig();
  const payload = {
    email,
    role: "admin",
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS
  };
  const payloadBase64 = base64UrlEncode(encoder.encode(JSON.stringify(payload)));
  const signature = await sign(payloadBase64, secret);
  return `${payloadBase64}.${signature}`;
}

export async function verifyAdminSession(token: string) {
  if (!token) return null;
  const [payloadBase64, signature] = token.split(".");
  if (!payloadBase64 || !signature) return null;

  const { secret } = getAdminConfig();
  const expected = await sign(payloadBase64, secret);
  if (expected !== signature) return null;

  try {
    const payloadJson = decoder.decode(base64UrlDecode(payloadBase64));
    const payload = JSON.parse(payloadJson) as { email: string; role: string; exp: number };
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    if (payload.role !== "admin") return null;
    return payload;
  } catch {
    return null;
  }
}
