import { useState, useEffect, useCallback } from "react";
import {
  PlatformSettingsData,
  SettingsActiveTab,
} from "./types";
import {
  getPlatformSettingsData,
  updatePlatformSettings,
  exportSecurityHealthReport,
  purgePlatformEphemeralCache,
  toggleEmergencyBroadcastMode,
} from "../settingsActions";

export function usePlatformSettings() {
  const [activeTab, setActiveTab] = useState<SettingsActiveTab>("general");
  const [data, setData] = useState<PlatformSettingsData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);

  // Editable local policy state
  const [crossCampusPeerDiscovery, setCrossCampusPeerDiscovery] = useState(true);
  const [intraCampusProximityPriority, setIntraCampusProximityPriority] = useState(true);
  const [crossCampusGroupParticipation, setCrossCampusGroupParticipation] = useState(true);
  const [campusAwareMatching, setCampusAwareMatching] = useState(true);
  const [staffSessionHours, setStaffSessionHours] = useState(8);
  const [studentSessionDays, setStudentSessionDays] = useState(30);
  const [maxGroupsPerStudent, setMaxGroupsPerStudent] = useState(3);
  const [unsubstantiatedReportRetentionDays, setUnsubstantiatedReportRetentionDays] = useState(90);
  const [broadcastOnlyMode, setBroadcastOnlyMode] = useState(false);
  const [emergencyNoticeBanner, setEmergencyNoticeBanner] = useState("");

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await getPlatformSettingsData();
      setData(res);
      setCrossCampusPeerDiscovery(res.crossCampusPeerDiscovery);
      setIntraCampusProximityPriority(res.intraCampusProximityPriority);
      setCrossCampusGroupParticipation(res.crossCampusGroupParticipation);
      setCampusAwareMatching(res.campusAwareMatching);
      setStaffSessionHours(res.staffSessionHours);
      setStudentSessionDays(res.studentSessionDays);
      setMaxGroupsPerStudent(res.maxGroupsPerStudent);
      setUnsubstantiatedReportRetentionDays(res.unsubstantiatedReportRetentionDays);
      setBroadcastOnlyMode(res.broadcastOnlyMode);
      setEmergencyNoticeBanner(res.emergencyNoticeBanner);
      setHasUnsavedChanges(false);
    } catch (err: any) {
      console.error("Failed to load platform settings:", err);
      setError(err?.message || "Failed to load platform settings data.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Toggles
  const togglePeerDiscovery = () => {
    setCrossCampusPeerDiscovery((prev) => !prev);
    setHasUnsavedChanges(true);
  };

  const toggleIntraCampusProximity = () => {
    setIntraCampusProximityPriority((prev) => !prev);
    setHasUnsavedChanges(true);
  };

  const toggleGroupParticipation = () => {
    setCrossCampusGroupParticipation((prev) => !prev);
    setHasUnsavedChanges(true);
  };

  const toggleCampusAwareMatching = () => {
    setCampusAwareMatching((prev) => !prev);
    setHasUnsavedChanges(true);
  };

  // Save all settings
  const saveAllConfigurations = async () => {
    setIsSaving(true);
    setError(null);
    try {
      await updatePlatformSettings({
        crossCampusPeerDiscovery,
        intraCampusProximityPriority,
        crossCampusGroupParticipation,
        campusAwareMatching,
        staffSessionHours,
        studentSessionDays,
        maxGroupsPerStudent,
        unsubstantiatedReportRetentionDays,
      });
      setHasUnsavedChanges(false);
      await loadData();
      return { success: true };
    } catch (err: any) {
      setError(err?.message || "Failed to save configuration.");
      return { success: false, error: err?.message };
    } finally {
      setIsSaving(false);
    }
  };

  // Export report
  const downloadReport = async () => {
    try {
      const { filename, reportJson } = await exportSecurityHealthReport();
      const blob = new Blob([reportJson], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      return { success: true, filename };
    } catch (err: any) {
      return { success: false, error: err?.message };
    }
  };

  // Purge cache
  const purgeCache = async () => {
    try {
      const res = await purgePlatformEphemeralCache();
      await loadData();
      return res;
    } catch (err: any) {
      return { success: false, message: err?.message };
    }
  };

  // Toggle emergency broadcast mode
  const toggleBroadcast = async (enabled: boolean, notice?: string) => {
    try {
      const res = await toggleEmergencyBroadcastMode(enabled, notice || "");
      setBroadcastOnlyMode(res.broadcastOnlyMode);
      await loadData();
      return { success: true, broadcastOnlyMode: res.broadcastOnlyMode };
    } catch (err: any) {
      return { success: false, error: err?.message };
    }
  };

  return {
    activeTab,
    setActiveTab,
    data,
    isLoading,
    isSaving,
    error,
    hasUnsavedChanges,
    refreshData: loadData,
    // Editable state
    crossCampusPeerDiscovery,
    intraCampusProximityPriority,
    crossCampusGroupParticipation,
    campusAwareMatching,
    staffSessionHours,
    studentSessionDays,
    maxGroupsPerStudent,
    unsubstantiatedReportRetentionDays,
    broadcastOnlyMode,
    emergencyNoticeBanner,
    // Mutators
    togglePeerDiscovery,
    toggleIntraCampusProximity,
    toggleGroupParticipation,
    toggleCampusAwareMatching,
    setStaffSessionHours: (v: number) => {
      setStaffSessionHours(v);
      setHasUnsavedChanges(true);
    },
    setStudentSessionDays: (v: number) => {
      setStudentSessionDays(v);
      setHasUnsavedChanges(true);
    },
    setMaxGroupsPerStudent: (v: number) => {
      setMaxGroupsPerStudent(v);
      setHasUnsavedChanges(true);
    },
    setUnsubstantiatedReportRetentionDays: (v: number) => {
      setUnsubstantiatedReportRetentionDays(v);
      setHasUnsavedChanges(true);
    },
    // Actions
    saveAllConfigurations,
    downloadReport,
    purgeCache,
    toggleBroadcast,
  };
}
