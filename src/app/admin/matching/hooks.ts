"use client";

import { useState, useEffect, useCallback } from "react";
import { MatchingFunnelMetrics, CrossDeptPair, GuardrailSettings } from "./types";
import {
  getMatchingAnalyticsData,
  updateMatchingGuardrails,
  updateAffinityWeights,
  dismissMatchingAnomaly,
  triggerReindexAffinityEmbeddings,
  exportMatchingAuditLogCsv,
} from "../matchingActions";

export function useMatchingMetrics() {
  const [metrics, setMetrics] = useState<MatchingFunnelMetrics>({
    totalMatches: 0,
    monthlyPerStudent: 0,
    acceptanceRate: 0,
    acceptanceRateDelta: 0,
    chatInitiationRate: 0,
    chatInitiationDelta: 0,
    disciplinaryFlagRate: 0,
    semesterReportsCount: 0,
    funnelStages: [],
    affinityVectors: [],
    campusShare: [],
  });

  const [pairs, setPairs] = useState<CrossDeptPair[]>([]);
  const [guardrails, setGuardrails] = useState<GuardrailSettings>({
    crossGenderCooldown: false,
    proximityBiasWeight: 50,
    dailyMatchCap: 5,
    freshmanMentorshipEnabled: true,
    activeAnomalies: [],
  });

  const [algorithmModel, setAlgorithmModel] = useState<string>("Rule-Based Heuristic v1.0");
  const [crossCampusMobilityRate, setCrossCampusMobilityRate] = useState<number>(0);
  const [lastReindexedTime, setLastReindexedTime] = useState<string>("Just now");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [cohortFilter, setCohortFilter] = useState<"ALL" | "UNDERGRAD" | "POSTGRAD">("ALL");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getMatchingAnalyticsData(cohortFilter);
      setMetrics(res.metrics);
      setPairs(res.pairs);
      setGuardrails(res.guardrails);
      setAlgorithmModel(res.algorithmModel);
      setCrossCampusMobilityRate(res.crossCampusMobilityRate);
    } catch (err: any) {
      console.error("Failed to load matching metrics:", err);
      setError(err?.message || "Failed to load matching analytics");
    } finally {
      setLoading(false);
    }
  }, [cohortFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const toggleCrossGenderCooldown = async () => {
    const newVal = !guardrails.crossGenderCooldown;
    // Optimistic update
    setGuardrails((prev) => ({ ...prev, crossGenderCooldown: newVal }));
    try {
      await updateMatchingGuardrails({ crossGenderCooldown: newVal });
    } catch (err) {
      // Revert on error
      setGuardrails((prev) => ({ ...prev, crossGenderCooldown: !newVal }));
      throw err;
    }
  };

  const updateProximityWeight = async (val: number) => {
    setGuardrails((prev) => ({ ...prev, proximityBiasWeight: val }));
    await updateMatchingGuardrails({ proximityBiasWeight: val });
  };

  const updateDailyMatchCap = async (cap: number) => {
    setGuardrails((prev) => ({ ...prev, dailyMatchCap: cap }));
    await updateMatchingGuardrails({ dailyMatchCap: cap });
  };

  const toggleFreshmanMentorship = async () => {
    const newVal = !guardrails.freshmanMentorshipEnabled;
    setGuardrails((prev) => ({ ...prev, freshmanMentorshipEnabled: newVal }));
    await updateMatchingGuardrails({ freshmanMentorshipEnabled: newVal });
  };

  const dismissAnomaly = async (id: string) => {
    setGuardrails((prev) => ({
      ...prev,
      activeAnomalies: prev.activeAnomalies.filter((a) => a.id !== id),
    }));
    await dismissMatchingAnomaly(id);
  };

  const reindexEmbeddings = async () => {
    const res = await triggerReindexAffinityEmbeddings();
    if (res.reindexedAt) {
      setLastReindexedTime(res.reindexedAt);
    }
    await loadData();
    return res;
  };

  const saveWeights = async (weights: {
    academicWeight: number;
    projectWeight: number;
    mentorshipWeight: number;
    hobbiesWeight: number;
  }) => {
    const res = await updateAffinityWeights(weights);
    await loadData();
    return res;
  };

  const exportAuditCsv = async () => {
    return await exportMatchingAuditLogCsv();
  };

  return {
    metrics,
    setMetrics,
    pairs,
    guardrails,
    setGuardrails,
    algorithmModel,
    crossCampusMobilityRate,
    lastReindexedTime,
    cohortFilter,
    setCohortFilter,
    toggleCrossGenderCooldown,
    updateProximityWeight,
    updateDailyMatchCap,
    toggleFreshmanMentorship,
    dismissAnomaly,
    reindexEmbeddings,
    saveWeights,
    exportAuditCsv,
    refresh: loadData,
    loading,
    error,
  };
}
