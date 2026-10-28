import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import {
  getPersonalChatsForUser,
  getFriendshipStatus,
  sendFriendRequest,
  acceptFriendRequest,
  declineFriendRequest,
  cancelFriendRequest,
  getReceivedFriendRequests,
  getSentFriendRequests,
} from "@/lib/chatService";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const checkId = searchParams.get("check");
    const listType = searchParams.get("list");

    if (listType === "full") {
      const friends = await getPersonalChatsForUser(user.id);
      return NextResponse.json(
        { friends },
        {
          headers: {
            "Cache-Control": "private, no-cache, no-transform",
          },
        }
      );
    }

    if (listType === "requests") {
      const [received, sent] = await Promise.all([
        getReceivedFriendRequests(user.id),
        getSentFriendRequests(user.id),
      ]);
      return NextResponse.json({ received, sent });
    }

    if (checkId) {
      const status = await getFriendshipStatus(user.id, checkId);
      return NextResponse.json(status);
    }

    const allFriends = await prisma.friendship.findMany({
      where: { userId: user.id },
      select: { friendId: true },
    });
    return NextResponse.json({ friendIds: allFriends.map((f) => f.friendId) });
  } catch (error: any) {
    console.error("[API] GET /api/chat/friend error:", error);
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
    const action = body.action || "request";

    if (action === "accept") {
      const requestId = body.requestId;
      if (!requestId) {
        return NextResponse.json({ error: "Missing requestId" }, { status: 400 });
      }
      const res = await acceptFriendRequest(requestId, user.id);
      if (!res.success) {
        const status = res.error?.includes("Unauthorized") ? 403 : 400;
        return NextResponse.json({ error: res.error }, { status });
      }
      return NextResponse.json({ success: true, message: res.message || "Friend request accepted" });
    }

    if (action === "decline") {
      const requestId = body.requestId;
      if (!requestId) {
        return NextResponse.json({ error: "Missing requestId" }, { status: 400 });
      }
      const res = await declineFriendRequest(requestId, user.id);
      if (!res.success) {
        const status = res.error?.includes("Unauthorized") ? 403 : 400;
        return NextResponse.json({ error: res.error }, { status });
      }
      return NextResponse.json({ success: true, message: res.message || "Friend request declined" });
    }

    if (action === "cancel") {
      const requestId = body.requestId;
      if (!requestId) {
        return NextResponse.json({ error: "Missing requestId" }, { status: 400 });
      }
      const res = await cancelFriendRequest(requestId, user.id);
      if (!res.success) {
        const status = res.error?.includes("Unauthorized") ? 403 : 400;
        return NextResponse.json({ error: res.error }, { status });
      }
      return NextResponse.json({ success: true, message: res.message || "Friend request cancelled" });
    }

    // Default action: send friend request
    const targetId = body.friendId || body.receiverId;
    if (!targetId) {
      return NextResponse.json({ error: "Missing friendId or receiverId" }, { status: 400 });
    }

    const res = await sendFriendRequest(user.id, targetId);
    if (!res.success) {
      return NextResponse.json({ error: res.error, isFriend: res.isFriend }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      status: res.status,
      message: res.message || "Friend request sent",
      isFriend: res.isFriend,
    });
  } catch (error: any) {
    console.error("[API] /api/chat/friend error:", error);
    return NextResponse.json({ error: error?.message || "Internal server error" }, { status: 500 });
  }
}
