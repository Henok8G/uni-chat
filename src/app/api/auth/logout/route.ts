import { NextRequest, NextResponse } from "next/server";
import { destroySession } from "@/lib/auth";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export async function POST() {
  await destroySession();
  return NextResponse.redirect(baseUrl);
}

export async function GET(request: NextRequest) {
  await destroySession();
  return NextResponse.redirect(new URL("/", request.url));
}

