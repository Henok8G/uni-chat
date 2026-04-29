import { prisma } from "./prisma";
import { Plan } from "@prisma/client";

export enum AnalyticsEventType {
  USER_SIGNED_UP = "USER_SIGNED_UP",
  USER_VERIFIED = "USER_VERIFIED",
  USER_UPGRADED_PLAN = "USER_UPGRADED_PLAN",
  USER_BANNED = "USER_BANNED",
  SESSION_STARTED = "SESSION_STARTED",
  SESSION_ENDED = "SESSION_ENDED",
  MESSAGE_SENT = "MESSAGE_SENT",
  WEBRTC_STARTED = "WEBRTC_STARTED",
  WEBRTC_FAILED = "WEBRTC_FAILED",
  REPORT_CREATED = "REPORT_CREATED",
  REPORT_RESOLVED = "REPORT_RESOLVED",
  COLLAB_CHANNEL_OPENED = "COLLAB_CHANNEL_OPENED",
  REACTION_SENT = "REACTION_SENT",
}

export interface AnalyticsEventOptions {
  userId?: string;
  sessionId?: string;
  universityId?: string;
  plan?: Plan;
  properties?: Record<string, any>;
}

export function logAnalyticsEvent(type: AnalyticsEventType, options: AnalyticsEventOptions = {}) {
  // Respect the ANALYTICS_ENABLED flag or allow it in production.
  const isEnabled = process.env.ANALYTICS_ENABLED === "true" || process.env.NODE_ENV === "production";
  
  if (!isEnabled) {
    // console.log("[Analytics Debug Muted]", type, options);
    return;
  }

  // Fire and forget using Promise .catch to prevent blocking
  prisma.analyticsEvent.create({
    data: {
      type,
      userId: options.userId,
      sessionId: options.sessionId,
      universityId: options.universityId,
      plan: options.plan,
      // Prisma Json needs to be passed directly or as a serialized object. 
      // If passing a Record<string, any>, it should be fine natively with prisma client JSON typings,
      // but to be safe we can encode it or just pass it as an object since Prisma takes objects for JSON.
      properties: options.properties || {},
    }
  }).catch((err: unknown) => {
    console.error("[Analytics Error] Failed to log event:", type, err);
  });
}
