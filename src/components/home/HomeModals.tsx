"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  CheckCircle2, 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  Send, 
  Paperclip, 
  ExternalLink,
  Sparkles,
  Award,
  AlertCircle,
  Star,
  CalendarPlus
} from "lucide-react";
import { getCategoryStyle, formatEventDateTime } from "@/lib/eventConstants";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function OpportunityModal({ isOpen, onClose }: ModalProps) {
  const [submitted, setSubmitted] = useState(false);
  const [statement, setStatement] = useState("");

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div 
        role="dialog"
        aria-modal="true"
        aria-labelledby="opportunity-modal-title"
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm font-sf-pro"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-2xl overflow-hidden rounded-[28px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl font-sf-pro"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-6 py-4 bg-slate-50/50 dark:bg-slate-800/40">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200/70 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/40">
                <Sparkles className="w-3.5 h-3.5" /> OPPORTUNITY
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">AAU Innovation Office</span>
            </div>
            <button
              type="button"
              aria-label="Close opportunity modal"
              onClick={onClose}
              className="rounded-full p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-amber-500"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="max-h-[80vh] overflow-y-auto p-6 space-y-6">
            <div>
              <h3 id="opportunity-modal-title" className="text-xl font-bold text-slate-900 dark:text-white">
                Summer Undergraduate Research Fellowship 2025
              </h3>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                8-Week Paid Research Immersion at AAiT Artificial Intelligence & Robotics Division
              </p>
            </div>

            {/* Highlights */}
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-3 text-center">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Stipend</span>
                <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">Fully Funded</p>
              </div>
              <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-3 text-center">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Deadline</span>
                <p className="text-sm font-bold text-amber-600 dark:text-amber-400">Oct 15, 2025</p>
              </div>
              <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-3 text-center">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Location</span>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">AAiT Campus</p>
              </div>
            </div>

            {/* Fellowship Details */}
            <div className="space-y-2 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              <h4 className="font-semibold text-slate-900 dark:text-white">Program Overview</h4>
              <p>
                Selected fellows will be paired 1-on-1 with distinguished AAU faculty advisors and Ph.D. researchers. You will contribute to active publications in deep learning, embedded autonomous systems, natural language processing for low-resource languages (Amharic & Afaan Oromo), and biomedical signal processing.
              </p>
              <h4 className="font-semibold text-slate-900 dark:text-white pt-2">Eligibility</h4>
              <ul className="list-disc pl-5 space-y-1 text-slate-600 dark:text-slate-400">
                <li>Enrolled as a 3rd or 4th-year student at any AAU campus (AAiT, CNS, FBE, CHS, etc.)</li>
                <li>Cumulative GPA of 3.2 or above</li>
                <li>Foundational programming background (Python, C++, or equivalent)</li>
              </ul>
            </div>

            {submitted ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-2xl border border-emerald-200 bg-emerald-50/80 dark:bg-emerald-950/30 dark:border-emerald-800/50 p-5 text-center"
              >
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/60 dark:text-emerald-300 mb-2">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="text-base font-semibold text-emerald-900 dark:text-emerald-200">
                  Application Submitted Successfully!
                </h4>
                <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-1">
                  Your university profile and academic statement have been routed to the AAU Innovation Review Board. You will receive an email update within 5 business days.
                </p>
                <button
                  onClick={onClose}
                  className="mt-4 px-5 py-2 rounded-full bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition"
                >
                  Done
                </button>
              </motion.div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setSubmitted(true);
                }}
                className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800"
              >
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Brief Statement of Research Interest (2–3 sentences)
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={statement}
                    onChange={(e) => setStatement(e.target.value)}
                    placeholder="Tell us what research questions or technical areas excite you..."
                    className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 px-3.5 py-2.5 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />
                    Verified AAU Student profile will be attached
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2 rounded-full border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-full bg-[#4A7BB0] hover:bg-[#3D6B9C] text-white text-xs font-semibold shadow-sm transition"
                    >
                      Submit Application →
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export interface EventModalData {
  id?: string;
  title: string;
  body?: string;
  date?: string;
  time?: string;
  location?: string;
  organizer?: string;
  eventCategory?: string | null;
  isFeatured?: boolean;
  registrationUrl?: string | null;
  startDate?: any;
  endDate?: any;
}

interface EventRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  event?: EventModalData | null;
}

export function EventRegistrationModal({ isOpen, onClose, event }: EventRegistrationModalProps) {
  const [registered, setRegistered] = useState(false);
  const [calendarSaved, setCalendarSaved] = useState(false);

  if (!isOpen) return null;

  const title = event?.title || "AAU Annual Tech & Innovation Expo 2026";
  const description = event?.body || "Showcasing regional tech companies, student capstones, and industry workshops across AAU campuses.";
  
  const formattedDates = formatEventDateTime(event?.startDate, event?.endDate);
  const dateStr = event?.date || formattedDates.dateStr;
  const timeStr = event?.time || formattedDates.timeStr;
  const locationStr = event?.location || "Grand Hall, AAU Main Campus";
  const organizerStr = event?.organizer || "Student Council & Events Board";
  const catStyle = getCategoryStyle(event?.eventCategory);

  const handleDownloadCalendar = () => {
    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//AAU Uni-Chat//Event//EN
BEGIN:VEVENT
SUMMARY:${title}
DESCRIPTION:${description}
LOCATION:${locationStr}
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR`;

    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
    const link = document.createElement("a");
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute("download", `${title.replace(/\s+/g, "_")}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setCalendarSaved(true);
    setTimeout(() => setCalendarSaved(false), 3000);
  };

  return (
    <AnimatePresence>
      <div 
        role="dialog"
        aria-modal="true"
        aria-labelledby="event-modal-title"
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm font-sf-pro"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-xl overflow-hidden rounded-[28px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl font-sf-pro"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-6 py-4 bg-slate-50/50 dark:bg-slate-800/40">
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${catStyle.badgeClasses}`}>
                {event?.eventCategory || "Campus Event"}
              </span>
              {event?.isFeatured && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60">
                  <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                  <span>Featured Event</span>
                </span>
              )}
            </div>
            <button
              type="button"
              aria-label="Close event modal"
              onClick={onClose}
              className="rounded-full p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            <div>
              <h3 id="event-modal-title" className="text-xl font-bold text-slate-900 dark:text-white">
                {title}
              </h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {description}
              </p>
            </div>

            {/* Spec grid */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60">
                <Calendar className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-slate-800 dark:text-slate-200">{dateStr}</div>
                  <div className="text-slate-500">Scheduled Date</div>
                </div>
              </div>
              <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60">
                <Clock className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-slate-800 dark:text-slate-200">{timeStr}</div>
                  <div className="text-slate-500">Doors open 30m prior</div>
                </div>
              </div>
              <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60">
                <MapPin className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-slate-800 dark:text-slate-200">{locationStr}</div>
                  <div className="text-slate-500">AAU Campus Network</div>
                </div>
              </div>
              <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60">
                <Users className="w-4 h-4 text-purple-500 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-slate-800 dark:text-slate-200">{organizerStr}</div>
                  <div className="text-slate-500">Official Host</div>
                </div>
              </div>
            </div>

            {registered ? (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 dark:bg-emerald-950/30 dark:border-emerald-800/50 p-5 text-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400 mx-auto mb-2" />
                <h4 className="text-base font-semibold text-emerald-900 dark:text-emerald-200">
                  Registration Confirmed!
                </h4>
                <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-1">
                  Digital Pass has been added to your Uni-Chat session. Present your verified student ID at {locationStr}.
                </p>
                <button
                  onClick={onClose}
                  className="mt-4 px-5 py-2 rounded-full bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 cursor-pointer"
                >
                  Close Pass
                </button>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleDownloadCalendar}
                    className="px-3.5 py-2 rounded-full border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <CalendarPlus className="w-3.5 h-3.5 text-blue-500" />
                    <span>{calendarSaved ? "Saved to Calendar!" : "Add to Calendar (.ics)"}</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={onClose}
                    className="flex-1 sm:flex-none px-4 py-2 rounded-full border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    Cancel
                  </button>

                  {event?.registrationUrl ? (
                    <a
                      href={event.registrationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 sm:flex-none px-5 py-2 rounded-full bg-[#4A7BB0] hover:bg-[#3D6B9C] text-white text-xs font-semibold shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span>Register Online</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  ) : (
                    <button
                      onClick={() => setRegistered(true)}
                      className="flex-1 sm:flex-none px-5 py-2 rounded-full bg-[#4A7BB0] hover:bg-[#3D6B9C] text-white text-xs font-semibold shadow-sm transition cursor-pointer"
                    >
                      Confirm Free Pass
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

interface CommentModalProps extends ModalProps {
  postTitle: string;
  initialComments: Array<{ author: string; badge: string; time: string; text: string }>;
}

export function CommentModal({ isOpen, onClose, postTitle, initialComments }: CommentModalProps) {
  const [comments, setComments] = useState(initialComments);
  const [text, setText] = useState("");

  if (!isOpen) return null;

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    setComments([
      ...comments,
      {
        author: "You",
        badge: "Verified Student",
        time: "Just now",
        text: text.trim(),
      },
    ]);
    setText("");
  };

  return (
    <AnimatePresence>
      <div 
        role="dialog"
        aria-modal="true"
        aria-labelledby="comment-modal-title"
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm font-sf-pro"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-xl overflow-hidden rounded-[28px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl flex flex-col max-h-[85vh] font-sf-pro"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-6 py-4 bg-slate-50/50 dark:bg-slate-800/40">
            <div>
              <h3 id="comment-modal-title" className="text-sm font-semibold text-slate-900 dark:text-white">Discussion</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">{postTitle}</p>
            </div>
            <button
              type="button"
              aria-label="Close discussion dialog"
              onClick={onClose}
              className="rounded-full p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Comments list */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {comments.map((c, i) => (
              <div key={i} className="flex items-start gap-3 text-xs">
                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-bold flex items-center justify-center shrink-0">
                  {c.author.charAt(0)}
                </div>
                <div className="flex-1 rounded-2xl bg-slate-50 dark:bg-slate-800/60 p-3.5 border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{c.author}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-200/70 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                        {c.badge}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400">{c.time}</span>
                  </div>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{c.text}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Input */}
          <form
            onSubmit={handleAddComment}
            className="border-t border-slate-100 dark:border-slate-800 p-4 bg-slate-50/50 dark:bg-slate-800/40 flex items-center gap-2"
          >
            <input
              type="text"
              aria-label="Write a constructive student comment"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Write a constructive student comment..."
              className="flex-1 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            />
            <button
              type="submit"
              aria-label="Submit comment"
              disabled={!text.trim()}
              className="p-2.5 rounded-full bg-[#4A7BB0] hover:bg-[#3D6B9C] disabled:opacity-50 text-white transition cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
