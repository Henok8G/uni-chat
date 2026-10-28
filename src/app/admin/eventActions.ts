"use server";

import { prisma } from "@/lib/prisma";
import { requireAdminPermission } from "@/lib/auth";
import { logAuditAction } from "@/lib/audit";
import { PostStatus, ContentType, AuthorType, TargetType } from "@prisma/client";
import { EVENT_CATEGORIES, EventCategory } from "@/lib/eventConstants";

export interface AdminEventRecord {
  id: string;
  title: string;
  body: string;
  eventCategory: string;
  startDate: string | null;
  endDate: string | null;
  location: string | null;
  organizer: string | null;
  registrationUrl: string | null;
  imageUrl: string | null;
  isFeatured: boolean;
  isPinned: boolean;
  status: PostStatus;
  publishedAt: string | null;
  createdAt: string;
  author: {
    id: string;
    displayName: string | null;
    email: string;
  };
  club?: {
    id: string;
    name: string;
  } | null;
}

export interface EventManagementDashboardData {
  events: AdminEventRecord[];
  stats: {
    total: number;
    published: number;
    featured: number;
    drafts: number;
    upcoming: number;
  };
}

export interface EventInput {
  title: string;
  description: string;
  category: string;
  startDate: string;
  endDate?: string | null;
  location: string;
  organizer: string;
  clubId?: string | null;
  registrationUrl?: string | null;
  imageUrl?: string | null;
  isFeatured?: boolean;
  status?: "DRAFT" | "PUBLISHED";
}

/**
 * Validate URL strictly for security (http/https only, no javascript: or data: URIs)
 */
function isValidHttpUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Fetch all events for the Admin Events Management console
 */
export async function getAdminEventsData(): Promise<EventManagementDashboardData> {
  await requireAdminPermission("MANAGE_CONTENT");

  const posts = await prisma.post.findMany({
    where: {
      contentType: ContentType.EVENT,
      status: { in: [PostStatus.PUBLISHED, PostStatus.DRAFT, PostStatus.SCHEDULED, PostStatus.PENDING_REVIEW] },
    },
    include: {
      author: {
        select: {
          id: true,
          displayName: true,
          email: true,
        },
      },
      club: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: [
      { isPinned: "desc" },
      { isFeatured: "desc" },
      { startDate: "asc" },
      { createdAt: "desc" },
    ],
  });

  const now = new Date();
  let publishedCount = 0;
  let featuredCount = 0;
  let draftsCount = 0;
  let upcomingCount = 0;

  const events: AdminEventRecord[] = posts.map((p) => {
    if (p.status === PostStatus.PUBLISHED) publishedCount++;
    if (p.status === PostStatus.DRAFT) draftsCount++;
    if (p.isFeatured) featuredCount++;
    if (p.startDate && new Date(p.startDate) >= now && p.status === PostStatus.PUBLISHED) {
      upcomingCount++;
    }

    return {
      id: p.id,
      title: p.title,
      body: p.body,
      eventCategory: p.eventCategory || "Other",
      startDate: p.startDate ? p.startDate.toISOString() : null,
      endDate: p.endDate ? p.endDate.toISOString() : null,
      location: p.location,
      organizer: p.organizer || (p.club ? p.club.name : "AAU Administration"),
      registrationUrl: p.registrationUrl,
      imageUrl: p.imageUrl,
      isFeatured: Boolean(p.isFeatured),
      isPinned: Boolean(p.isPinned),
      status: p.status,
      publishedAt: p.publishedAt ? p.publishedAt.toISOString() : null,
      createdAt: p.createdAt.toISOString(),
      author: p.author,
      club: p.club,
    };
  });

  return {
    events,
    stats: {
      total: events.length,
      published: publishedCount,
      featured: featuredCount,
      drafts: draftsCount,
      upcoming: upcomingCount,
    },
  };
}

/**
 * Create a new event
 */
export async function createAdminEvent(input: EventInput) {
  const admin = await requireAdminPermission("MANAGE_CONTENT");

  const title = input.title?.trim();
  if (!title || title.length < 3) {
    throw new Error("Event title must be at least 3 characters.");
  }
  if (title.length > 200) {
    throw new Error("Event title cannot exceed 200 characters.");
  }

  const body = input.description?.trim();
  if (!body || body.length < 10) {
    throw new Error("Event description must be at least 10 characters.");
  }

  const category = input.category?.trim();
  if (!category || !EVENT_CATEGORIES.includes(category as EventCategory)) {
    throw new Error("Please select a valid event category.");
  }

  if (!input.startDate) {
    throw new Error("Start date and time are required.");
  }
  const startDate = new Date(input.startDate);
  if (isNaN(startDate.getTime())) {
    throw new Error("Invalid start date and time.");
  }

  let endDate: Date | null = null;
  if (input.endDate) {
    endDate = new Date(input.endDate);
    if (isNaN(endDate.getTime())) {
      throw new Error("Invalid end date and time.");
    }
    if (endDate < startDate) {
      throw new Error("End date and time cannot be before start date.");
    }
  }

  const location = input.location?.trim();
  if (!location) {
    throw new Error("Event location is required.");
  }

  const organizer = input.organizer?.trim();
  if (!organizer) {
    throw new Error("Event organizer is required.");
  }

  let registrationUrl: string | null = null;
  if (input.registrationUrl && input.registrationUrl.trim()) {
    const trimmedUrl = input.registrationUrl.trim();
    if (!isValidHttpUrl(trimmedUrl)) {
      throw new Error("Registration link must be a valid web URL starting with http:// or https://");
    }
    registrationUrl = trimmedUrl;
  }

  let imageUrl: string | null = null;
  if (input.imageUrl && input.imageUrl.trim()) {
    imageUrl = input.imageUrl.trim();
  }

  const isFeatured = Boolean(input.isFeatured);
  const status = input.status === "DRAFT" ? PostStatus.DRAFT : PostStatus.PUBLISHED;
  const publishedAt = status === PostStatus.PUBLISHED ? new Date() : null;

  const event = await prisma.post.create({
    data: {
      title,
      body,
      contentType: ContentType.EVENT,
      authorId: admin.id,
      authorType: AuthorType.ADMIN,
      clubId: input.clubId || null,
      eventCategory: category,
      startDate,
      endDate,
      location,
      organizer,
      registrationUrl,
      imageUrl,
      isFeatured,
      status,
      publishedAt,
    },
  });

  await logAuditAction({
    adminId: admin.id,
    action: status === PostStatus.PUBLISHED ? "CREATE_AND_PUBLISH_EVENT" : "CREATE_EVENT_DRAFT",
    targetType: TargetType.POST,
    targetId: event.id,
    details: {
      title: event.title,
      category,
      isFeatured,
      status,
      startDate: startDate.toISOString(),
    },
  });

  return event;
}

/**
 * Update an existing event
 */
export async function updateAdminEvent(eventId: string, input: EventInput) {
  const admin = await requireAdminPermission("MANAGE_CONTENT");

  const existing = await prisma.post.findUnique({
    where: { id: eventId },
  });
  if (!existing || existing.contentType !== ContentType.EVENT) {
    throw new Error("Event not found.");
  }

  const title = input.title?.trim();
  if (!title || title.length < 3) {
    throw new Error("Event title must be at least 3 characters.");
  }
  if (title.length > 200) {
    throw new Error("Event title cannot exceed 200 characters.");
  }

  const body = input.description?.trim();
  if (!body || body.length < 10) {
    throw new Error("Event description must be at least 10 characters.");
  }

  const category = input.category?.trim();
  if (!category || !EVENT_CATEGORIES.includes(category as EventCategory)) {
    throw new Error("Please select a valid event category.");
  }

  if (!input.startDate) {
    throw new Error("Start date and time are required.");
  }
  const startDate = new Date(input.startDate);
  if (isNaN(startDate.getTime())) {
    throw new Error("Invalid start date and time.");
  }

  let endDate: Date | null = null;
  if (input.endDate) {
    endDate = new Date(input.endDate);
    if (isNaN(endDate.getTime())) {
      throw new Error("Invalid end date and time.");
    }
    if (endDate < startDate) {
      throw new Error("End date and time cannot be before start date.");
    }
  }

  const location = input.location?.trim();
  if (!location) {
    throw new Error("Event location is required.");
  }

  const organizer = input.organizer?.trim();
  if (!organizer) {
    throw new Error("Event organizer is required.");
  }

  let registrationUrl: string | null = null;
  if (input.registrationUrl && input.registrationUrl.trim()) {
    const trimmedUrl = input.registrationUrl.trim();
    if (!isValidHttpUrl(trimmedUrl)) {
      throw new Error("Registration link must be a valid web URL starting with http:// or https://");
    }
    registrationUrl = trimmedUrl;
  }

  let imageUrl: string | null = null;
  if (input.imageUrl && input.imageUrl.trim()) {
    imageUrl = input.imageUrl.trim();
  }

  const isFeatured = Boolean(input.isFeatured);
  const status = input.status === "DRAFT" ? PostStatus.DRAFT : PostStatus.PUBLISHED;
  const publishedAt =
    status === PostStatus.PUBLISHED ? (existing.publishedAt ? existing.publishedAt : new Date()) : null;

  const updated = await prisma.post.update({
    where: { id: eventId },
    data: {
      title,
      body,
      clubId: input.clubId !== undefined ? input.clubId : existing.clubId,
      eventCategory: category,
      startDate,
      endDate,
      location,
      organizer,
      registrationUrl,
      imageUrl,
      isFeatured,
      status,
      publishedAt,
    },
  });

  await logAuditAction({
    adminId: admin.id,
    action: "UPDATE_EVENT",
    targetType: TargetType.POST,
    targetId: updated.id,
    details: {
      title: updated.title,
      category,
      isFeatured,
      status,
    },
  });

  return updated;
}

/**
 * Quick toggle featured status
 */
export async function toggleEventFeatured(eventId: string, isFeatured: boolean) {
  const admin = await requireAdminPermission("MANAGE_CONTENT");

  const event = await prisma.post.findUnique({ where: { id: eventId } });
  if (!event || event.contentType !== ContentType.EVENT) {
    throw new Error("Event not found.");
  }

  const updated = await prisma.post.update({
    where: { id: eventId },
    data: { isFeatured },
  });

  await logAuditAction({
    adminId: admin.id,
    action: isFeatured ? "FEATURE_EVENT" : "UNFEATURE_EVENT",
    targetType: TargetType.POST,
    targetId: eventId,
    details: { title: event.title, isFeatured },
  });

  return updated;
}

/**
 * Quick toggle publish status (DRAFT <-> PUBLISHED)
 */
export async function toggleEventPublish(eventId: string, newStatus: "DRAFT" | "PUBLISHED") {
  const admin = await requireAdminPermission("MANAGE_CONTENT");

  const event = await prisma.post.findUnique({ where: { id: eventId } });
  if (!event || event.contentType !== ContentType.EVENT) {
    throw new Error("Event not found.");
  }

  const status = newStatus === "DRAFT" ? PostStatus.DRAFT : PostStatus.PUBLISHED;
  const publishedAt = status === PostStatus.PUBLISHED ? (event.publishedAt || new Date()) : null;

  const updated = await prisma.post.update({
    where: { id: eventId },
    data: {
      status,
      publishedAt,
    },
  });

  await logAuditAction({
    adminId: admin.id,
    action: status === PostStatus.PUBLISHED ? "PUBLISH_EVENT" : "UNPUBLISH_EVENT_TO_DRAFT",
    targetType: TargetType.POST,
    targetId: eventId,
    details: { title: event.title, status },
  });

  return updated;
}

/**
 * Delete or archive an event
 */
export async function deleteEvent(eventId: string) {
  const admin = await requireAdminPermission("MANAGE_CONTENT");

  const event = await prisma.post.findUnique({ where: { id: eventId } });
  if (!event || event.contentType !== ContentType.EVENT) {
    throw new Error("Event not found.");
  }

  const updated = await prisma.post.update({
    where: { id: eventId },
    data: {
      status: PostStatus.ARCHIVED,
      isFeatured: false,
      isPinned: false,
    },
  });

  await logAuditAction({
    adminId: admin.id,
    action: "ARCHIVE_EVENT",
    targetType: TargetType.POST,
    targetId: eventId,
    details: { title: event.title },
  });

  return updated;
}

