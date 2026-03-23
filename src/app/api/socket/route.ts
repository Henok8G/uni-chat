import { initSocket } from "@/server/socket";
import { NextResponse } from "next/server";

export function GET() {
  initSocket();
  return NextResponse.json({ status: "Socket server initialized on port 3001" });
}
