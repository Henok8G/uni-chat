import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getConversationMessages, sendChatMessage } from "@/lib/chatService";

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const targetId = searchParams.get("targetId");
    const kind = (searchParams.get("kind") as "personal" | "group") || "personal";

    if (!targetId) {
      return NextResponse.json({ error: "Missing targetId" }, { status: 400 });
    }

    const messages = await getConversationMessages(user.id, targetId, kind);
    return NextResponse.json({ messages });
  } catch (error: any) {
    console.error("[API] GET /api/chat/messages error:", error);
    return NextResponse.json({ error: error?.message || "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { targetId, kind, text } = body;

    if (!targetId || !text) {
      return NextResponse.json({ error: "Missing targetId or text" }, { status: 400 });
    }

    const msg = await sendChatMessage(user.id, targetId, kind || "personal", text);
    if (!msg) {
      return NextResponse.json({ error: "Failed to send message" }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: msg });
  } catch (error: any) {
    console.error("[API] POST /api/chat/messages error:", error);
    return NextResponse.json({ error: error?.message || "Internal server error" }, { status: 500 });
  }
}
