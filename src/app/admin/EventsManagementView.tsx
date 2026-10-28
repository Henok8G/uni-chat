"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Calendar,
  Sparkles,
  Plus,
  RefreshCw,
  Search,
  Check,
  X,
  ExternalLink,
  MapPin,
  Clock,
  Users,
  Edit3,
  Trash2,
  Eye,
  Star,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  Globe,
  Image as ImageIcon,
  Tag,
  ArrowRight,
} from "lucide-react";
import {
  getAdminEventsData,
  createAdminEvent,
  updateAdminEvent,
  toggleEventFeatured,
  toggleEventPublish,
  deleteEvent,
  AdminEventRecord,
  EventManagementDashboardData,
  EventInput,
} from "./eventActions";
import {
  EVENT_CATEGORIES,
  EventCategory,
  getCategoryStyle,
  formatEventDateTime,
} from "@/lib/eventConstants";

interface EventsManagementViewProps {
  onBackToOverview?: () => void;
  onShowToast: (message: string) => void;
}

export function EventsManagementView({
  onBackToOverview,
  onShowToast,
}: EventsManagementViewProps) {
  const [data, setData] = useState<EventManagementDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PUBLISHED" | "DRAFT" | "FEATURED">("ALL");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");

  // Form Modal State (Create / Edit)
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<AdminEventRecord | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form Fields
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formCategory, setFormCategory] = useState<EventCategory>("Academic / Seminar");
  const [formStartDate, setFormStartDate] = useState("");
  const [formEndDate, setFormEndDate] = useState("");
  const [formLocation, setFormLocation] = useState("");
  const [formOrganizer, setFormOrganizer] = useState("");
  const [formRegistrationUrl, setFormRegistrationUrl] = useState("");
  const [formImageUrl, setFormImageUrl] = useState("");
  const [formIsFeatured, setFormIsFeatured] = useState(false);
  const [formStatus, setFormStatus] = useState<"DRAFT" | "PUBLISHED">("PUBLISHED");

  // Live Preview Toggle inside Form
  const [showLivePreview, setShowLivePreview] = useState(true);

  // Delete Confirmation Modal
  const [deletingEventId, setDeletingEventId] = useState<string | null>(null);

  const loadData = useCallback(
    async (quiet = false) => {
      if (!quiet) setIsLoading(true);
      else setIsRefreshing(true);
      setError(null);

      try {
        const result = await getAdminEventsData();
        setData(result);
      } catch (err: any) {
        console.error("Failed to load events data:", err);
        setError(err?.message || "Failed to load events data");
        onShowToast(err?.message || "Failed to load events");
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [onShowToast]
  );

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Open Form for Creating New Event
  const handleOpenCreate = () => {
    setEditingEvent(null);
    setFormTitle("");
    setFormDescription("");
    setFormCategory("Academic / Seminar");

    // Default start date: tomorrow at 10:00 AM
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);
    const tzOffset = tomorrow.getTimezoneOffset() * 60000;
    const localStart = new Date(tomorrow.getTime() - tzOffset).toISOString().slice(0, 16);
    setFormStartDate(localStart);

    // Default end date: tomorrow at 12:00 PM
    const tomorrowEnd = new Date(tomorrow.getTime() + 2 * 3600000);
    const localEnd = new Date(tomorrowEnd.getTime() - tzOffset).toISOString().slice(0, 16);
    setFormEndDate(localEnd);

    setFormLocation("AAU Main Campus, Sidist Kilo");
    setFormOrganizer("AAU Student Council");
    setFormRegistrationUrl("");
    setFormImageUrl("");
    setFormIsFeatured(false);
    setFormStatus("PUBLISHED");
    setFormError(null);
    setIsFormOpen(true);
  };

  // Open Form for Editing Existing Event
  const handleOpenEdit = (event: AdminEventRecord) => {
    setEditingEvent(event);
    setFormTitle(event.title);
    setFormDescription(event.body);
    setFormCategory(
      (EVENT_CATEGORIES.includes(event.eventCategory as any)
        ? event.eventCategory
        : "Other") as EventCategory
    );

    if (event.startDate) {
      const d = new Date(event.startDate);
      const tzOffset = d.getTimezoneOffset() * 60000;
      setFormStartDate(new Date(d.getTime() - tzOffset).toISOString().slice(0, 16));
    } else {
      setFormStartDate("");
    }

    if (event.endDate) {
      const d = new Date(event.endDate);
      const tzOffset = d.getTimezoneOffset() * 60000;
      setFormEndDate(new Date(d.getTime() - tzOffset).toISOString().slice(0, 16));
    } else {
      setFormEndDate("");
    }

    setFormLocation(event.location || "");
    setFormOrganizer(event.organizer || "");
    setFormRegistrationUrl(event.registrationUrl || "");
    setFormImageUrl(event.imageUrl || "");
    setFormIsFeatured(Boolean(event.isFeatured));
    setFormStatus(event.status === "DRAFT" ? "DRAFT" : "PUBLISHED");
    setFormError(null);
    setIsFormOpen(true);
  };

  // Submit Event Form (Create or Update)
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formTitle.trim()) {
      setFormError("Event title is required.");
      return;
    }
    if (!formDescription.trim()) {
      setFormError("Event description is required.");
      return;
    }
    if (!formStartDate) {
      setFormError("Start date and time are required.");
      return;
    }
    if (!formLocation.trim()) {
      setFormError("Event location is required.");
      return;
    }
    if (!formOrganizer.trim()) {
      setFormError("Event organizer is required.");
      return;
    }

    if (formRegistrationUrl.trim()) {
      try {
        const url = new URL(formRegistrationUrl.trim());
        if (url.protocol !== "http:" && url.protocol !== "https:") {
          setFormError("Registration link must start with http:// or https://");
          return;
        }
      } catch {
        setFormError("Please enter a valid registration URL (e.g. https://forms.gle/...)");
        return;
      }
    }

    try {
      setIsSubmitting(true);
      const payload: EventInput = {
        title: formTitle.trim(),
        description: formDescription.trim(),
        category: formCategory,
        startDate: new Date(formStartDate).toISOString(),
        endDate: formEndDate ? new Date(formEndDate).toISOString() : null,
        location: formLocation.trim(),
        organizer: formOrganizer.trim(),
        registrationUrl: formRegistrationUrl.trim() || null,
        imageUrl: formImageUrl.trim() || null,
        isFeatured: formIsFeatured,
        status: formStatus,
      };

      if (editingEvent) {
        await updateAdminEvent(editingEvent.id, payload);
        onShowToast(`Event "${payload.title}" updated successfully!`);
      } else {
        await createAdminEvent(payload);
        onShowToast(
          payload.status === "PUBLISHED"
            ? `Event "${payload.title}" created & published to student feed!`
            : `Event draft "${payload.title}" saved successfully!`
        );
      }

      setIsFormOpen(false);
      await loadData(true);
    } catch (err: any) {
      setFormError(err?.message || "Failed to save event");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick Toggle Featured
  const handleToggleFeatured = async (event: AdminEventRecord) => {
    const nextState = !event.isFeatured;
    try {
      await toggleEventFeatured(event.id, nextState);
      onShowToast(
        nextState
          ? `Marked "${event.title}" as Featured Event!`
          : `Removed Featured badge from "${event.title}".`
      );
      await loadData(true);
    } catch (err: any) {
      onShowToast(err?.message || "Failed to update featured status");
    }
  };

  // Quick Toggle Published / Draft
  const handleTogglePublish = async (event: AdminEventRecord) => {
    const nextStatus = event.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED";
    try {
      await toggleEventPublish(event.id, nextStatus);
      onShowToast(
        nextStatus === "PUBLISHED"
          ? `Published "${event.title}" to Campus Feed!`
          : `Unpublished "${event.title}" (moved to drafts).`
      );
      await loadData(true);
    } catch (err: any) {
      onShowToast(err?.message || "Failed to update publication status");
    }
  };

  // Confirm and Execute Delete
  const handleDeleteEvent = async (eventId: string) => {
    try {
      await deleteEvent(eventId);
      onShowToast("Event archived and removed from public feed.");
      setDeletingEventId(null);
      await loadData(true);
    } catch (err: any) {
      onShowToast(err?.message || "Failed to delete event");
    }
  };

  // Filtered Events
  const filteredEvents = useMemo(() => {
    return (data?.events || []).filter((event) => {
      if (statusFilter === "PUBLISHED" && event.status !== "PUBLISHED") return false;
      if (statusFilter === "DRAFT" && event.status !== "DRAFT") return false;
      if (statusFilter === "FEATURED" && !event.isFeatured) return false;
      if (categoryFilter !== "ALL" && event.eventCategory !== categoryFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = event.title.toLowerCase().includes(q);
        const matchDesc = event.body.toLowerCase().includes(q);
        const matchOrg = (event.organizer || "").toLowerCase().includes(q);
        const matchLoc = (event.location || "").toLowerCase().includes(q);
        const matchCat = event.eventCategory.toLowerCase().includes(q);
        if (!matchTitle && !matchDesc && !matchOrg && !matchLoc && !matchCat) return false;
      }

      return true;
    });
  }, [data?.events, statusFilter, categoryFilter, searchQuery]);

  return (
    <div className="space-y-6 font-sf-pro">
      {/* ── HEADER BAR ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Event Management
            </h1>
            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/40">
              Campus Calendar &amp; Feed
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Create, publish, feature, and manage campus events across AAU campuses.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => loadData(true)}
            disabled={isRefreshing}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition cursor-pointer"
            title="Refresh events"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
          </button>

          <button
            type="button"
            onClick={handleOpenCreate}
            className="px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100 font-semibold text-xs transition shadow-sm flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Event</span>
          </button>
        </div>
      </div>

      {/* ── STATS CARDS ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 sm:gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
            <span>Total Events</span>
            <Calendar className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
            {data?.stats.total ?? 0}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Database records</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
            <span>Published</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">
            {data?.stats.published ?? 0}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Live on Student Feed</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
            <span>Featured Events</span>
            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-2">
            {data?.stats.featured ?? 0}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Top spotlight status</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
            <span>Drafts</span>
            <Edit3 className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-700 dark:text-slate-300 mt-2">
            {data?.stats.drafts ?? 0}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Hidden from student feed</p>
        </div>
      </div>

      {/* ── SEARCH & FILTER CONTROLS ── */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {[
              { id: "ALL", label: `All (${data?.events.length ?? 0})` },
              { id: "PUBLISHED", label: `Published (${data?.stats.published ?? 0})` },
              { id: "FEATURED", label: `Featured (${data?.stats.featured ?? 0})` },
              { id: "DRAFT", label: `Drafts (${data?.stats.drafts ?? 0})` },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id as any)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                  statusFilter === tab.id
                    ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                    : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64 shrink-0">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            />
          </div>
        </div>

        {/* Category Filter Chips */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center gap-1.5 overflow-x-auto no-scrollbar text-xs">
          <span className="text-[11px] font-semibold text-slate-400 shrink-0 mr-1">
            Category:
          </span>
          <button
            type="button"
            onClick={() => setCategoryFilter("ALL")}
            className={`px-2.5 py-1 rounded-full whitespace-nowrap font-medium transition cursor-pointer ${
              categoryFilter === "ALL"
                ? "bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            All Categories
          </button>
          {EVENT_CATEGORIES.map((cat) => {
            const style = getCategoryStyle(cat);
            const isSelected = categoryFilter === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoryFilter(cat)}
                className={`px-2.5 py-1 rounded-full whitespace-nowrap border font-medium transition cursor-pointer ${
                  isSelected ? style.badgeClasses : "border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400"
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── EVENTS LIST ── */}
      {isLoading ? (
        <div className="p-12 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
          <RefreshCw className="w-6 h-6 text-slate-400 animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-500">Loading campus events...</p>
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
          <Calendar className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-60" />
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            No events match your criteria
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Try adjusting your search query or category filters, or create a new event.
          </p>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="mt-4 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition"
          >
            + Create New Event
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Desktop Table View (>= md) */}
          <div className="hidden md:block overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
            <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50/70 dark:bg-slate-800/50 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3">Event</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Date &amp; Time</th>
                  <th className="px-4 py-3">Location &amp; Host</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredEvents.map((event) => {
                  const catStyle = getCategoryStyle(event.eventCategory);
                  const dateTime = formatEventDateTime(event.startDate, event.endDate);

                  return (
                    <tr
                      key={event.id}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Event Title & Featured badge */}
                      <td className="px-4 py-3.5 max-w-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-900 dark:text-white line-clamp-1">
                            {event.title}
                          </span>
                          {event.isFeatured && (
                            <span className="shrink-0 inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60">
                              <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                              <span>Featured</span>
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                          {event.body}
                        </p>
                      </td>

                      {/* Category Badge */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${catStyle.badgeClasses}`}
                        >
                          {event.eventCategory}
                        </span>
                      </td>

                      {/* Date & Time */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="font-medium text-slate-800 dark:text-slate-200">
                          {dateTime.dateStr}
                        </div>
                        <div className="text-[11px] text-slate-400">{dateTime.timeStr}</div>
                      </td>

                      {/* Location & Organizer */}
                      <td className="px-4 py-3.5 max-w-[200px]">
                        <div className="font-medium text-slate-800 dark:text-slate-200 truncate flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
                          <span className="truncate">{event.location || "TBA"}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 truncate mt-0.5">
                          {event.organizer}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            event.status === "PUBLISHED"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60"
                              : "bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              event.status === "PUBLISHED" ? "bg-emerald-500" : "bg-slate-400"
                            }`}
                          />
                          {event.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Featured Toggle Button */}
                          <button
                            type="button"
                            onClick={() => handleToggleFeatured(event)}
                            className={`p-1.5 rounded-lg border transition cursor-pointer ${
                              event.isFeatured
                                ? "bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-950/40 dark:border-amber-800"
                                : "text-slate-400 hover:text-amber-600 border-slate-200 dark:border-slate-700"
                            }`}
                            title={event.isFeatured ? "Unfeature event" : "Feature event"}
                          >
                            <Star
                              className={`w-3.5 h-3.5 ${event.isFeatured ? "fill-amber-500" : ""}`}
                            />
                          </button>

                          {/* Publish/Draft Toggle */}
                          <button
                            type="button"
                            onClick={() => handleTogglePublish(event)}
                            className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-[11px] font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                          >
                            {event.status === "PUBLISHED" ? "Unpublish" : "Publish"}
                          </button>

                          {/* Edit Button */}
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(event)}
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                            title="Edit event"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete Button */}
                          <button
                            type="button"
                            onClick={() => setDeletingEventId(event.id)}
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-rose-600 hover:border-rose-200 transition cursor-pointer"
                            title="Delete / Archive event"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Stacked Cards (< md) */}
          <div className="md:hidden space-y-3">
            {filteredEvents.map((event) => {
              const catStyle = getCategoryStyle(event.eventCategory);
              const dateTime = formatEventDateTime(event.startDate, event.endDate);

              return (
                <div
                  key={event.id}
                  className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${catStyle.badgeClasses}`}
                        >
                          {event.eventCategory}
                        </span>
                        {event.isFeatured && (
                          <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60">
                            <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                            <span>Featured</span>
                          </span>
                        )}
                      </div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                        {event.title}
                      </h3>
                    </div>

                    <span
                      className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        event.status === "PUBLISHED"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300"
                          : "bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-400"
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          event.status === "PUBLISHED" ? "bg-emerald-500" : "bg-slate-400"
                        }`}
                      />
                      {event.status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                    {event.body}
                  </p>

                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                      <span>{dateTime.dateStr} · {dateTime.timeStr}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                      <span className="truncate">{event.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                      <span className="truncate">Host: {event.organizer}</span>
                    </div>
                  </div>

                  {/* Mobile Action Buttons */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleToggleFeatured(event)}
                        className={`px-2.5 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-1 transition ${
                          event.isFeatured
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : "text-slate-500 border-slate-200 dark:border-slate-700"
                        }`}
                      >
                        <Star className={`w-3.5 h-3.5 ${event.isFeatured ? "fill-amber-500" : ""}`} />
                        <span>{event.isFeatured ? "Featured" : "Feature"}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleTogglePublish(event)}
                        className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        {event.status === "PUBLISHED" ? "Unpublish" : "Publish"}
                      </button>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(event)}
                        className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingEventId(event.id)}
                        className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-rose-600 hover:border-rose-200"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── CREATE / EDIT EVENT FORM MODAL ── */}
      {isFormOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="event-form-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
        >
          <div className="relative w-full max-w-3xl rounded-[28px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-6">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-5 sm:px-6 py-4 bg-slate-50/50 dark:bg-slate-800/40">
              <div>
                <h2 id="event-form-title" className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  {editingEvent ? "Edit Campus Event" : "Create Campus Event"}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Publishing official university events to the student feed and upcoming calendar.
                </p>
              </div>
              <button
                type="button"
                aria-label="Close dialog"
                onClick={() => setIsFormOpen(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="p-5 sm:p-6 space-y-5 max-h-[75vh] overflow-y-auto">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/60 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Title & Category Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Event Title <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="e.g. AAU Annual Tech & Innovation Expo 2026"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Category / Type <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as EventCategory)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 cursor-pointer"
                  >
                    {EVENT_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Event Description <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Provide concise details: agenda, participating departments, student eligibility, awards..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                />
              </div>

              {/* Start Date & End Date Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-blue-500" />
                    <span>Start Date &amp; Time</span> <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={formStartDate}
                    onChange={(e) => setFormStartDate(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>End Date &amp; Time (Optional)</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={formEndDate}
                    onChange={(e) => setFormEndDate(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  />
                </div>
              </div>

              {/* Location & Organizer Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-rose-500" />
                    <span>Campus Location</span> <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                    placeholder="e.g. Grand Hall, Sidist Kilo Main Campus"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-purple-500" />
                    <span>Organizer / Host</span> <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formOrganizer}
                    onChange={(e) => setFormOrganizer(e.target.value)}
                    placeholder="e.g. 5 Kilo Tech Hub / Faculty of Technology"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  />
                </div>
              </div>

              {/* Optional Registration Link & Cover Image URL */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Registration Link (Optional)</span>
                  </label>
                  <input
                    type="url"
                    value={formRegistrationUrl}
                    onChange={(e) => setFormRegistrationUrl(e.target.value)}
                    placeholder="https://forms.gle/xyz or university portal URL"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  />
                  <p className="text-[10px] text-slate-400">
                    If provided, a &quot;Register&quot; button will link directly to this URL.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-slate-400" />
                    <span>Cover Image URL (Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={formImageUrl}
                    onChange={(e) => setFormImageUrl(e.target.value)}
                    placeholder="/images/aau_ai_lab.webp or https://..."
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  />
                </div>
              </div>

              {/* Toggles: Featured & Publication Status */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                {/* Featured Toggle */}
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={formIsFeatured}
                    onClick={() => setFormIsFeatured(!formIsFeatured)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                      formIsFeatured ? "bg-amber-500" : "bg-slate-300 dark:bg-slate-700"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                        formIsFeatured ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                  <div>
                    <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                      <span>Featured Event</span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Spotlight this event with a prominent Featured badge on student cards.
                    </p>
                  </div>
                </div>

                {/* Status Toggle */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Publication Status:
                  </span>
                  <div className="flex items-center p-0.5 rounded-lg bg-slate-200/70 dark:bg-slate-700">
                    <button
                      type="button"
                      onClick={() => setFormStatus("DRAFT")}
                      className={`px-3 py-1 rounded-md text-xs font-semibold transition cursor-pointer ${
                        formStatus === "DRAFT"
                          ? "bg-white dark:bg-slate-900 text-slate-800 dark:text-white shadow-xs"
                          : "text-slate-500 hover:text-slate-800 dark:text-slate-300"
                      }`}
                    >
                      Draft
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormStatus("PUBLISHED")}
                      className={`px-3 py-1 rounded-md text-xs font-semibold transition cursor-pointer ${
                        formStatus === "PUBLISHED"
                          ? "bg-emerald-600 text-white shadow-xs"
                          : "text-slate-500 hover:text-slate-800 dark:text-slate-300"
                      }`}
                    >
                      Published
                    </button>
                  </div>
                </div>
              </div>

              {/* ── LIVE PREVIEW BEFORE PUBLISHING ── */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setShowLivePreview(!showLivePreview)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer mb-2"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>{showLivePreview ? "Hide Live Card Preview" : "Show Live Card Preview"}</span>
                </button>

                {showLivePreview && (
                  <div className="p-4 rounded-2xl bg-slate-100/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60">
                    <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                      Live Student Feed Preview
                    </div>
                    <div className="max-w-md mx-auto p-4 rounded-[24px] bg-white dark:bg-zinc-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 font-sf-pro">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                              getCategoryStyle(formCategory).badgeClasses
                            }`}
                          >
                            {formCategory}
                          </span>
                          {formIsFeatured && (
                            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300">
                              <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                              <span>Featured</span>
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/70 text-bold">
                          EVENT
                        </span>
                      </div>

                      <h4 className="text-sm font-semibold text-slate-900 dark:text-white leading-snug">
                        {formTitle || "Event Title Preview"}
                      </h4>

                      <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
                        {formDescription || "Event description will be rendered here for student discovery."}
                      </p>

                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-[11px] text-slate-600 dark:text-slate-300 space-y-1">
                        <div>
                          <strong>Date:</strong>{" "}
                          {formStartDate ? new Date(formStartDate).toLocaleDateString() : "TBA"}
                        </div>
                        <div>
                          <strong>Location:</strong> {formLocation || "AAU Main Campus"}
                        </div>
                        <div>
                          <strong>Host:</strong> {formOrganizer || "AAU Host"}
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <span className="px-3 py-1 rounded-full bg-blue-600 text-white text-[11px] font-semibold">
                          {formRegistrationUrl ? "Register Online" : "View Event Pass"}
                        </span>
                        <span className="text-[11px] text-slate-400">Add to Calendar</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Form Actions Footer */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isSubmitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingEvent ? "Save Changes" : "Save & Publish Event"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── DELETE CONFIRMATION MODAL ── */}
      {deletingEventId && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
        >
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-5 h-5" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Archive this campus event?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                This event will be unpublished and hidden from the student Home feed and Upcoming Events list.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingEventId(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeleteEvent(deletingEventId)}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs"
              >
                Yes, Archive Event
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

