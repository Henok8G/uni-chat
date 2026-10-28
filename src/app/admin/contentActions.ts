"use server";

import { prisma } from "@/lib/prisma";
import { requireAdminPermission } from "@/lib/auth";
import { logAuditAction } from "@/lib/audit";
import {
  PostStatus,
  ContentType,
  AuthorType,
  TargetType,
} from "@prisma/client";
import { createNotification } from "./backendActions";

export interface FeedSlotRecord {
  id: string;
  slotNumber: number;
  slotType: "HERO_PINNED" | "OPPORTUNITY" | "EVENT" | "OFFICIAL_CLUB" | "ANNOUNCEMENT" | "STUDENT_POST";
  slotLabel: string;
  source: string;
  campus: string;
  timeAgo: string;
  title: string;
  snippet: string;
  pinned: boolean;
  priority?: "NORMAL" | "IMPORTANT" | "URGENT";
  category?: string;
  authorRole?: string;
  authorType: string;
  likes?: number;
  comments?: number;
  rawPublishedAt: string | null;
}

export interface ReviewQueueRecord {
  id: string;
  itemNumber: string;
  category: "ANNOUNCEMENT" | "EVENT" | "STUDENT_POST" | "OPPORTUNITY" | "CLUB_POST";
  categoryLabel: string;
  authorName: string;
  authorOrg: string;
  authorBadge: string;
  badgeType: "authorized" | "club" | "verified" | "opportunity";
  title: string;
  description: string;
  scheduledTime?: string;
  targetCampus?: string;
  eventDate?: string;
  location?: string;
  department?: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
}

export interface ContentManagementDashboardData {
  activeOnFeedCount: number;
  pendingReviewCount: number;
  pinnedNoticesCount: number;
  scheduledBroadcastsCount: number;
  feedSlots: FeedSlotRecord[];
  reviewQueue: ReviewQueueRecord[];
  scheduledPosts: Array<{
    id: string;
    title: string;
    scheduledAt: string;
    authorName: string;
  }>;
  drafts: Array<{
    id: string;
    title: string;
    body: string;
    updatedAt: string;
    contentType: string;
  }>;
  analytics: {
    totalPublished: number;
    officialCount: number;
    peerCount: number;
    officialPercentage: number;
    peerPercentage: number;
    impressionStatus: string;
    complianceStatus: string;
  };
}

/**
 * Format relative time (e.g., "2h ago", "Today 3:00 PM", "Yesterday")
 */
function formatTimeAgo(date: Date | null): string {
  if (!date) return "Recently";
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 2) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/**
 * Map Prisma ContentType & AuthorType to UI Slot Types & Labels
 */
function mapToSlotType(post: {
  isPinned: boolean;
  contentType: ContentType;
  authorType: AuthorType;
}): {
  slotType: FeedSlotRecord["slotType"];
  slotLabel: string;
  category: string;
} {
  if (post.isPinned) {
    return {
      slotType: "HERO_PINNED",
      slotLabel: "HERO PINNED",
      category: "Hero Announcement",
    };
  }

  switch (post.contentType) {
    case ContentType.EVENT:
      return { slotType: "EVENT", slotLabel: "Campus Event", category: "Event" };
    case ContentType.OPPORTUNITY:
      return { slotType: "OPPORTUNITY", slotLabel: "Opportunity", category: "Grant & Opportunity" };
    case ContentType.CLUB_POST:
      return { slotType: "OFFICIAL_CLUB", slotLabel: "Official Club", category: "Club Activity" };
    case ContentType.STUDENT_POST:
      return { slotType: "STUDENT_POST", slotLabel: "Student Voice", category: "Peer Post" };
    case ContentType.ANNOUNCEMENT:
    default:
      return { slotType: "ANNOUNCEMENT", slotLabel: "Announcement", category: "Academic Notice" };
  }
}

/**
 * Sweeps and transitions scheduled posts whose scheduled time has arrived.
 */
async function processDueScheduledPosts() {
  try {
    const dueCount = await prisma.post.updateMany({
      where: {
        status: PostStatus.SCHEDULED,
        scheduledAt: { lte: new Date() },
      },
      data: {
        status: PostStatus.PUBLISHED,
        publishedAt: new Date(),
      },
    });
    return dueCount.count;
  } catch (error) {
    console.error("Failed to process due scheduled posts:", error);
    return 0;
  }
}

/**
 * Retrieve all live content data for SCREEN_26 Content Management & Home Feed Curation.
 */
export async function getContentManagementData(): Promise<ContentManagementDashboardData> {
  const admin = await requireAdminPermission("MANAGE_CONTENT");

  // Run scheduled sweep
  await processDueScheduledPosts();

  const now = new Date();

  // Execute database queries concurrently
  const [
    activeOnFeedCount,
    pendingReviewCount,
    pinnedNoticesCount,
    scheduledBroadcastsCount,
    rawPublishedPosts,
    rawPendingPosts,
    rawScheduledPosts,
    rawDrafts,
    officialPublishedCount,
    peerPublishedCount,
  ] = await Promise.all([
    // 1. Active on feed count
    prisma.post.count({
      where: { status: PostStatus.PUBLISHED },
    }),
    // 2. Pending review count
    prisma.post.count({
      where: { status: PostStatus.PENDING_REVIEW },
    }),
    // 3. Pinned notices count
    prisma.post.count({
      where: { status: PostStatus.PUBLISHED, isPinned: true },
    }),
    // 4. Scheduled broadcasts count (scheduled in the future)
    prisma.post.count({
      where: {
        status: PostStatus.SCHEDULED,
        scheduledAt: { gt: now },
      },
    }),
    // 5. Published posts for placement shelf
    prisma.post.findMany({
      where: { status: PostStatus.PUBLISHED },
      include: {
        author: {
          select: {
            id: true,
            displayName: true,
            email: true,
            role: true,
            department: true,
            university: { select: { name: true } },
          },
        },
        club: { select: { id: true, name: true } },
        _count: { select: { reports: true } },
      },
      orderBy: [{ isPinned: "desc" }, { publishedAt: "desc" }],
      take: 50,
    }),
    // 6. Review queue submissions
    prisma.post.findMany({
      where: { status: PostStatus.PENDING_REVIEW },
      include: {
        author: {
          select: {
            id: true,
            displayName: true,
            email: true,
            role: true,
            department: true,
            postReadyStatus: true,
            university: { select: { name: true } },
          },
        },
        club: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    // 7. Scheduled posts
    prisma.post.findMany({
      where: {
        status: PostStatus.SCHEDULED,
        scheduledAt: { gt: now },
      },
      include: {
        author: { select: { displayName: true, email: true } },
      },
      orderBy: { scheduledAt: "asc" },
      take: 10,
    }),
    // 8. Administrative drafts
    prisma.post.findMany({
      where: {
        status: PostStatus.DRAFT,
        authorId: admin.id,
      },
      orderBy: { updatedAt: "desc" },
      take: 10,
    }),
    // 9. Official author types published count
    prisma.post.count({
      where: {
        status: PostStatus.PUBLISHED,
        authorType: { in: [AuthorType.ADMIN, AuthorType.DEPARTMENT, AuthorType.TEACHER] },
      },
    }),
    // 10. Peer author types published count
    prisma.post.count({
      where: {
        status: PostStatus.PUBLISHED,
        authorType: { in: [AuthorType.STUDENT, AuthorType.CLUB] },
      },
    }),
  ]);

  // Format feed slots
  const feedSlots: FeedSlotRecord[] = rawPublishedPosts.map((post, idx) => {
    const { slotType, slotLabel, category } = mapToSlotType(post);
    const authorName = post.author?.displayName || post.author?.email?.split("@")[0] || "University Staff";
    const campus = post.author?.university?.name || post.author?.department || "AAU Main Campus";

    return {
      id: post.id,
      slotNumber: idx + 1,
      slotType,
      slotLabel: `Slot ${idx + 1} · ${slotLabel}`,
      source: post.club ? `${post.club.name} · AAU` : `${authorName} · ${campus}`,
      campus,
      timeAgo: formatTimeAgo(post.publishedAt),
      title: post.title,
      snippet: post.body,
      pinned: post.isPinned,
      priority: post.isPinned ? "URGENT" : post.isFeatured ? "IMPORTANT" : "NORMAL",
      category,
      authorRole: post.club ? `Club: ${post.club.name}` : post.author?.department || "AAU Administration",
      authorType: post.authorType,
      likes: 0,
      comments: post._count.reports,
      rawPublishedAt: post.publishedAt ? post.publishedAt.toISOString() : null,
    };
  });

  // Format review queue items
  const reviewQueue: ReviewQueueRecord[] = rawPendingPosts.map((post, idx) => {
    const authorName = post.author?.displayName || post.author?.email || "Student Submitter";
    let category: ReviewQueueRecord["category"] = "STUDENT_POST";
    let categoryLabel = "Student Post";
    let badgeType: ReviewQueueRecord["badgeType"] = "verified";
    let authorBadge = "Verified Student";

    if (post.contentType === ContentType.ANNOUNCEMENT) {
      category = "ANNOUNCEMENT";
      categoryLabel = "Announcement";
      badgeType = "authorized";
      authorBadge = "Authorized Entity";
    } else if (post.contentType === ContentType.EVENT) {
      category = "EVENT";
      categoryLabel = "Event";
      badgeType = "authorized";
      authorBadge = "Campus Organizer";
    } else if (post.contentType === ContentType.OPPORTUNITY) {
      category = "OPPORTUNITY";
      categoryLabel = "Opportunity";
      badgeType = "opportunity";
      authorBadge = "Research / Opportunity";
    } else if (post.contentType === ContentType.CLUB_POST || post.club) {
      category = "CLUB_POST";
      categoryLabel = "Club Post";
      badgeType = "club";
      authorBadge = post.club?.name ? `Club · ${post.club.name}` : "Official Club";
    }

    if (post.author?.postReadyStatus === "APPROVED") {
      authorBadge = "Post-Ready Verified";
      badgeType = "verified";
    }

    return {
      id: post.id,
      itemNumber: `#${post.id.slice(-4).toUpperCase()}`,
      category,
      categoryLabel,
      authorName,
      authorOrg: post.club?.name || post.author?.department || "AAU Student Community",
      authorBadge,
      badgeType,
      title: post.title,
      description: post.body,
      targetCampus: post.author?.university?.name || "All Campuses",
      department: post.author?.department || undefined,
      status: "PENDING",
      createdAt: formatTimeAgo(post.createdAt),
    };
  });

  // Calculate official vs peer ratios
  const totalPublished = activeOnFeedCount;
  let officialPercentage = 0;
  let peerPercentage = 0;
  if (totalPublished > 0) {
    officialPercentage = Math.round((officialPublishedCount / totalPublished) * 100);
    peerPercentage = 100 - officialPercentage;
  }

  return {
    activeOnFeedCount,
    pendingReviewCount,
    pinnedNoticesCount,
    scheduledBroadcastsCount,
    feedSlots,
    reviewQueue,
    scheduledPosts: rawScheduledPosts.map((p) => ({
      id: p.id,
      title: p.title,
      scheduledAt: p.scheduledAt ? p.scheduledAt.toISOString() : "",
      authorName: p.author?.displayName || p.author?.email || "Staff",
    })),
    drafts: rawDrafts.map((d) => ({
      id: d.id,
      title: d.title,
      body: d.body,
      updatedAt: d.updatedAt.toISOString(),
      contentType: d.contentType,
    })),
    analytics: {
      totalPublished,
      officialCount: officialPublishedCount,
      peerCount: peerPublishedCount,
      officialPercentage,
      peerPercentage,
      impressionStatus: "Telemetry tracking pending (client event collector pipeline inactive)",
      complianceStatus: "AAU Editorial & Content Authorization Guidelines Enforced",
    },
  };
}

/**
 * Toggle pin state on a published post.
 */
export async function togglePostPin(postId: string, isPinned: boolean) {
  const admin = await requireAdminPermission("MANAGE_CONTENT");

  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) throw new Error("Post not found");

  const updated = await prisma.post.update({
    where: { id: postId },
    data: { isPinned },
  });

  await logAuditAction({
    adminId: admin.id,
    action: isPinned ? "PIN_POST" : "UNPIN_POST",
    targetType: TargetType.POST,
    targetId: postId,
    details: { title: post.title, isPinned },
  });

  return updated;
}

/**
 * Review a submission from the Content Review Queue.
 */
export async function reviewPostSubmission(
  postId: string,
  action: "APPROVE" | "APPROVE_AND_PIN" | "REJECT",
  rejectReason?: string
) {
  const admin = await requireAdminPermission("MANAGE_CONTENT");

  const post = await prisma.post.findUnique({
    where: { id: postId },
    include: { author: true },
  });
  if (!post) throw new Error("Submission not found");

  if (action === "APPROVE" || action === "APPROVE_AND_PIN") {
    const updated = await prisma.post.update({
      where: { id: postId },
      data: {
        status: PostStatus.PUBLISHED,
        publishedAt: new Date(),
        isPinned: action === "APPROVE_AND_PIN",
        reviewedById: admin.id,
        reviewedAt: new Date(),
        rejectReason: null,
      },
    });

    await logAuditAction({
      adminId: admin.id,
      action: action === "APPROVE_AND_PIN" ? "APPROVE_AND_PIN_POST" : "APPROVE_POST",
      targetType: TargetType.POST,
      targetId: postId,
      details: { title: post.title, isPinned: action === "APPROVE_AND_PIN" },
    });

    // Notify submitter
    await createNotification({
      userId: post.authorId,
      type: "SYSTEM",
      title: "Content Submission Approved",
      message: `Your post "${post.title}" has been reviewed and published to the student Home feed.${
        action === "APPROVE_AND_PIN" ? " It has also been pinned to the top." : ""
      }`,
    });

    return updated;
  } else {
    // REJECT
    const updated = await prisma.post.update({
      where: { id: postId },
      data: {
        status: PostStatus.REJECTED,
        reviewedById: admin.id,
        reviewedAt: new Date(),
        rejectReason: rejectReason || "Content does not meet community posting guidelines.",
      },
    });

    await logAuditAction({
      adminId: admin.id,
      action: "REJECT_POST",
      targetType: TargetType.POST,
      targetId: postId,
      details: { title: post.title, reason: rejectReason },
    });

    // Notify submitter
    await createNotification({
      userId: post.authorId,
      type: "SYSTEM",
      title: "Content Submission Update",
      message: `Your post "${post.title}" was not approved. Reason: ${
        rejectReason || "Does not meet community posting guidelines."
      }`,
    });

    return updated;
  }
}

/**
 * Create or save an institutional post from the Official Content Composer.
 */
export async function saveOrPublishPost(params: {
  id?: string;
  title: string;
  body: string;
  contentType: ContentType;
  authorType?: AuthorType;
  isPinned?: boolean;
  action: "PUBLISH" | "DRAFT" | "SCHEDULE";
  scheduledAt?: string;
}) {
  const admin = await requireAdminPermission("MANAGE_CONTENT");

  if (!params.title || !params.title.trim()) {
    throw new Error("Announcement title is required.");
  }
  if (!params.body || !params.body.trim()) {
    throw new Error("Announcement body text is required.");
  }

  let status: PostStatus = PostStatus.PUBLISHED;
  let publishedAt: Date | null = new Date();
  let scheduledAt: Date | null = null;

  if (params.action === "DRAFT") {
    status = PostStatus.DRAFT;
    publishedAt = null;
  } else if (params.action === "SCHEDULE") {
    if (!params.scheduledAt) {
      throw new Error("A valid future date and time is required for scheduling.");
    }
    const schedDate = new Date(params.scheduledAt);
    if (isNaN(schedDate.getTime()) || schedDate <= new Date()) {
      throw new Error("Scheduled publication time must be in the future.");
    }
    status = PostStatus.SCHEDULED;
    scheduledAt = schedDate;
    publishedAt = null;
  }

  let post;
  if (params.id) {
    // Update existing record
    post = await prisma.post.update({
      where: { id: params.id },
      data: {
        title: params.title.trim(),
        body: params.body.trim(),
        contentType: params.contentType,
        authorType: params.authorType || AuthorType.ADMIN,
        isPinned: params.isPinned ?? false,
        status,
        publishedAt,
        scheduledAt,
      },
    });

    await logAuditAction({
      adminId: admin.id,
      action: `UPDATE_POST_${params.action}`,
      targetType: TargetType.POST,
      targetId: post.id,
      details: { title: post.title, action: params.action },
    });
  } else {
    // Create new record
    post = await prisma.post.create({
      data: {
        title: params.title.trim(),
        body: params.body.trim(),
        contentType: params.contentType,
        authorId: admin.id,
        authorType: params.authorType || AuthorType.ADMIN,
        isPinned: params.isPinned ?? false,
        status,
        publishedAt,
        scheduledAt,
      },
    });

    await logAuditAction({
      adminId: admin.id,
      action: `CREATE_OFFICIAL_POST_${params.action}`,
      targetType: TargetType.POST,
      targetId: post.id,
      details: { title: post.title, action: params.action, scheduledAt: scheduledAt?.toISOString() },
    });
  }

  return post;
}

/**
 * Remove or archive a post.
 */
export async function deleteOrArchivePost(postId: string) {
  const admin = await requireAdminPermission("MANAGE_CONTENT");

  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) throw new Error("Post not found");

  const updated = await prisma.post.update({
    where: { id: postId },
    data: { status: PostStatus.ARCHIVED, isPinned: false },
  });

  await logAuditAction({
    adminId: admin.id,
    action: "ARCHIVE_POST",
    targetType: TargetType.POST,
    targetId: postId,
    details: { title: post.title },
  });

  return updated;
}
