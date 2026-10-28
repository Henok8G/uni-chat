"use client";

import { useState, useEffect, useCallback } from "react";
import { GroupMetrics, GroupCaseDetail, GovernanceAction } from "./types";
import {
  getGroupsManagementData,
  applyGroupGovernanceAction,
  dismissGroupReports,
  liftGroupFreeze,
  relistGroup,
} from "../groupActions";

export function useGroupsManagement() {
  const [metrics, setMetrics] = useState<GroupMetrics>({
    totalActiveGroups: 0,
    newGroupsThisWeek: 0,
    averageGroupSize: 0,
    medianGroupSize: 0,
    quotaComplianceRate: 100,
    flaggedCommunitiesCount: 0,
  });

  const [groupCases, setGroupCases] = useState<GroupCaseDetail[]>([]);
  const [triageBanners, setTriageBanners] = useState<
    Array<{
      id: string;
      groupId: string;
      title: string;
      badgeLabel: string;
      creatorHandle: string;
      description: string;
      theme: "rose" | "slate";
    }>
  >([]);
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [selectedCase, setSelectedCase] = useState<GroupCaseDetail | null>(null);
  const [totalFilteredCount, setTotalFilteredCount] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [activeTabFilter, setActiveTabFilter] = useState<"ALL" | "FLAGGED" | "HIGH_VELOCITY">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [campusFilter, setCampusFilter] = useState("All AAU Campuses");
  const [sortOption, setSortOption] = useState("Recent Activity");

  const loadData = useCallback(
    async (pageToLoad?: number) => {
      setLoading(true);
      setError(null);
      try {
        const pageNum = pageToLoad ?? currentPage;
        const res = await getGroupsManagementData({
          activeTabFilter,
          searchQuery,
          campusFilter,
          sortOption,
          page: pageNum,
          pageSize: 10,
          selectedGroupId: selectedCaseId || undefined,
        });

        setMetrics(res.metrics);
        setTriageBanners(res.triageBanners);
        setGroupCases(res.groupCases);
        setTotalFilteredCount(res.totalFilteredCount);
        setCurrentPage(res.currentPage);
        setTotalPages(res.totalPages);

        if (res.selectedCase) {
          setSelectedCase(res.selectedCase);
          setSelectedCaseId(res.selectedCase.id);
        } else if (res.groupCases.length > 0) {
          setSelectedCase(res.groupCases[0]);
          setSelectedCaseId(res.groupCases[0].id);
        } else {
          setSelectedCase(null);
          setSelectedCaseId(null);
        }
      } catch (err: any) {
        console.error("Failed to load groups management data:", err);
        setError(err?.message || "Failed to load groups");
      } finally {
        setLoading(false);
      }
    },
    [activeTabFilter, searchQuery, campusFilter, sortOption, currentPage, selectedCaseId]
  );

  useEffect(() => {
    loadData(1);
  }, [activeTabFilter, searchQuery, campusFilter, sortOption]);

  const selectCaseById = (id: string) => {
    setSelectedCaseId(id);
    const found = groupCases.find((c) => c.id === id);
    if (found) {
      setSelectedCase(found);
    }
  };

  const dismissTriage = (bannerId: string) => {
    setTriageBanners((prev) => prev.filter((b) => b.id !== bannerId));
  };

  const applySanction = async (groupId: string, action: GovernanceAction, reason?: string) => {
    const res = await applyGroupGovernanceAction(groupId, action, reason);
    await loadData();
    return res;
  };

  const dismissFlags = async (groupId: string) => {
    const res = await dismissGroupReports(groupId);
    await loadData();
    return res;
  };

  const handleLiftFreeze = async (groupId: string) => {
    const res = await liftGroupFreeze(groupId);
    await loadData();
    return res;
  };

  const handleRelist = async (groupId: string) => {
    const res = await relistGroup(groupId);
    await loadData();
    return res;
  };

  const goToPage = (page: number) => {
    setCurrentPage(page);
    loadData(page);
  };

  return {
    metrics,
    groupCases,
    triageBanners,
    selectedCase,
    selectedCaseId,
    totalFilteredCount,
    currentPage,
    totalPages,
    loading,
    error,
    activeTabFilter,
    setActiveTabFilter,
    searchQuery,
    setSearchQuery,
    campusFilter,
    setCampusFilter,
    sortOption,
    setSortOption,
    goToPage,
    selectCaseById,
    dismissTriage,
    applySanction,
    dismissFlags,
    liftFreeze: handleLiftFreeze,
    relist: handleRelist,
    refresh: loadData,
  };
}

// Deprecated mock hooks for backward compatibility if needed
export function useGroupMetrics() {
  const { metrics, loading } = useGroupsManagement();
  return { metrics, loading };
}

export function useGroupCases() {
  const gm = useGroupsManagement();
  return {
    groupCases: gm.groupCases,
    triageBanners: gm.triageBanners,
    selectedCase: gm.selectedCase,
    selectedCaseId: gm.selectedCaseId,
    setSelectedCaseId: gm.selectCaseById,
    dismissTriage: gm.dismissTriage,
    applySanction: gm.applySanction,
    dismissFlags: gm.dismissFlags,
    loading: gm.loading,
  };
}
