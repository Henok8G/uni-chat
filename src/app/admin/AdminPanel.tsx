"use client";

import { useState, useEffect } from "react";
import { getUserByEmail, updateUserPlan, toggleUserBan, getPendingReports, resolveReport, getAnalyticsSummary } from "./actions";
import { Plan, ReportStatus, ReasonCategory } from "@prisma/client";

// Helper types
type AdminUserView = {
  id: string;
  email: string;
  emailVerified: boolean;
  gender: string;
  plan: Plan;
  planExpiresAt: Date | null;
  banned: boolean;
  university: { name: string; domain: string } | null;
  deviceLogs?: {
    id: string;
    ipAddress: string;
    userAgent: string;
    createdAt: Date;
  }[];
};

type ReportView = {
  id: string;
  reasonCategory: string;
  details: string | null;
  createdAt: Date;
  reporter: { email: string; university: { name: string } | null };
  reportedUser: { id: string; email: string; plan: string; banned: boolean; _count: { reportsReceived: number } };
  chatSession: { startedAt: Date; endedAt: Date | null; endedReason: string | null } | null;
};

export function AdminPanel() {
  const [activeTab, setActiveTab] = useState<"SEARCH" | "REPORTS" | "ANALYTICS">("SEARCH");
  const [emailQuery, setEmailQuery] = useState("");
  const [user, setUser] = useState<AdminUserView | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Moderation state
  const [reports, setReports] = useState<ReportView[]>([]);
  const [isLoadingReports, setIsLoadingReports] = useState(false);
  const [resolvingReportId, setResolvingReportId] = useState<string | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState<{ [key: string]: string }>({});

  // Analytics state
  const [analyticsData, setAnalyticsData] = useState<{type: string, count: number}[]>([]);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);

  // Form states for edits
  const [editPlan, setEditPlan] = useState<Plan>(Plan.FREE);
  const getDefaultDatetime = () => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  };
  const [editExpiryDate, setEditExpiryDate] = useState<string>(getDefaultDatetime());

  // Load reports on mount/tab change
  useEffect(() => {
    if (activeTab === "REPORTS") {
      fetchReports();
    } else if (activeTab === "ANALYTICS") {
      fetchAnalytics();
    }
  }, [activeTab]);

  async function fetchReports() {
    setIsLoadingReports(true);
    try {
      const data = await getPendingReports();
      setReports(data as unknown as ReportView[]);
    } catch (err: any) {
      alert("Failed to fetch reports: " + err.message);
    } finally {
      setIsLoadingReports(false);
    }
  }

  async function fetchAnalytics() {
    setIsLoadingAnalytics(true);
    try {
      const data = await getAnalyticsSummary();
      setAnalyticsData(data);
    } catch (err: any) {
      alert("Failed to fetch analytics: " + err.message);
    } finally {
      setIsLoadingAnalytics(false);
    }
  }

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!emailQuery) return;
    
    setIsLoading(true);
    setError("");
    setUser(null);
    
    try {
      const result = await getUserByEmail(emailQuery.trim());
      if (result) {
        setUser(result as AdminUserView);
        setEditPlan(result.plan);
      } else {
        setError("User not found");
      }
    } catch (err: any) {
      setError(err.message || "Failed to fetch user");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleUpdatePlan() {
    if (!user) return;
    setIsLoading(true);
    try {
      let expiresAt: Date | null = null;
      if (editPlan !== Plan.FREE && editExpiryDate) {
        expiresAt = new Date(editExpiryDate);
      }

      const updated = await updateUserPlan(user.id, editPlan, expiresAt);
      setUser(updated as AdminUserView);
      alert("Plan updated successfully!");
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleToggleBan() {
    if (!user) return;
    setIsLoading(true);
    try {
      const updated = await toggleUserBan(user.id, !user.banned);
      setUser(updated as AdminUserView);
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleResolveReport(reportId: string, action: "DISMISS" | "WARN" | "BAN") {
    setResolvingReportId(reportId);
    try {
      const notes = resolutionNotes[reportId] || "Resolved via standard action.";
      await resolveReport(reportId, action, notes);
      alert(`Report marked as ${action} successfully.`);
      // Refresh list
      setReports((prev) => prev.filter(r => r.id !== reportId));
    } catch (err: any) {
      alert("Failed to resolve report: " + err.message);
    } finally {
      setResolvingReportId(null);
    }
  }

  const formatDate = (date: Date | null | string) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-8">
      {/* Tabs */}
      <div className="flex border-b border-zinc-200 dark:border-zinc-800">
        <button
          onClick={() => setActiveTab("SEARCH")}
          className={`py-3 px-6 text-sm font-medium ${
            activeTab === "SEARCH" 
              ? "border-b-2 border-accent text-accent" 
              : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
          }`}
        >
          User Search
        </button>
        <button
          onClick={() => setActiveTab("REPORTS")}
          className={`py-3 px-6 text-sm font-medium flex items-center gap-2 ${
            activeTab === "REPORTS" 
              ? "border-b-2 border-accent text-accent" 
              : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
          }`}
        >
          Moderation Queue
        </button>
        <button
          onClick={() => setActiveTab("ANALYTICS")}
          className={`py-3 px-6 text-sm font-medium flex items-center gap-2 ${
            activeTab === "ANALYTICS" 
              ? "border-b-2 border-accent text-accent" 
              : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
          }`}
        >
          Analytics
        </button>
      </div>

      {/* User Search Tab */}
      {activeTab === "SEARCH" && (
        <div className="space-y-6">
          <form onSubmit={handleSearch} className="flex gap-3">
            <input
              type="email"
              placeholder="Search user by email..."
              value={emailQuery}
              onChange={(e) => setEmailQuery(e.target.value)}
              className="flex-1 rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm text-zinc-900 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              required
            />
            <button
              type="submit"
              disabled={isLoading}
              className="rounded-lg bg-zinc-900 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              {isLoading ? "Searching..." : "Search"}
            </button>
          </form>

          {error && <div className="text-sm font-medium text-red-600">{error}</div>}

          {user && (
            <div className="rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
              <div className="border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                  User Details
                </h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-medium text-zinc-500">Email</p>
                    <p className="text-sm text-zinc-900 dark:text-zinc-100">{user.email}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-zinc-500">Verified</p>
                    <p className={`text-sm font-medium ${user.emailVerified ? "text-emerald-600" : "text-amber-600"}`}>
                      {user.emailVerified ? "Yes" : "No"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-zinc-500">University</p>
                    <p className="text-sm text-zinc-900 dark:text-zinc-100">{user.university?.name || "None"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-zinc-500">Gender</p>
                    <p className="text-sm text-zinc-900 dark:text-zinc-100">{user.gender}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-zinc-500">Ban Status</p>
                    <p className={`text-sm font-medium ${user.banned ? "text-red-600" : "text-emerald-600"}`}>
                      {user.banned ? "Banned" : "Active"}
                    </p>
                    <button
                      onClick={handleToggleBan}
                      disabled={isLoading}
                      className="mt-2 text-xs font-medium text-blue-600 hover:underline dark:text-blue-400"
                    >
                      {user.banned ? "Unban User" : "Ban User"}
                    </button>
                  </div>
                </div>

                <div className="space-y-5 rounded-lg border border-zinc-200 bg-zinc-50 p-5 dark:border-zinc-800 dark:bg-zinc-900/50">
                  <h3 className="font-medium text-zinc-900 dark:text-zinc-100">Plan Management</h3>
                  
                  <div>
                    <p className="text-xs font-medium text-zinc-500 mb-1">Current Plan</p>
                    <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{user.plan}</p>
                    <p className="text-xs text-zinc-500 mt-1">
                      Expires: {formatDate(user.planExpiresAt)}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-zinc-200 dark:border-zinc-700">
                    <label className="mb-1 block text-xs font-medium text-zinc-500">
                      Update Plan To:
                    </label>
                    <select
                      value={editPlan}
                      onChange={(e) => setEditPlan(e.target.value as Plan)}
                      className="w-full rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-800"
                    >
                      <option value={Plan.FREE}>FREE</option>
                      <option value={Plan.STANDARD}>STANDARD</option>
                      <option value={Plan.PRO}>PRO</option>
                    </select>
                  </div>

                  {editPlan !== Plan.FREE && (
                    <div>
                      <label className="mb-1 block text-xs font-medium text-zinc-500">
                        Expiry Date and Time:
                      </label>
                      <input
                        type="datetime-local"
                        value={editExpiryDate}
                        onChange={(e) => setEditExpiryDate(e.target.value)}
                        className="w-full rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-800"
                      />
                    </div>
                  )}

                  <button
                    onClick={handleUpdatePlan}
                    disabled={isLoading}
                    className="w-full rounded-md bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:opacity-90 disabled:opacity-50"
                  >
                    Save Plan Changes
                  </button>
                </div>
              </div>

              {/* Recent Logins Section */}
              <div className="border-t border-zinc-200 px-6 py-6 dark:border-zinc-800">
                 <div className="mb-4 flex items-center justify-between">
                   <h3 className="text-base font-medium text-zinc-900 dark:text-zinc-100">Recent Logins (Last 5)</h3>
                   {user.deviceLogs && user.deviceLogs.length > 0 && (
                     <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                       Check for Abuse Flags in Terminal
                     </span>
                   )}
                 </div>
                 <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                   {user.deviceLogs && user.deviceLogs.length > 0 ? (
                     user.deviceLogs.map((log) => (
                       <div key={log.id} className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-xs dark:border-zinc-800 dark:bg-zinc-900/50">
                         <div className="flex justify-between font-medium text-zinc-900 dark:text-zinc-100 mb-1">
                           <span>IP: {log.ipAddress}</span>
                           <span>{new Date(log.createdAt).toLocaleString()}</span>
                         </div>
                         <p className="text-zinc-500 dark:text-zinc-400 break-all">{log.userAgent}</p>
                       </div>
                     ))
                   ) : (
                     <p className="text-sm text-zinc-500">No recent logins found.</p>
                   )}
                 </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Moderation Queue Tab */}
      {activeTab === "REPORTS" && (
        <div className="space-y-6">
          {isLoadingReports ? (
            <p className="text-sm text-zinc-500">Loading reports...</p>
          ) : reports.length === 0 ? (
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-8 text-center dark:border-zinc-800 dark:bg-zinc-900/50">
              <span className="text-2xl mb-2 block">🎉</span>
              <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">Clean Queue</h3>
              <p className="mt-1 text-sm text-zinc-500">There are no pending reports to review.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reports.map((report) => (
                <div key={report.id} className="rounded-xl border border-red-200 bg-white p-6 shadow-sm dark:border-red-900/30 dark:bg-zinc-950">
                  <div className="flex justify-between items-start mb-4 border-b border-zinc-100 pb-4 dark:border-zinc-800">
                    <div>
                      <span className="inline-block rounded-md bg-red-100 px-2 py-1 text-xs font-bold text-red-800 dark:bg-red-900/50 dark:text-red-200 mb-2">
                        {report.reasonCategory}
                      </span>
                      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                        Reported User: <span className="text-red-600 dark:text-red-400">{report.reportedUser.email}</span>
                      </p>
                      <p className="text-xs text-zinc-500 mt-1">
                        Reported By: {report.reporter.email} ({report.reporter.university?.name || "No Uni"})
                      </p>
                    </div>
                    <div className="text-right text-xs text-zinc-500">
                      <p>{new Date(report.createdAt).toLocaleString()}</p>
                      <p className="mt-1 font-semibold">Total Reports against user: {report.reportedUser._count.reportsReceived}</p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="text-xs font-semibold text-zinc-500 mb-1">Reporter Details / Comments:</p>
                    <p className="text-sm text-zinc-800 dark:text-zinc-300 italic border-l-2 border-zinc-300 pl-3">
                      "{report.details || "No additional comments provided."}"
                    </p>
                  </div>

                  <div className="mb-4 text-xs text-zinc-500 bg-zinc-50 dark:bg-zinc-900 p-3 rounded-lg border border-zinc-100 dark:border-zinc-800">
                    <span className="font-semibold text-zinc-700 dark:text-zinc-300">Session Context: </span>
                    {report.chatSession ? (
                      <>Started at {new Date(report.chatSession.startedAt).toLocaleTimeString()} - Ended Reason: {report.chatSession.endedReason || "Still open"}</>
                    ) : (
                      "No session attached"
                    )}
                  </div>

                  <div className="flex flex-col gap-3 mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                    <input 
                      type="text" 
                      placeholder="Admin resolution notes (optional)" 
                      value={resolutionNotes[report.id] || ""}
                      onChange={(e) => setResolutionNotes(prev => ({ ...prev, [report.id]: e.target.value }))}
                      className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                    />
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => handleResolveReport(report.id, "DISMISS")}
                        disabled={resolvingReportId === report.id}
                        className="rounded-md bg-zinc-200 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-300 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                      >
                        Dismiss False Alarm
                      </button>
                      <button
                        onClick={() => handleResolveReport(report.id, "WARN")}
                        disabled={resolvingReportId === report.id}
                        className="rounded-md bg-amber-100 px-3 py-1.5 text-sm font-medium text-amber-800 hover:bg-amber-200 dark:bg-amber-900/50 dark:text-amber-200 dark:hover:bg-amber-900/80"
                      >
                        Warn / Acknowledge
                      </button>
                      <button
                        onClick={() => handleResolveReport(report.id, "BAN")}
                        disabled={resolvingReportId === report.id}
                        className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700"
                      >
                        BAN USER
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === "ANALYTICS" && (
        <div className="space-y-6">
          <div className="border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 rounded-xl">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 mb-4">Analytics Dashboard (Last 30 Days)</h2>
            {isLoadingAnalytics ? (
              <p className="text-sm text-zinc-500">Loading data...</p>
            ) : analyticsData.length === 0 ? (
              <p className="text-sm text-zinc-500">No analytics data available.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {analyticsData.map((stat) => (
                  <div key={stat.type} className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/50 flex justify-between items-center shadow-sm">
                    <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      {stat.type.replace(/_/g, " ")}
                    </span>
                    <span className="text-xl font-bold tracking-tight text-accent">
                      {stat.count}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
