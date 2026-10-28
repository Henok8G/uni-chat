"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import {
  Wifi,
  Inbox,
  Pin,
  Calendar,
  Clock,
  Sparkles,
  SlidersHorizontal,
  RefreshCw,
  Plus,
  Eye,
  Check,
  X,
  ChevronDown,
  Building,
  GraduationCap,
  Users,
  FlaskConical,
  MessageSquare,
  AlertCircle,
  ShieldCheck,
  Activity,
  Trash2,
  Share2,
  CheckCircle2,
  MapPin,
  Send,
  Sliders,
  Bookmark,
  Megaphone,
  Radio,
  Loader2,
  Edit3
} from "lucide-react";
import {
  getContentManagementData,
  togglePostPin,
  reviewPostSubmission,
  saveOrPublishPost,
  deleteOrArchivePost,
  ContentManagementDashboardData,
  FeedSlotRecord,
  ReviewQueueRecord
} from "./contentActions";

interface ContentManagementViewProps {
  onBackToOverview?: () => void;
  onShowToast: (message: string) => void;
}

export function ContentManagementView({
  onBackToOverview,
  onShowToast
}: ContentManagementViewProps) {
  // Main live dashboard data
  const [data, setData] = useState<ContentManagementDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Review Queue Filter State
  const [activeQueueFilter, setActiveQueueFilter] = useState<"ALL" | "OFFICIAL" | "CLUBS" | "STUDENTS">("ALL");

  // Official Composer Form State
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [composerTitle, setComposerTitle] = useState("");
  const [composerContentType, setComposerContentType] = useState<"ANNOUNCEMENT" | "EVENT" | "OPPORTUNITY" | "CLUB_POST">("ANNOUNCEMENT");
  const [publishingEntity, setPublishingEntity] = useState("Computer Science Dept");
  const [targetAudience, setTargetAudience] = useState("4 Kilo Campus Only");
  const [priorityLevel, setPriorityLevel] = useState<"NORMAL" | "IMPORTANT" | "CAMPUS_ALERT">("IMPORTANT");
  const [composerBody, setComposerBody] = useState("");
  const [hasAttachedMedia, setHasAttachedMedia] = useState(false);
  const [pinToTop, setPinToTop] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);
  const [scheduledDateTime, setScheduledDateTime] = useState("");
  const [isSubmittingComposer, setIsSubmittingComposer] = useState(false);


  // Rejection Modal State
  const [rejectionModalItem, setRejectionModalItem] = useState<ReviewQueueRecord | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Modals
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isAlgorithmOpen, setIsAlgorithmOpen] = useState(false);
  const [isReorderingNoticeOpen, setIsReorderingNoticeOpen] = useState(false);

  // Fetch live database records
  const loadData = useCallback(async (quiet = false) => {
    if (!quiet) setIsLoading(true);
    else setIsRefreshing(true);
    setError(null);

    try {
      const result = await getContentManagementData();
      setData(result);
    } catch (err: any) {
      console.error("Failed to load content management data:", err);
      setError(err?.message || "Failed to load content data from server");
      onShowToast(err?.message || "Failed to load live content");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [onShowToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Review Queue Filtering
  const filteredQueue = (data?.reviewQueue || []).filter((item) => {
    if (activeQueueFilter === "ALL") return true;
    if (activeQueueFilter === "OFFICIAL") return item.category === "ANNOUNCEMENT" || item.badgeType === "authorized";
    if (activeQueueFilter === "CLUBS") return item.category === "CLUB_POST" || item.category === "EVENT" || item.badgeType === "club";
    if (activeQueueFilter === "STUDENTS") return item.category === "STUDENT_POST" || item.badgeType === "verified";
    return true;
  });

  // Action: Approve & Pin item from review queue
  const handleApproveAndPin = async (item: ReviewQueueRecord) => {
    try {
      setIsSubmittingReview(true);
      await reviewPostSubmission(item.id, "APPROVE_AND_PIN");
      onShowToast(`Approved & Pinned: "${item.title}" is now Slot #1 on student feed!`);
      await loadData(true);
    } catch (err: any) {
      onShowToast(err?.message || "Failed to approve and pin submission");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Action: Approve for Feed (Standard Placement)
  const handleApproveForFeed = async (item: ReviewQueueRecord) => {
    try {
      setIsSubmittingReview(true);
      await reviewPostSubmission(item.id, "APPROVE");
      onShowToast(`Approved: "${item.title}" is now published on the student feed.`);
      await loadData(true);
    } catch (err: any) {
      onShowToast(err?.message || "Failed to approve submission");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Action: Dismiss/Reject Queue item
  const handleConfirmRejection = async () => {
    if (!rejectionModalItem) return;
    try {
      setIsSubmittingReview(true);
      await reviewPostSubmission(
        rejectionModalItem.id,
        "REJECT",
        rejectionReason.trim() || "Submission does not adhere to publishing guidelines."
      );
      onShowToast(`Rejected submission: "${rejectionModalItem.title}"`);
      setRejectionModalItem(null);
      setRejectionReason("");
      await loadData(true);
    } catch (err: any) {
      onShowToast(err?.message || "Failed to reject submission");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Action: Toggle Pin on Slot
  const handleTogglePin = async (id: string, currentPin: boolean) => {
    try {
      await togglePostPin(id, !currentPin);
      onShowToast(!currentPin ? "Post pinned to top of feed" : "Post unpinned from top");
      await loadData(true);
    } catch (err: any) {
      onShowToast(err?.message || "Failed to update pin state");
    }
  };

  // Action: Archive / Remove Post
  const handleArchivePost = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to remove "${title}" from the active feed?`)) return;
    try {
      await deleteOrArchivePost(id);
      onShowToast(`Archived "${title}" from active feed`);
      await loadData(true);
    } catch (err: any) {
      onShowToast(err?.message || "Failed to archive post");
    }
  };

  // Action: Publish Broadcast from Composer
  const handlePublishComposer = async () => {
    if (!composerTitle.trim()) {
      onShowToast("Please enter an announcement title");
      return;
    }
    if (!composerBody.trim()) {
      onShowToast("Please enter announcement body content");
      return;
    }

    try {
      setIsSubmittingComposer(true);
      await saveOrPublishPost({
        id: editingPostId || undefined,
        title: composerTitle,
        body: composerBody,
        contentType: composerContentType,
        isPinned: pinToTop,
        action: "PUBLISH"
      });

      onShowToast(`🚀 Broadcast Published: "${composerTitle}" is now live on the AAU Home Feed!`);
      // Reset composer
      setEditingPostId(null);
      setComposerTitle("");
      setComposerBody("");
      setComposerContentType("ANNOUNCEMENT");
      setPinToTop(false);
      setIsScheduling(false);
      setScheduledDateTime("");
      await loadData(true);
    } catch (err: any) {
      onShowToast(err?.message || "Failed to publish broadcast");
    } finally {
      setIsSubmittingComposer(false);
    }
  };

  // Action: Save Draft
  const handleSaveDraft = async () => {
    if (!composerTitle.trim()) {
      onShowToast("Please enter an announcement title to save draft");
      return;
    }

    try {
      setIsSubmittingComposer(true);
      await saveOrPublishPost({
        id: editingPostId || undefined,
        title: composerTitle,
        body: composerBody || "Draft notes...",
        contentType: composerContentType,
        isPinned: pinToTop,
        action: "DRAFT"
      });

      onShowToast("Saved draft to database");
      setEditingPostId(null);
      await loadData(true);
    } catch (err: any) {
      onShowToast(err?.message || "Failed to save draft");
    } finally {
      setIsSubmittingComposer(false);
    }
  };

  // Action: Schedule Post
  const handleSchedulePost = async () => {
    if (!composerTitle.trim()) {
      onShowToast("Please enter an announcement title");
      return;
    }
    if (!scheduledDateTime) {
      onShowToast("Please select a future date and time to schedule");
      return;
    }

    try {
      setIsSubmittingComposer(true);
      await saveOrPublishPost({
        id: editingPostId || undefined,
        title: composerTitle,
        body: composerBody || "Scheduled notice",
        contentType: composerContentType,
        isPinned: pinToTop,
        action: "SCHEDULE",
        scheduledAt: scheduledDateTime
      });

      onShowToast(`Scheduled broadcast for ${new Date(scheduledDateTime).toLocaleString()}`);
      setEditingPostId(null);
      setComposerTitle("");
      setComposerBody("");
      setComposerContentType("ANNOUNCEMENT");
      setIsScheduling(false);
      setScheduledDateTime("");
      await loadData(true);
    } catch (err: any) {
      onShowToast(err?.message || "Failed to schedule broadcast");
    } finally {
      setIsSubmittingComposer(false);
    }
  };

  // Load slot/post into composer for editing
  const loadIntoComposer = (slot: { id: string; title: string; snippet?: string; body?: string; category?: string }) => {
    setEditingPostId(slot.id);
    setComposerTitle(slot.title);
    setComposerBody(slot.snippet || slot.body || "");
    if (slot.category === "EVENT" || slot.category === "OPPORTUNITY" || slot.category === "CLUB_POST" || slot.category === "ANNOUNCEMENT") {
      setComposerContentType(slot.category);
    }
    const composerCard = document.getElementById("official-composer-card");
    if (composerCard) composerCard.scrollIntoView({ behavior: "smooth" });
    onShowToast(`Loaded "${slot.title.slice(0, 30)}..." into editor`);
  };


  // Loading skeleton state
  if (isLoading) {
    return (
      <div className="space-y-6 animate-in fade-in duration-200">
        <div className="p-12 text-center flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <p className="text-sm font-semibold text-slate-700">Loading feed curation console...</p>
          <p className="text-xs text-slate-400">Connecting to PostgreSQL and live feed records</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !data) {
    return (
      <div className="space-y-6 animate-in fade-in duration-200">
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-rose-600 mx-auto" />
          <h3 className="text-base font-bold text-rose-900">Unable to load feed data</h3>
          <p className="text-xs text-rose-700 max-w-md mx-auto">{error}</p>
          <button
            onClick={() => loadData()}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-full shadow-xs cursor-pointer"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  const feedSlots = data?.feedSlots || [];
  const reviewQueue = data?.reviewQueue || [];
  const scheduledPosts = data?.scheduledPosts || [];
  const drafts = data?.drafts || [];
  const analytics = data?.analytics || {
    totalPublished: 0,
    officialCount: 0,
    peerCount: 0,
    officialPercentage: 0,
    peerPercentage: 0,
    impressionStatus: "Telemetry tracking pending",
    complianceStatus: "AAU Editorial & Content Authorization Guidelines Enforced"
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200 font-sf-pro tracking-[-0.01em]">
      {/* ========================================================================= */}
      {/* SECTION 1: PAGE HEADER & SUMMARY STAT METRICS */}
      {/* ========================================================================= */}
      <section className="space-y-5">
        {/* Breadcrumb & Action Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            {/* Eyebrow Pill */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-100/60 shadow-2xs">
              <Radio className="w-3.5 h-3.5 text-blue-600" />
              <span>Feed Control Desk</span>
            </div>

            {/* Title */}
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900 mt-2">
              Content Management &amp; Home Feed Curation
            </h1>

            {/* Description */}
            <p className="text-xs sm:text-sm text-slate-500 max-w-3xl mt-1 leading-relaxed">
              Control official university broadcasts, approve authorized submissions, and manage pinned items on the student Home feed.
            </p>
          </div>

          {/* Header Actions (Right-aligned cluster) */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Button 1: Create Official Announcement */}
            <button
              onClick={() => {
                setEditingPostId(null);
                setComposerTitle("");
                setComposerBody("");
                const composerElement = document.getElementById("official-composer-card");
                if (composerElement) {
                  composerElement.scrollIntoView({ behavior: "smooth" });
                }
                onShowToast("Focused on Official Content Composer");
              }}
              className="bg-slate-900 text-white px-5 py-2.5 rounded-full font-semibold text-xs sm:text-sm hover:bg-slate-800 transition flex items-center gap-2 shadow-sm cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Create Official Announcement</span>
            </button>

            {/* Button 2: Preview Student Feed */}
            <button
              onClick={() => setIsPreviewOpen(true)}
              className="border border-slate-300 bg-white text-slate-700 px-4 py-2 rounded-full font-medium text-xs sm:text-sm hover:bg-slate-50 transition flex items-center gap-2 shadow-2xs cursor-pointer active:scale-95"
            >
              <Eye className="w-4 h-4 text-slate-600" />
              <span>Preview Student Feed</span>
            </button>

            {/* Button 3: Algorithm */}
            <button
              onClick={() => setIsAlgorithmOpen(true)}
              className="border border-slate-200 bg-slate-50 text-slate-700 px-3.5 py-2 rounded-full font-medium text-xs sm:text-sm hover:bg-slate-100 transition flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Sliders className="w-4 h-4 text-slate-500" />
              <span>Algorithm</span>
            </button>

            {/* Button 4: Refresh */}
            <button
              onClick={() => loadData(true)}
              disabled={isRefreshing}
              title="Refresh Live Data"
              className="w-9 h-9 rounded-full border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center text-slate-600 transition cursor-pointer shadow-2xs disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin text-blue-600" : ""}`} />
            </button>
          </div>
        </div>

        {/* Quick Stat Tiles (4-Column Grid) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: ACTIVE ON FEED */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 flex items-center justify-between shadow-2xs hover:shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300">
            <div>
              <div className="text-[11px] font-semibold tracking-wider uppercase text-slate-400">
                ACTIVE ON FEED
              </div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-semibold tracking-tight text-slate-900">
                  {data?.activeOnFeedCount ?? 0}
                </span>
                <span className="text-xs font-semibold text-slate-500">items live</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-2xs">
              <Wifi className="w-5 h-5" />
            </div>
          </div>

          {/* Card 2: PENDING REVIEW */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 flex items-center justify-between shadow-2xs hover:shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300">
            <div>
              <div className="text-[11px] font-semibold tracking-wider uppercase text-slate-400">
                PENDING REVIEW
              </div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-semibold tracking-tight text-slate-900">
                  {data?.pendingReviewCount ?? 0}
                </span>
                <span className="text-xs font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200/50">
                  {data?.pendingReviewCount ?? 0} Submissions
                </span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shadow-2xs">
              <Inbox className="w-5 h-5" />
            </div>
          </div>

          {/* Card 3: PINNED NOTICES */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 flex items-center justify-between shadow-2xs hover:shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300">
            <div>
              <div className="text-[11px] font-semibold tracking-wider uppercase text-slate-400">
                PINNED NOTICES
              </div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-semibold tracking-tight text-slate-900">
                  {data?.pinnedNoticesCount ?? 0}
                </span>
                <span className="text-xs font-semibold text-slate-500">Hero placement</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center shadow-2xs">
              <Pin className="w-5 h-5" />
            </div>
          </div>

          {/* Card 4: SCHEDULED BROADCASTS */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 flex items-center justify-between shadow-2xs hover:shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300">
            <div>
              <div className="text-[11px] font-semibold tracking-wider uppercase text-slate-400">
                SCHEDULED BROADCASTS
              </div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-semibold tracking-tight text-slate-900">
                  {data?.scheduledBroadcastsCount ?? 0}
                </span>
                <span className="text-xs font-semibold text-slate-500">Auto-publish</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shadow-2xs">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* MAIN SPLIT WORKSPACE (~62% Left Column, ~38% Right Column) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ========================================================================= */}
        {/* SECTION 2: LEFT COLUMN (Feed Placement Shelf & Review Queue) - 7 Cols */}
        {/* ========================================================================= */}
        <div className="lg:col-span-7 space-y-6">
          {/* --------------------------------------------------------------------- */}
          {/* Part A: Live Feed Placement Shelf */}
          {/* --------------------------------------------------------------------- */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
            {/* Shelf Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <h2 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900">
                    Live Feed Placement Shelf
                  </h2>
                  <span className="bg-emerald-100 text-emerald-800 text-xs font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                    <span>Live DB Feed</span>
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Top-of-feed order currently presented across AAU Mobile and Web clients.
                </p>
              </div>

              {/* Shelf Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsReorderingNoticeOpen(!isReorderingNoticeOpen)}
                  className="px-3 py-1.5 rounded-full text-xs font-semibold border transition flex items-center gap-1.5 cursor-pointer bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>Placement Rules</span>
                </button>
                <button
                  onClick={() => loadData(true)}
                  disabled={isRefreshing}
                  title="Refresh Placement"
                  className="w-8 h-8 rounded-full border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center text-slate-600 transition cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
                </button>
              </div>
            </div>

            {/* Informational Placement Banner if open */}
            {isReorderingNoticeOpen && (
              <div className="p-3.5 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-900 flex items-start gap-2.5 animate-in fade-in">
                <Sliders className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold">Deterministic Feed Placement Order</p>
                  <p className="text-[11px] text-blue-700 leading-relaxed">
                    Student Home feed orders posts strictly by <strong>Pinned status</strong> first (Hero announcements), followed by <strong>Publication timestamp</strong> (newest to oldest). Use the &ldquo;Pin / Unpin&rdquo; button on any item to promote it to Slot #1.
                  </p>
                </div>
              </div>
            )}

            {/* Shelf Cards (Ordered Slot Items) */}
            {feedSlots.length === 0 ? (
              <div className="py-12 text-center space-y-3 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                <Megaphone className="w-10 h-10 text-slate-400 mx-auto" />
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-slate-800">No live items on feed yet</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Publish an official announcement below or approve pending student submissions to populate the student Home feed.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {feedSlots.map((slot) => {
                  const isHeroPinned = slot.pinned;

                  return (
                    <div
                      key={slot.id}
                      className={`rounded-xl p-4 border transition-all ${
                        isHeroPinned
                          ? "border-slate-300 bg-gradient-to-r from-slate-50/70 to-white shadow-xs"
                          : "border-slate-200 bg-white hover:border-slate-300 shadow-2xs"
                      } flex items-start gap-3.5`}
                    >
                      {/* Left Indicator Icon Container */}
                      <div className="shrink-0 mt-0.5">
                        {isHeroPinned ? (
                          <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-xs">
                            <Pin className="w-4 h-4 fill-white" />
                          </div>
                        ) : slot.slotType === "OPPORTUNITY" ? (
                          <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 border border-amber-200/60 flex items-center justify-center">
                            <Sparkles className="w-4 h-4" />
                          </div>
                        ) : slot.slotType === "EVENT" ? (
                          <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 border border-purple-200/60 flex items-center justify-center">
                            <Calendar className="w-4 h-4" />
                          </div>
                        ) : slot.slotType === "OFFICIAL_CLUB" ? (
                          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200/60 flex items-center justify-center">
                            <Users className="w-4 h-4" />
                          </div>
                        ) : (
                          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 border border-blue-200/60 flex items-center justify-center">
                            <Megaphone className="w-4 h-4" />
                          </div>
                        )}
                      </div>

                      {/* Slot Main Content */}
                      <div className="flex-1 min-w-0">
                        {/* Header Line */}
                        <div className="flex flex-wrap items-center gap-2 mb-1.5">
                          {isHeroPinned ? (
                            <span className="inline-block px-2.5 py-0.5 rounded-full bg-slate-900 text-white text-[11px] font-bold uppercase tracking-wider">
                              SLOT #{slot.slotNumber} · HERO PINNED
                            </span>
                          ) : (
                            <span className="inline-block px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-bold">
                              Slot #{slot.slotNumber} · {slot.category}
                            </span>
                          )}

                          <span className="text-xs font-semibold text-slate-700">
                            {slot.source}
                          </span>

                          <span className="text-xs text-slate-400">
                            • {slot.timeAgo}
                          </span>
                        </div>

                        {/* Title */}
                        <h3 className="text-sm font-bold text-slate-900 leading-snug">
                          {slot.title}
                        </h3>

                        {/* Snippet */}
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                          {slot.snippet}
                        </p>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-col sm:flex-row items-center gap-1.5 shrink-0 self-center sm:self-start">
                        <button
                          onClick={() => handleTogglePin(slot.id, slot.pinned)}
                          className={`px-3 py-1 rounded-full text-xs font-medium border transition cursor-pointer ${
                            slot.pinned
                              ? "bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-300"
                              : "bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200/60"
                          }`}
                        >
                          {slot.pinned ? "Unpin" : "Pin Hero"}
                        </button>
                        <button
                          onClick={() => loadIntoComposer(slot)}
                          className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white transition cursor-pointer flex items-center gap-1"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => handleArchivePost(slot.id, slot.title)}
                          className="p-1.5 rounded-full text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                          title="Archive Post"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* --------------------------------------------------------------------- */}
          {/* Part B: Content Review Queue */}
          {/* --------------------------------------------------------------------- */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
            {/* Queue Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <h2 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900">
                    Content Review Queue
                  </h2>
                  <span className="bg-rose-100 text-rose-700 text-xs font-bold px-2.5 py-0.5 rounded-full">
                    {reviewQueue.length} Action Items
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Screen submissions from registered official entities, clubs, and student representatives.
                </p>
              </div>

              {/* Filter Segmented Control: [All] [Official Depts] [Clubs] [Students] */}
              <div className="inline-flex p-1 rounded-xl bg-slate-100 border border-slate-200/80 text-xs font-semibold">
                <button
                  onClick={() => setActiveQueueFilter("ALL")}
                  className={`px-3 py-1 rounded-lg transition ${
                    activeQueueFilter === "ALL"
                      ? "bg-white text-slate-900 shadow-2xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  All ({reviewQueue.length})
                </button>
                <button
                  onClick={() => setActiveQueueFilter("OFFICIAL")}
                  className={`px-3 py-1 rounded-lg transition ${
                    activeQueueFilter === "OFFICIAL"
                      ? "bg-white text-slate-900 shadow-2xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Official
                </button>
                <button
                  onClick={() => setActiveQueueFilter("CLUBS")}
                  className={`px-3 py-1 rounded-lg transition ${
                    activeQueueFilter === "CLUBS"
                      ? "bg-white text-slate-900 shadow-2xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Clubs
                </button>
                <button
                  onClick={() => setActiveQueueFilter("STUDENTS")}
                  className={`px-3 py-1 rounded-lg transition ${
                    activeQueueFilter === "STUDENTS"
                      ? "bg-white text-slate-900 shadow-2xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Students
                </button>
              </div>
            </div>

            {/* Queue Item Cards */}
            {filteredQueue.length === 0 ? (
              <div className="py-12 text-center space-y-2 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                <h4 className="text-sm font-bold text-slate-800">All submissions cleared!</h4>
                <p className="text-xs text-slate-500">No action items pending in this category.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredQueue.map((item) => {
                  return (
                    <div
                      key={item.id}
                      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs hover:border-slate-300 transition space-y-3.5"
                    >
                      {/* Top Header Line with Category Icons & Meta Chips */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                        <div className="flex items-center gap-3">
                          {/* Leading Category Container Icon */}
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                              item.category === "ANNOUNCEMENT"
                                ? "bg-[#1E293B] text-white"
                                : item.category === "EVENT"
                                ? "bg-blue-600 text-white"
                                : item.category === "STUDENT_POST"
                                ? "bg-emerald-600 text-white"
                                : "bg-purple-600 text-white"
                            }`}
                          >
                            {item.category === "ANNOUNCEMENT" ? (
                              <Building className="w-4 h-4" />
                            ) : item.category === "EVENT" ? (
                              <MessageSquare className="w-4 h-4" />
                            ) : item.category === "STUDENT_POST" ? (
                              <GraduationCap className="w-4 h-4" />
                            ) : (
                              <FlaskConical className="w-4 h-4" />
                            )}
                          </div>

                          {/* Chips Cluster */}
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-xs font-bold text-slate-500">
                              {item.itemNumber}
                            </span>
                            <span className="text-slate-300">•</span>
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                              {item.categoryLabel}
                            </span>
                            <span className="text-slate-300">•</span>
                            <span className="text-xs font-bold text-slate-800">
                              {item.authorName}
                            </span>
                            <span
                              className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                                item.badgeType === "authorized"
                                  ? "bg-blue-50 text-blue-700 border border-blue-200/60"
                                  : item.badgeType === "club"
                                  ? "bg-purple-50 text-purple-700 border border-purple-200/60"
                                  : item.badgeType === "verified"
                                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200/60"
                                  : "bg-amber-50 text-amber-800 border border-amber-200/60"
                              }`}
                            >
                              {item.authorBadge}
                            </span>
                          </div>
                        </div>

                        {/* Action Buttons for this Review Item */}
                        <div className="flex items-center gap-2 self-end sm:self-auto">
                          <button
                            disabled={isSubmittingReview}
                            onClick={() => handleApproveAndPin(item)}
                            className="px-3.5 py-1.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1 shadow-2xs transition cursor-pointer disabled:opacity-50"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Approve & Pin</span>
                          </button>
                          <button
                            disabled={isSubmittingReview}
                            onClick={() => handleApproveForFeed(item)}
                            className="px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 text-xs font-semibold transition cursor-pointer disabled:opacity-50"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => loadIntoComposer({ id: item.id, title: item.title, snippet: item.description })}
                            className="px-2.5 py-1.5 rounded-full border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-medium transition cursor-pointer"
                          >
                            Edit Copy
                          </button>
                          <button
                            disabled={isSubmittingReview}
                            onClick={() => {
                              setRejectionModalItem(item);
                              setRejectionReason("");
                            }}
                            className="w-7 h-7 rounded-full border border-slate-200 hover:bg-rose-50 hover:text-rose-600 flex items-center justify-center text-slate-400 transition cursor-pointer"
                            title="Reject Submission"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Title */}
                      <h3 className="text-base font-bold text-slate-900">
                        {item.title}
                      </h3>

                      {/* Description / Content Body */}
                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed italic bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                        &ldquo;{item.description}&rdquo;
                      </p>

                      {/* Logistics Tags */}
                      <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-slate-500 font-medium">
                        {item.targetCampus && (
                          <div className="flex items-center gap-1.5 bg-slate-100/80 px-2.5 py-1 rounded-lg">
                            <MapPin className="w-3.5 h-3.5 text-slate-500" />
                            <span>Campus: {item.targetCampus}</span>
                          </div>
                        )}
                        {item.department && (
                          <div className="flex items-center gap-1.5 bg-slate-100/80 px-2.5 py-1 rounded-lg">
                            <GraduationCap className="w-3.5 h-3.5 text-slate-500" />
                            <span>{item.department}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1.5 bg-slate-100/80 px-2.5 py-1 rounded-lg">
                          <Clock className="w-3.5 h-3.5 text-slate-500" />
                          <span>Submitted: {item.createdAt}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 3: RIGHT COLUMN (Official Composer & Feed Analytics) - 5 Cols */}
        {/* ========================================================================= */}
        <div className="lg:col-span-5 space-y-6">
          {/* --------------------------------------------------------------------- */}
          {/* Part A: Official Content Composer Card */}
          {/* --------------------------------------------------------------------- */}
          <div
            id="official-composer-card"
            className="bg-white rounded-2xl border border-slate-200/80 p-6 space-y-4 shadow-sm"
          >
            {/* Card Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-xs">
                  <Megaphone className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Official Content Composer</h2>
                  <p className="text-[11px] text-slate-400">Institutional announcement publisher</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                {editingPostId && (
                  <span className="bg-amber-50 text-amber-800 px-2.5 py-0.5 rounded-full text-xs font-semibold border border-amber-200">
                    Editing Post
                  </span>
                )}
                {drafts.length > 0 && !editingPostId && (
                  <span className="bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full text-xs font-semibold border border-slate-200/50">
                    {drafts.length} Saved Drafts
                  </span>
                )}
              </div>
            </div>

            {/* Quick Draft Loader if drafts exist */}
            {drafts.length > 0 && (
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700 truncate max-w-[200px]">
                  Draft: &ldquo;{drafts[0].title}&rdquo;
                </span>
                <button
                  type="button"
                  onClick={() => loadIntoComposer({ id: drafts[0].id, title: drafts[0].title, body: drafts[0].body })}
                  className="text-blue-600 font-bold hover:underline"
                >
                  Resume Draft
                </button>
              </div>
            )}

            {/* Form Field 0: Content Category Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase text-slate-600 tracking-wider">
                Post Category
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => setComposerContentType("ANNOUNCEMENT")}
                  className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition text-center cursor-pointer flex items-center justify-center gap-1.5 ${
                    composerContentType === "ANNOUNCEMENT"
                      ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                      : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  <Megaphone className="w-3.5 h-3.5" />
                  <span>Announcement</span>
                </button>

                <button
                  type="button"
                  onClick={() => setComposerContentType("EVENT")}
                  className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition text-center cursor-pointer flex items-center justify-center gap-1.5 ${
                    composerContentType === "EVENT"
                      ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                      : "bg-emerald-50/60 text-emerald-800 border-emerald-200/70 hover:bg-emerald-100/80"
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Upcoming Event</span>
                </button>

                <button
                  type="button"
                  onClick={() => setComposerContentType("OPPORTUNITY")}
                  className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition text-center cursor-pointer flex items-center justify-center gap-1.5 ${
                    composerContentType === "OPPORTUNITY"
                      ? "bg-amber-600 text-white border-amber-600 shadow-xs"
                      : "bg-amber-50/60 text-amber-800 border-amber-200/70 hover:bg-amber-100/80"
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Opportunity</span>
                </button>

                <button
                  type="button"
                  onClick={() => setComposerContentType("CLUB_POST")}
                  className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition text-center cursor-pointer flex items-center justify-center gap-1.5 ${
                    composerContentType === "CLUB_POST"
                      ? "bg-purple-600 text-white border-purple-600 shadow-xs"
                      : "bg-purple-50/60 text-purple-800 border-purple-200/70 hover:bg-purple-100/80"
                  }`}
                >
                  <Building className="w-3.5 h-3.5" />
                  <span>Club Activity</span>
                </button>
              </div>
            </div>

            {/* Form Field 1: Announcement Title */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase text-slate-600 tracking-wider">
                {composerContentType === "EVENT" ? "Event Title" : composerContentType === "OPPORTUNITY" ? "Opportunity Title" : "Announcement Title"}
              </label>

              <input
                type="text"
                value={composerTitle}
                onChange={(e) => setComposerTitle(e.target.value)}
                placeholder="e.g. Undergraduate Semester 1 Final Exam Timetable Released"
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-slate-900 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
              />
            </div>

            {/* Form Field 2: 2-Column Grid (Publishing Entity & Target Audience) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase text-slate-600 tracking-wider">
                  Publishing Entity
                </label>
                <div className="relative">
                  <select
                    value={publishingEntity}
                    onChange={(e) => setPublishingEntity(e.target.value)}
                    className="w-full appearance-none px-3.5 py-2.5 text-xs font-semibold text-slate-800 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition pr-8 cursor-pointer"
                  >
                    <option value="Computer Science Dept">Computer Science Dept</option>
                    <option value="AAU Registrar Office">AAU Registrar Office</option>
                    <option value="AAiT Dean Office">AAiT Dean Office</option>
                    <option value="Dean of Student Affairs">Dean of Student Affairs</option>
                    <option value="CNCS Academic Commission">CNCS Academic Commission</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase text-slate-600 tracking-wider">
                  Target Audience
                </label>
                <div className="relative">
                  <select
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value)}
                    className="w-full appearance-none px-3.5 py-2.5 text-xs font-semibold text-slate-800 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition pr-8 cursor-pointer"
                  >
                    <option value="All Campuses (AAU)">All Campuses (AAU)</option>
                    <option value="4 Kilo Campus Only">4 Kilo Campus Only</option>
                    <option value="AAiT (5 Kilo) Only">AAiT (5 Kilo) Only</option>
                    <option value="Sidist Kilo (Main) Only">Sidist Kilo (Main) Only</option>
                    <option value="Tikur Anbessa (Health Sciences)">Tikur Anbessa (Health Sciences)</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Form Field 3: Priority Level (3-Segment Button Toggle) */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase text-slate-600 tracking-wider">
                Priority Level
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPriorityLevel("NORMAL")}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition text-center cursor-pointer ${
                    priorityLevel === "NORMAL"
                      ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                      : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  Normal
                </button>

                <button
                  type="button"
                  onClick={() => setPriorityLevel("IMPORTANT")}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition text-center cursor-pointer ${
                    priorityLevel === "IMPORTANT"
                      ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                      : "bg-blue-50/60 text-blue-700 border-blue-200/70 hover:bg-blue-100/80"
                  }`}
                >
                  Important
                </button>

                <button
                  type="button"
                  onClick={() => setPriorityLevel("CAMPUS_ALERT")}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition text-center cursor-pointer ${
                    priorityLevel === "CAMPUS_ALERT"
                      ? "bg-rose-600 text-white border-rose-600 shadow-xs"
                      : "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100"
                  }`}
                >
                  Campus Alert
                </button>
              </div>
            </div>

            {/* Form Field 4: Announcement Body */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase text-slate-600 tracking-wider">
                Announcement Body
              </label>
              <textarea
                rows={4}
                value={composerBody}
                onChange={(e) => setComposerBody(e.target.value)}
                placeholder="Compose full institutional text with instructions, dates, locations..."
                className="w-full px-3.5 py-2.5 text-xs text-slate-800 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition leading-relaxed resize-none"
              />
            </div>

            {/* Form Field 5: Attached Media / Banner Preview */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase text-slate-600 tracking-wider">
                Attached Media / Banner
              </label>
              {hasAttachedMedia ? (
                <div className="relative rounded-xl border border-slate-200 overflow-hidden group bg-slate-100">
                  <div className="h-32 w-full relative">
                    <Image
                      src="/images/ethiopian_students_campus.png"
                      alt="AAU Quad Banner"
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    <div className="absolute bottom-2 left-3 text-white text-[11px] font-semibold flex items-center gap-1.5">
                      <Bookmark className="w-3.5 h-3.5" />
                      <span>AAU Quad Notice Board Thumbnail</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setHasAttachedMedia(false);
                      onShowToast("Banner removed");
                    }}
                    className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/70 hover:bg-black text-white flex items-center justify-center transition cursor-pointer"
                    title="Remove Banner"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setHasAttachedMedia(true);
                    onShowToast("Attached verified campus banner");
                  }}
                  className="w-full py-3 border-2 border-dashed border-slate-200 hover:border-slate-300 rounded-xl bg-slate-50/50 hover:bg-slate-50 flex items-center justify-center gap-2 text-xs font-semibold text-slate-600 transition cursor-pointer"
                >
                  <Plus className="w-4 h-4 text-slate-400" />
                  <span>Attach Campus Notice Image</span>
                </button>
              )}
            </div>

            {/* Form Field 6: Pin to Top Toggle */}
            <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center shrink-0">
                  <Pin className="w-4 h-4 fill-white" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Pin to Top of Student Feed</h4>
                  <p className="text-[11px] text-slate-500">Places announcement into Slot #1</p>
                </div>
              </div>

              {/* Toggle Switch */}
              <button
                type="button"
                onClick={() => setPinToTop(!pinToTop)}
                className={`w-11 h-6 flex items-center rounded-full p-1 transition duration-200 cursor-pointer ${
                  pinToTop ? "bg-slate-900 justify-end" : "bg-slate-300 justify-start"
                }`}
              >
                <div className="bg-white w-4 h-4 rounded-full shadow-md transform transition-transform" />
              </button>
            </div>

            {/* Form Field 7: Scheduling Options */}
            {isScheduling && (
              <div className="p-3.5 bg-amber-50/60 border border-amber-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
                    <Calendar className="w-4 h-4 text-amber-700" />
                    <span>Future Publication Date & Time</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsScheduling(false);
                      setScheduledDateTime("");
                    }}
                    className="text-xs text-amber-700 hover:underline"
                  >
                    Cancel Scheduling
                  </button>
                </div>
                <input
                  type="datetime-local"
                  value={scheduledDateTime}
                  onChange={(e) => setScheduledDateTime(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold text-slate-800 rounded-lg border border-amber-300 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                />
                <p className="text-[11px] text-amber-800">
                  Scheduled posts remain unpublished in the database and automatically publish to students when this time arrives.
                </p>
              </div>
            )}

            {/* Form Field 8: Footer Action Bar (3-Button Layout) */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                disabled={isSubmittingComposer}
                onClick={handleSaveDraft}
                className="px-4 py-2 rounded-full text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer disabled:opacity-50"
              >
                Save as Draft
              </button>

              <div className="flex items-center gap-2">
                {!isScheduling ? (
                  <button
                    type="button"
                    onClick={() => setIsScheduling(true)}
                    className="px-4 py-2 rounded-full border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                  >
                    Schedule
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={isSubmittingComposer || !scheduledDateTime}
                    onClick={handleSchedulePost}
                    className="px-4 py-2 rounded-full bg-amber-600 text-white font-bold text-xs hover:bg-amber-700 transition cursor-pointer disabled:opacity-50"
                  >
                    Confirm Schedule
                  </button>
                )}

                <button
                  type="button"
                  disabled={isSubmittingComposer}
                  onClick={handlePublishComposer}
                  className="bg-slate-900 text-white font-bold text-xs px-6 py-2.5 rounded-full hover:bg-slate-800 transition shadow-sm cursor-pointer active:scale-95 flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isSubmittingComposer ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  <span>{editingPostId ? "Update & Publish" : "Publish Broadcast"}</span>
                </button>
              </div>
            </div>
          </div>

          {/* --------------------------------------------------------------------- */}
          {/* Part B: Feed Health & Engagement Widget */}
          {/* --------------------------------------------------------------------- */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 space-y-4 shadow-sm">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Activity className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  Feed Health & Engagement
                </h3>
              </div>
              <button
                onClick={() => onShowToast("Feed balance recalculated from active posts")}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>

            {/* Metric 1: Student Impression Ratio */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs font-medium text-slate-500">
                <span>Student Impression Tracking</span>
                <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                  Pipeline Inactive
                </span>
              </div>
              {/* Neutral Telemetry Bar */}
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-slate-300 h-full rounded-full w-full opacity-40" />
              </div>
              <p className="text-[11px] text-slate-400">
                Impression telemetry events are not yet streamed by student web clients.
              </p>
            </div>

            {/* Metric 2: Official vs. Peer Content Balance Bar */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-600">
                  Official vs. Peer Content Balance
                </span>
                <span className="text-xs font-bold text-slate-900">
                  {analytics.totalPublished > 0
                    ? `${analytics.officialPercentage}% Official / ${analytics.peerPercentage}% Peer`
                    : "No published posts yet"}
                </span>
              </div>

              {/* Dual Progress Bar */}
              <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden flex">
                <div
                  className="bg-slate-900 h-full transition-all duration-500"
                  style={{ width: `${analytics.totalPublished > 0 ? analytics.officialPercentage : 50}%` }}
                  title={`${analytics.officialPercentage}% Official Institutional Content`}
                />
                <div
                  className="bg-blue-300 h-full transition-all duration-500"
                  style={{ width: `${analytics.totalPublished > 0 ? analytics.peerPercentage : 50}%` }}
                  title={`${analytics.peerPercentage}% Peer & Student Club Posts`}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5 font-medium">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-slate-900" />
                  <span>{analytics.officialCount} Official Broadcasts</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-300" />
                  <span>{analytics.peerCount} Student & Club Posts</span>
                </div>
              </div>
            </div>

            {/* Policy Compliance Callout */}
            <div className="bg-blue-50/70 border border-blue-100 rounded-xl p-3.5 flex items-start gap-2.5 text-xs text-blue-950">
              <ShieldCheck className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
              <p className="leading-relaxed font-medium">
                AAU Editorial & Content Review Policy: Official department announcements require administrative authorization. All submissions and status mutations are logged with full audit tracking.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: PREVIEW STUDENT FEED (Powered by Real Database Records) */}
      {/* ========================================================================= */}
      {isPreviewOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center">
                  <Eye className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Student Live Feed Preview</h3>
                  <p className="text-xs text-slate-400">Rendering actual database feed records</p>
                </div>
              </div>
              <button
                onClick={() => setIsPreviewOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Mobile View Container */}
            <div className="flex-1 overflow-y-auto space-y-3 bg-[#F7F9FC] p-4 rounded-2xl border border-slate-200/80">
              {/* Draft Composer Preview if title exists */}
              {composerTitle.trim() && (
                <div className="bg-white rounded-xl border-2 border-dashed border-blue-300 p-4 shadow-xs relative overflow-hidden">
                  <div className="absolute top-0 right-0 left-0 h-1 bg-blue-600" />
                  <div className="flex items-center gap-2 text-[11px] font-bold text-blue-700 mb-1">
                    <span className="px-2 py-0.5 rounded-full bg-blue-50 border border-blue-200">
                      CURRENT DRAFT
                    </span>
                    <span>{publishingEntity}</span>
                    <span>• Preview</span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">{composerTitle}</h4>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">{composerBody}</p>
                </div>
              )}

              {/* Feed Slots Rendered from real database */}
              {feedSlots.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  No published records in feed yet.
                </div>
              ) : (
                feedSlots.map((slot) => (
                  <div key={slot.id} className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-1.5">
                        {slot.pinned && (
                          <span className="bg-slate-900 text-white px-2 py-0.5 rounded-md font-bold text-[10px]">
                            PINNED
                          </span>
                        )}
                        <span className="font-bold text-slate-800">{slot.source}</span>
                      </div>
                      <span className="text-slate-400">{slot.timeAgo}</span>
                    </div>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900">{slot.title}</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">{slot.snippet}</p>
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setIsPreviewOpen(false)}
                className="px-5 py-2 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: ALGORITHM INFORMATION */}
      {/* ========================================================================= */}
      {isAlgorithmOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center">
                  <Sliders className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Feed Placement Architecture</h3>
                  <p className="text-xs text-slate-400">Current Uni-Chat Home feed distribution rule</p>
                </div>
              </div>
              <button
                onClick={() => setIsAlgorithmOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                <h4 className="font-bold text-slate-900 text-sm">Deterministic Priority Ordering</h4>
                <p>
                  The Uni-Chat feed applies a transparent two-tier sorting strategy on the student Home feed:
                </p>
                <ul className="list-disc list-inside space-y-1 text-slate-700 font-medium pt-1">
                  <li><strong>Tier 1 — Hero Pinned:</strong> Posts marked with <code className="bg-slate-200 px-1 py-0.5 rounded text-[11px]">isPinned: true</code> hold top priority across all views.</li>
                  <li><strong>Tier 2 — Chronological Recency:</strong> Unpinned posts are sorted strictly by <code className="bg-slate-200 px-1 py-0.5 rounded text-[11px]">publishedAt: desc</code>.</li>
                  <li><strong>Automatic Scheduling:</strong> Scheduled broadcasts automatically transition to published as soon as their scheduled timestamp arrives.</li>
                </ul>
              </div>

              <p className="text-slate-500 italic">
                Advanced machine-learning ranking and personalized engagement weights are scheduled for future terms once client telemetry ingestion is active.
              </p>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                onClick={() => setIsAlgorithmOpen(false)}
                className="px-5 py-2 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold cursor-pointer"
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: REJECTION REASON PROMPT */}
      {/* ========================================================================= */}
      {rejectionModalItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                  <X className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Reject Submission</h3>
                  <p className="text-xs text-slate-400">{rejectionModalItem.title}</p>
                </div>
              </div>
              <button
                onClick={() => setRejectionModalItem(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700">Rejection Reason</label>
              <textarea
                rows={3}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Explain why this content was rejected. The submitter will receive this feedback..."
                className="w-full p-3 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 resize-none"
              />
              <div className="flex flex-wrap gap-1.5 pt-1">
                {[
                  "Incomplete event information",
                  "Does not adhere to community guidelines",
                  "Duplicate announcement",
                  "Unauthorized official representation"
                ].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setRejectionReason(preset)}
                    className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setRejectionModalItem(null)}
                className="px-4 py-2 rounded-full border border-slate-200 text-slate-600 text-xs font-medium hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmittingReview}
                onClick={handleConfirmRejection}
                className="px-5 py-2 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                {isSubmittingReview ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                <span>Confirm Rejection</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
