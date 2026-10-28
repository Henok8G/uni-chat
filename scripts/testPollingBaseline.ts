/**
 * scripts/testPollingBaseline.ts
 *
 * Simulates and benchmarks the background polling behavior:
 * Scenario A: Original implementation (10s interval, unthrottled focus, runs when hidden, no in-flight guard)
 * Scenario B: Optimized implementation (60s interval, pause when hidden, throttled focus, in-flight guard)
 */

interface MockFetchStats {
  totalRequests: number;
  inFlightOverlaps: number;
  hiddenRequests: number;
}

class PollingSimulator {
  // Scenario A: Original
  static simulateOriginal(durationSeconds: number, focusEvents: number[], hiddenIntervals: [number, number][]): MockFetchStats {
    let totalRequests = 0;
    let inFlightOverlaps = 0;
    let hiddenRequests = 0;
    let inFlightUntilSec = -1;

    for (let sec = 1; sec <= durationSeconds; sec++) {
      const isHidden = hiddenIntervals.some(([start, end]) => sec >= start && sec <= end);

      if (sec % 10 === 0) {
        if (sec < inFlightUntilSec) inFlightOverlaps++;
        totalRequests++;
        if (isHidden) hiddenRequests++;
        inFlightUntilSec = sec + 2;
      }

      if (focusEvents.includes(sec)) {
        if (sec < inFlightUntilSec) inFlightOverlaps++;
        totalRequests++;
        if (isHidden) hiddenRequests++;
        inFlightUntilSec = sec + 2;
      }
    }

    return { totalRequests, inFlightOverlaps, hiddenRequests };
  }

  // Scenario B: Optimized
  static simulateOptimized(
    durationSeconds: number,
    focusEvents: number[],
    hiddenIntervals: [number, number][],
    pollIntervalSec = 60,
    minThrottleSec = 30
  ): MockFetchStats {
    let totalRequests = 0;
    let inFlightOverlaps = 0;
    let hiddenRequests = 0;
    let inFlightUntilSec = -1;
    let lastFetchSec = -999;
    let timeSinceLastPoll = 0;

    for (let sec = 1; sec <= durationSeconds; sec++) {
      const isHidden = hiddenIntervals.some(([start, end]) => sec >= start && sec <= end);

      if (!isHidden) {
        timeSinceLastPoll++;
        if (timeSinceLastPoll >= pollIntervalSec) {
          if (sec >= inFlightUntilSec) {
            totalRequests++;
            lastFetchSec = sec;
            timeSinceLastPoll = 0;
            inFlightUntilSec = sec + 2;
          } else {
            inFlightOverlaps++;
          }
        }
      } else {
        timeSinceLastPoll = 0;
      }

      if (focusEvents.includes(sec) && !isHidden) {
        if (sec - lastFetchSec >= minThrottleSec) {
          if (sec >= inFlightUntilSec) {
            totalRequests++;
            lastFetchSec = sec;
            timeSinceLastPoll = 0;
            inFlightUntilSec = sec + 2;
          } else {
            inFlightOverlaps++;
          }
        }
      }
    }

    return { totalRequests, inFlightOverlaps, hiddenRequests };
  }
}

async function main() {
  console.log("=================================================================");
  console.log("BASELINE MEASUREMENT: POLLING FREQUENCY & DB LOAD COMPARISON");
  console.log("=================================================================\n");

  // Simulation: 10-minute session (600 seconds)
  // User switches away to another tab for 5 minutes (from second 120 to 420)
  // User clicks window / switches focus 15 times (some in quick succession)
  const duration = 600; // 10 minutes
  const hiddenIntervals: [number, number][] = [[120, 420]]; // 5 min hidden
  const focusEvents = [15, 16, 17, 45, 110, 421, 422, 423, 450, 480, 500, 501, 530, 570, 590];

  const before = PollingSimulator.simulateOriginal(duration, focusEvents, hiddenIntervals);
  const after = PollingSimulator.simulateOptimized(duration, focusEvents, hiddenIntervals, 60, 30);

  console.log("10-Minute User Session Simulation (5 minutes visible, 5 minutes hidden in background tab):");
  console.log("\n[BEFORE - Current Code]");
  console.log(`  • Total API requests to /api/chat/friend: ${before.totalRequests}`);
  console.log(`  • Unnecessary requests while tab was HIDDEN: ${before.hiddenRequests}`);
  console.log(`  • In-flight request overlaps / race conditions: ${before.inFlightOverlaps}`);
  console.log(`  • Estimated DB queries to Supabase (Phase 1 batched = 2 queries/req): ${before.totalRequests * 2} queries`);

  console.log("\n[AFTER - Proposed Fix]");
  console.log(`  • Total API requests to /api/chat/friend: ${after.totalRequests}`);
  console.log(`  • Unnecessary requests while tab was HIDDEN: ${after.hiddenRequests}`);
  console.log(`  • In-flight request overlaps: ${after.inFlightOverlaps}`);
  console.log(`  • Estimated DB queries to Supabase (Phase 1 batched = 2 queries/req): ${after.totalRequests * 2} queries`);

  const reductionPct = Math.round((1 - after.totalRequests / before.totalRequests) * 100);
  console.log(`\n=> Overall reduction in polling network requests and DB load: ${reductionPct}%`);
}

main().catch(console.error);
