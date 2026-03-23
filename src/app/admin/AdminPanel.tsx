"use client";

import { useState } from "react";
import { getUserByEmail, updateUserPlan, toggleUserBan } from "./actions";
import { Plan } from "@prisma/client";

// Helper type based on what we return from the actions
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

export function AdminPanel() {
  const [emailQuery, setEmailQuery] = useState("");
  const [user, setUser] = useState<AdminUserView | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Form states for edits
  const [editPlan, setEditPlan] = useState<Plan>(Plan.FREE);
  const getDefaultDatetime = () => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  };
  const [editExpiryDate, setEditExpiryDate] = useState<string>(getDefaultDatetime());

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
      <form onSubmit={handleSearch} className="flex gap-3">
        <input
          type="email"
          placeholder="Search user by email..."
          value={emailQuery}
          onChange={(e) => setEmailQuery(e.target.value)}
          className="flex-1 rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm text-zinc-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
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
                className="w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
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
  );
}
