import crypto from "crypto";
import { prisma } from "@/lib/db";

const SESSION_DAYS = 30;
const OTP_MINUTES = 10;

function addDays(date: Date, days: number) {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

export function generateSalt(): string {
  return crypto.randomBytes(16).toString("hex");
}

export function hashPassword(password: string, salt: string): string {
  return crypto.createHash("sha256").update(`${salt}:${password}`).digest("hex");
}

export function normalizePhone(phone: string) {
  return phone.replace(/\s+/g, "").replace(/[^0-9+]/g, "");
}

export async function findCustomerByEmail(email: string) {
  return prisma.customer.findFirst({ where: { email } });
}

export async function findCustomerByPhone(phone: string) {
  return prisma.customer.findFirst({ where: { phone } });
}

export async function getCustomerFromSession(token?: string) {
  if (!token) return null;
  const session = await prisma.customerSession.findUnique({
    where: { token },
    include: { customer: true }
  });
  if (!session) return null;

  if (session.expiresAt < new Date()) {
    await prisma.customerSession.delete({ where: { id: session.id } }).catch(() => null);
    return null;
  }

  return session.customer;
}

export async function createCustomerSession(customerId: string) {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = addDays(new Date(), SESSION_DAYS);

  const session = await prisma.customerSession.create({
    data: {
      token,
      customerId,
      expiresAt
    }
  });

  return session;
}

export async function deleteCustomerSession(token: string) {
  if (!token) return;
  await prisma.customerSession.delete({ where: { token } }).catch(() => null);
}

export async function validateEmailPassword(email: string, password: string) {
  const user = await prisma.customerUser.findUnique({ where: { email } });
  if (!user) return null;
  const hash = hashPassword(password, user.salt);
  if (hash !== user.passwordHash) return null;
  return user.customerId;
}

export async function createCustomerUser({
  name,
  phone,
  email,
  password
}: {
  name: string;
  phone: string;
  email: string;
  password: string;
}) {
  const existingUser = await prisma.customerUser.findUnique({ where: { email } });
  if (existingUser) {
    throw new Error("EMAIL_EXISTS");
  }

  const existingCustomerByPhone = await findCustomerByPhone(phone);
  const existingCustomerByEmail = await findCustomerByEmail(email);

  const customer =
    existingCustomerByEmail ||
    existingCustomerByPhone ||
    (await prisma.customer.create({
      data: {
        name,
        phone,
        email
      }
    }));

  if (customer.email !== email || customer.name !== name || customer.phone !== phone) {
    await prisma.customer.update({
      where: { id: customer.id },
      data: { email, name, phone }
    });
  }

  const salt = generateSalt();
  const passwordHash = hashPassword(password, salt);

  await prisma.customerUser.create({
    data: {
      email,
      salt,
      passwordHash,
      customerId: customer.id
    }
  });

  return customer.id;
}

export async function requestOtp(phone: string) {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = addMinutes(new Date(), OTP_MINUTES);
  await prisma.customerOtp.create({
    data: {
      phone,
      code,
      expiresAt
    }
  });
  return code;
}

export async function verifyOtp(phone: string, code: string) {
  const otp = await prisma.customerOtp.findFirst({
    where: {
      phone,
      code,
      consumedAt: null,
      expiresAt: { gt: new Date() }
    },
    orderBy: { createdAt: "desc" }
  });

  if (!otp) return false;

  await prisma.customerOtp.update({
    where: { id: otp.id },
    data: { consumedAt: new Date() }
  });

  return true;
}

export async function getOrCreateCustomerByPhone(phone: string) {
  const existing = await findCustomerByPhone(phone);
  if (existing) return existing.id;

  const customer = await prisma.customer.create({
    data: {
      name: "Cliente",
      phone
    }
  });

  return customer.id;
}
