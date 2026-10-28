"use client";

import { useState } from "react";
import { ClubMetrics, CharterApplication, ClubSummary } from "./types";
import { MOCK_CLUB_METRICS, MOCK_CHARTER_APPLICATIONS, MOCK_RECOGNIZED_CLUBS } from "./mockData";

export function useClubMetrics() {
  const [metrics, setMetrics] = useState<ClubMetrics>(MOCK_CLUB_METRICS);
  const [loading] = useState(false);

  return { metrics, loading, setMetrics };
}

export function useCharterApplications() {
  const [applications, setApplications] = useState<CharterApplication[]>(MOCK_CHARTER_APPLICATIONS);
  const [selectedDocketId, setSelectedDocketId] = useState<string>(MOCK_CHARTER_APPLICATIONS[0]?.docketId || "");
  const [loading] = useState(false);

  const selectedApplication = applications.find((a) => a.docketId === selectedDocketId) || applications[0] || null;

  const approveApplication = (docketId: string) => {
    setApplications((prev) => prev.filter((a) => a.docketId !== docketId));
  };

  const updateApplicationStatus = (docketId: string, status: CharterApplication["status"]) => {
    setApplications((prev) =>
      prev.map((app) => (app.docketId === docketId ? { ...app, status } : app))
    );
  };

  return {
    applications,
    selectedApplication,
    selectedDocketId,
    setSelectedDocketId,
    approveApplication,
    updateApplicationStatus,
    loading
  };
}

export function useRecognizedClubs() {
  const [clubs, setClubs] = useState<ClubSummary[]>(MOCK_RECOGNIZED_CLUBS);
  const [loading] = useState(false);

  const addClub = (newClub: ClubSummary) => {
    setClubs((prev) => [newClub, ...prev]);
  };

  return { clubs, setClubs, addClub, loading };
}
