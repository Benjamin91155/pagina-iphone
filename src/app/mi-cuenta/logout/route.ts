import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { deleteCustomerSession } from "@/lib/customer-auth";

async function buildLogoutResponse(request: Request) {
  const token = cookies().get("customer_session")?.value;
  if (token) {
    await deleteCustomerSession(token);
  }
  const response = NextResponse.redirect(new URL("/mi-cuenta/login", request.url));
  response.cookies.delete("customer_session");
  return response;
}

export async function GET(request: Request) {
  return buildLogoutResponse(request);
}

export async function POST(request: Request) {
  return buildLogoutResponse(request);
}
