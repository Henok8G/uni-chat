"use client";

import { useState, useEffect, useCallback } from "react";
import { AnalyticsSummaryData } from "./types";
import { getCampusAnalyticsData, exportAnalyticsReportCsv } from "../analyticsActions";

export function useCampusMetrics(onShowToast?: (msg: string) => void) {
  const [data, setData] = useState<AnalyticsSummaryData | null>(null);
  const [timeRange, setTimeRange] = useState<string>("30 Days");
  const [campusFilter, setCampusFilter] = useState<string>("All AAU Campuses");
  const [loading, setLoading] = useState<boolean>(true);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(
    async (range: string, campus: string) => {
      setLoading(true);
      setError(null);
      try {
        const result = await getCampusAnalyticsData(range, campus);
        setData(result);
      } catch (err: any) {
        console.error("Failed to load campus analytics:", err);
        const errMsg = err?.message || "Failed to load campus analytics";
        setError(errMsg);
        if (onShowToast) {
          onShowToast(`Analytics Error: ${errMsg}`);
        }
      } finally {
        setLoading(false);
      }
    },
    [onShowToast]
  );

  useEffect(() => {
    fetchData(timeRange, campusFilter);
  }, [fetchData, timeRange, campusFilter]);

  const handleExportCsv = async () => {
    setIsExporting(true);
    try {
      const { filename, csvContent } = await exportAnalyticsReportCsv(timeRange, campusFilter);
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      if (onShowToast) {
        onShowToast(`Report downloaded: ${filename}`);
      }
    } catch (err: any) {
      console.error("Failed to export report:", err);
      if (onShowToast) {
        onShowToast(`Export failed: ${err?.message || "Unknown error"}`);
      }
    } finally {
      setIsExporting(false);
    }
  };

  return {
    data,
    loading,
    error,
    timeRange,
    setTimeRange,
    campusFilter,
    setCampusFilter,
    refresh: () => fetchData(timeRange, campusFilter),
    exportCsv: handleExportCsv,
    isExporting,
  };
}
