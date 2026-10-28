export const EVENT_CATEGORIES = [
  "Academic / Seminar",
  "Workshop",
  "Hackathon",
  "Career / Opportunity",
  "Club / Community",
  "Meeting",
  "Concert / Cultural",
  "Sports",
  "Social",
  "Other",
] as const;

export type EventCategory = (typeof EVENT_CATEGORIES)[number];

export function getCategoryStyle(category?: string | null): {
  badgeClasses: string;
  accentBorder: string;
  dotColor: string;
} {
  const cat = (category || "").toLowerCase();

  if (cat.includes("academic") || cat.includes("seminar")) {
    return {
      badgeClasses:
        "bg-blue-50 text-blue-700 border-blue-200/80 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/60",
      accentBorder: "border-blue-500",
      dotColor: "bg-blue-500",
    };
  }
  if (cat.includes("workshop")) {
    return {
      badgeClasses:
        "bg-amber-50 text-amber-800 border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60",
      accentBorder: "border-amber-500",
      dotColor: "bg-amber-500",
    };
  }
  if (cat.includes("hackathon")) {
    return {
      badgeClasses:
        "bg-purple-50 text-purple-700 border-purple-200/80 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800/60",
      accentBorder: "border-purple-500",
      dotColor: "bg-purple-500",
    };
  }
  if (cat.includes("career") || cat.includes("opportunity")) {
    return {
      badgeClasses:
        "bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60",
      accentBorder: "border-emerald-500",
      dotColor: "bg-emerald-500",
    };
  }
  if (cat.includes("club") || cat.includes("community")) {
    return {
      badgeClasses:
        "bg-indigo-50 text-indigo-700 border-indigo-200/80 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800/60",
      accentBorder: "border-indigo-500",
      dotColor: "bg-indigo-500",
    };
  }
  if (cat.includes("meeting")) {
    return {
      badgeClasses:
        "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800/80 dark:text-slate-300 dark:border-slate-700",
      accentBorder: "border-slate-500",
      dotColor: "bg-slate-500",
    };
  }
  if (cat.includes("concert") || cat.includes("cultural")) {
    return {
      badgeClasses:
        "bg-rose-50 text-rose-700 border-rose-200/80 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/60",
      accentBorder: "border-rose-500",
      dotColor: "bg-rose-500",
    };
  }
  if (cat.includes("sport")) {
    return {
      badgeClasses:
        "bg-orange-50 text-orange-700 border-orange-200/80 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800/60",
      accentBorder: "border-orange-500",
      dotColor: "bg-orange-500",
    };
  }
  if (cat.includes("social")) {
    return {
      badgeClasses:
        "bg-teal-50 text-teal-700 border-teal-200/80 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800/60",
      accentBorder: "border-teal-500",
      dotColor: "bg-teal-500",
    };
  }
  return {
    badgeClasses:
      "bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700",
    accentBorder: "border-zinc-500",
    dotColor: "bg-zinc-500",
  };
}

export function formatEventDateTime(
  startDate?: Date | string | null,
  endDate?: Date | string | null
): { dateStr: string; timeStr: string } {
  if (!startDate) {
    return { dateStr: "Date TBA", timeStr: "Time TBA" };
  }

  const start = new Date(startDate);
  const dateStr = start.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const startTimeStr = start.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  if (!endDate) {
    return { dateStr, timeStr: `${startTimeStr} EAT` };
  }

  const end = new Date(endDate);
  const endTimeStr = end.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  return {
    dateStr,
    timeStr: `${startTimeStr} – ${endTimeStr} EAT`,
  };
}

