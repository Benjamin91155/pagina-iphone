import crypto from "crypto";
import { prisma } from "@/lib/db";

export function generateSalt(): string {
  return crypto.randomBytes(16).toString("hex");
}

export function hashPassword(password: string, salt: string): string {
  return crypto.createHash("sha256").update(`${salt}:${password}`).digest("hex");
}

export async function getAdminUser() {
  return prisma.adminUser.findFirst();
}

export async function validateAdminCredentialsServer(email: string, password: string) {
  const user = await getAdminUser();
  if (user) {
    const hash = hashPassword(password, user.salt);
    return email === user.email && hash === user.passwordHash;
  }

  const envEmail = process.env.ADMIN_EMAIL || "admin@local";
  const envPassword = process.env.ADMIN_PASSWORD || "admin1234";
  return email === envEmail && password === envPassword;
}

export async function verifyAdminPassword(password: string) {
  const user = await getAdminUser();
  if (user) {
    const hash = hashPassword(password, user.salt);
    return hash === user.passwordHash;
  }

  const envPassword = process.env.ADMIN_PASSWORD || "admin1234";
  return password === envPassword;
}

export async function getAdminEmailFallback() {
  const user = await getAdminUser();
  return user?.email || process.env.ADMIN_EMAIL || "admin@local";
}

export async function upsertAdminCredentials(email: string, password?: string) {
  const existing = await getAdminUser();
  const hasPassword = Boolean(password);

  if (!existing && !hasPassword) {
    throw new Error("Password required for first admin setup");
  }

  let salt = existing?.salt || generateSalt();
  let passwordHash = existing?.passwordHash || "";

  if (hasPassword) {
    salt = generateSalt();
    passwordHash = hashPassword(password as string, salt);
  }

  if (existing) {
    return prisma.adminUser.update({
      where: { id: existing.id },
      data: {
        email,
        salt,
        passwordHash
      }
    });
  }

  return prisma.adminUser.create({
    data: {
      email,
      salt,
      passwordHash
    }
  });
}
