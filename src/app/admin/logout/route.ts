import { NextResponse } from "next/server";

function buildLogoutResponse(request: Request) {
  const response = NextResponse.redirect(new URL("/admin/login", request.url));
  response.cookies.delete("admin_session");
  return response;
}

export async function POST(request: Request) {
  return buildLogoutResponse(request);
}

export async function GET(request: Request) {
  return buildLogoutResponse(request);
}
