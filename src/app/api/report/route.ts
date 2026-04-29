import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logInfo, logWarn, logError } from "@/lib/logger";
import { incrementMetric } from "@/lib/metrics";
import { MAX_REPORTS_PER_HOUR } from "@/config/limits";
import { ReasonCategory } from "@prisma/client";
import { logAnalyticsEvent, AnalyticsEventType } from "@/lib/analytics";

export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { chatSessionId, reasonCategory, details } = await req.json();

    if (!chatSessionId || !reasonCategory) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Rate limiting: max reports per hour (configured via MAX_REPORTS_PER_HOUR env var)
    const recentReports = await prisma.report.count({
      where: {
        reporterId: user.id,
        createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) }
      }
    });

    if (recentReports >= MAX_REPORTS_PER_HOUR) {
      logWarn("Report", "Rate limit exceeded", { userId: user.id, recentReports });
      return NextResponse.json(
        { error: `Rate limit exceeded. You can only file ${MAX_REPORTS_PER_HOUR} reports per hour.` },
        { status: 429 }
      );
    }

    const session = await prisma.chatSession.findUnique({
      where: { id: chatSessionId }
    });

    if (!session) {
      return NextResponse.json({ error: "Chat session not found" }, { status: 404 });
    }

    if (session.userAId !== user.id && session.userBId !== user.id) {
      return NextResponse.json({ error: "You are not part of this session" }, { status: 403 });
    }

    const reportedUserId = session.userAId === user.id ? session.userBId : session.userAId;

    // Prevent duplicate reports for same session
    const existing = await prisma.report.findFirst({
      where: { chatSessionId, reporterId: user.id }
    });

    if (existing) {
      return NextResponse.json({ error: "You already reported this session" }, { status: 400 });
    }

    const report = await prisma.report.create({
      data: {
        reporterId: user.id,
        reportedUserId,
        chatSessionId,
        reasonCategory: reasonCategory as ReasonCategory,
        details,
      }
    });

    logAnalyticsEvent(AnalyticsEventType.REPORT_CREATED, {
      userId: user.id,
      sessionId: chatSessionId,
      properties: { reasonCategory },
    });

    // Log report creation (category only – no free-text details logged for privacy)
    incrementMetric("totalReportsCreated");
    logInfo("Report", "Report created", {
      reportId: report.id,
      reasonCategory,
      chatSessionId,
    });

    return NextResponse.json({ success: true, reportId: report.id });
  } catch (error: unknown) {
    logError("Report", "Unexpected error in report API", { error: String(error) });
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
