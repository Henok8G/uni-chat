"use client";

import { useState, useEffect, useCallback } from "react";
import {
  BroadcastMetrics,
  PendingClearanceItem,
  BroadcastHistoryItem,
  PushComposerDraft,
  TargetingOptions,
} from "./types";
import {
  getNotificationManagementData,
  createBroadcastDraft,
  reviewBroadcastClearance,
  dispatchApprovedBroadcast,
  cancelBroadcast,
  getAudienceRecipientEstimate,
  exportBroadcastAuditCsv,
} from "../notificationActions";

export const INITIAL_COMPOSER_DRAFT: PushComposerDraft = {
  title: "",
  body: "",
  severity: "INFORMATIONAL",
  audienceScope: "ALL",
  targetDepartment: "",
  targetCohort: 1,
  targetCampus: "All Campuses",
  deepLink: "/",
  timing: "immediate",
};

export function useBroadcastMetrics() {
  const [metrics, setMetrics] = useState<BroadcastMetrics | null>(null);
  const [clearanceQueue, setClearanceQueue] = useState<PendingClearanceItem[]>([]);
  const [history, setHistory] = useState<BroadcastHistoryItem[]>([]);
  const [targetingOptions, setTargetingOptions] = useState<TargetingOptions | null>(null);
  const [currentAdmin, setCurrentAdmin] = useState<{ id: string; email: string; name: string } | null>(null);
  const [composerDraft, setComposerDraft] = useState<PushComposerDraft>(INITIAL_COMPOSER_DRAFT);
  const [filterScope, setFilterScope] = useState<string>("ALL");
  const [loading, setLoading] = useState<boolean>(true);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [estimatedRecipients, setEstimatedRecipients] = useState<number>(0);
  const [estimationNote, setEstimationNote] = useState<string>("");

  const refreshData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getNotificationManagementData(filterScope);
      setMetrics(data.metrics as BroadcastMetrics);
      setClearanceQueue(data.clearanceQueue as PendingClearanceItem[]);
      setHistory(data.history as BroadcastHistoryItem[]);
      setTargetingOptions(data.targetingOptions);
      setCurrentAdmin(data.currentAdmin);
    } catch (err) {
      console.error("Failed to load notifications data:", err);
    } finally {
      setLoading(false);
    }
  }, [filterScope]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Recalculate audience recipient estimate when composer scope changes
  useEffect(() => {
    let isMounted = true;
    async function updateEstimate() {
      try {
        const res = await getAudienceRecipientEstimate({
          audienceScope: composerDraft.audienceScope,
          targetDepartment: composerDraft.targetDepartment || undefined,
          targetCohort: composerDraft.targetCohort || undefined,
          targetCampus: composerDraft.targetCampus || undefined,
        });
        if (isMounted) {
          setEstimatedRecipients(res.count);
          setEstimationNote(res.note);
        }
      } catch (err) {
        console.error("Failed to estimate audience:", err);
      }
    }
    updateEstimate();
    return () => {
      isMounted = false;
    };
  }, [
    composerDraft.audienceScope,
    composerDraft.targetDepartment,
    composerDraft.targetCohort,
    composerDraft.targetCampus,
  ]);

  const handleSaveDraft = async (submitNow: boolean) => {
    const res = await createBroadcastDraft({
      title: composerDraft.title,
      body: composerDraft.body,
      severity: composerDraft.severity,
      audienceScope: composerDraft.audienceScope,
      targetDepartment: composerDraft.targetDepartment || undefined,
      targetCohort: composerDraft.targetCohort || undefined,
      targetCampus: composerDraft.targetCampus || undefined,
      deepLink: composerDraft.deepLink,
      submitForReviewNow: submitNow,
    });

    if (res.success) {
      setComposerDraft(INITIAL_COMPOSER_DRAFT);
      await refreshData();
    }
    return res;
  };

  const handleApproveClearance = async (broadcastId: string) => {
    const res = await reviewBroadcastClearance({
      broadcastId,
      decision: "APPROVE",
    });
    if (res.success) {
      await refreshData();
    }
    return res;
  };

  const handleRejectClearance = async (broadcastId: string, reason: string) => {
    const res = await reviewBroadcastClearance({
      broadcastId,
      decision: "REJECT",
      rejectionReason: reason,
    });
    if (res.success) {
      await refreshData();
    }
    return res;
  };

  const handleDispatch = async (broadcastId: string) => {
    const res = await dispatchApprovedBroadcast(broadcastId);
    if (res.success) {
      await refreshData();
    }
    return res;
  };

  const handleCancel = async (broadcastId: string) => {
    const res = await cancelBroadcast(broadcastId);
    if (res.success) {
      await refreshData();
    }
    return res;
  };

  const handleExportCsv = async () => {
    setIsExporting(true);
    try {
      const res = await exportBroadcastAuditCsv();
      if (res.success && res.csv) {
        const blob = new Blob([res.csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", res.fileName);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      return res;
    } finally {
      setIsExporting(false);
    }
  };

  return {
    metrics,
    clearanceQueue,
    history,
    targetingOptions,
    currentAdmin,
    composerDraft,
    setComposerDraft,
    filterScope,
    setFilterScope,
    loading,
    isExporting,
    estimatedRecipients,
    estimationNote,
    refreshData,
    saveDraft: (submitNow = false) => handleSaveDraft(submitNow),
    approveClearance: handleApproveClearance,
    rejectClearance: handleRejectClearance,
    dispatchBroadcast: handleDispatch,
    cancelBroadcast: handleCancel,
    exportAuditCsv: handleExportCsv,
  };
}
