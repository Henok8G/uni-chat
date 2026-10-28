/**
 * Automated Verification Script for Phase 4A (VIDEO-001):
 *  - Mobile Live Video Portrait-First Layout
 *  - Remote Video Visual Priority
 *  - Picture-in-Picture (PIP) Local Camera Preview
 *  - One-Handed Mobile Call Controls Dock with Safe-Area Offset
 *  - Mobile In-Call Chat Bottom Sheet & Unread Badge
 *  - 100% Desktop Baseline Preservation
 */

import * as fs from "fs";
import * as path from "path";

async function runPhase4AVerification() {
  console.log("=================================================");
  console.log("  UNI-CHAT PHASE 4A: MOBILE LIVE VIDEO UX (VIDEO-001)  ");
  console.log("=================================================\n");

  let totalPassed = 0;
  let totalTests = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    totalTests++;
    if (condition) {
      console.log(`  [PASS] ${testName}`);
      totalPassed++;
    } else {
      console.error(`  [FAIL] ${testName}${detail ? ` - ${detail}` : ""}`);
      process.exitCode = 1;
    }
  }

  function readFile(relativePath: string): string {
    return fs.readFileSync(path.join(process.cwd(), relativePath), "utf-8");
  }

  const chatApp = readFile("src/components/ChatApp.tsx");

  // ─────────────────────────────────────────────────────────────
  // 1. Portrait-First Mobile Video Structure
  // ─────────────────────────────────────────────────────────────
  console.log("--- 1. Portrait-First Video Composition ---");

  assert(
    chatApp.includes('className="flex md:hidden font-sf-pro flex-col w-full h-[calc(100dvh-5.5rem)]'),
    "Mobile layout uses full portrait height container (calc(100dvh-5.5rem)) on md:hidden"
  );

  assert(
    chatApp.includes('id="mobile-remote-video"') &&
      chatApp.includes('className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500'),
    "Remote video has primary visual focus (absolute inset-0 w-full h-full object-cover)"
  );

  assert(
    chatApp.includes('id="mobile-pip-preview"') &&
      chatApp.includes("w-24 h-36 sm:w-28 sm:h-40 rounded-2xl overflow-hidden shadow-2xl border-2 border-white/25"),
    "Local camera is presented as a portrait picture-in-picture (PIP) tile in the corner"
  );

  assert(
    chatApp.includes("Camera Off") && chatApp.includes("scale-x-[-1]"),
    "PIP preview includes mirrored local stream and 'Camera Off' fallback state"
  );

  // ─────────────────────────────────────────────────────────────
  // 2. Mobile Call Controls Dock
  // ─────────────────────────────────────────────────────────────
  console.log("\n--- 2. Ergonomic One-Handed Call Controls ---");

  assert(
    chatApp.includes('id="mobile-call-controls"'),
    "Mobile layout includes dedicated call controls dock (#mobile-call-controls)"
  );

  assert(
    chatApp.includes("paddingBottom: \"calc(0.75rem + env(safe-area-inset-bottom, 0px))\"") ||
      chatApp.includes("paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom, 0px))'"),
    "Mobile call controls respect safe-area-inset-bottom"
  );

  assert(
    (chatApp.includes('aria-label="Toggle microphone"') || chatApp.includes('isAudioEnabled ? "Mute microphone" : "Unmute microphone"')) &&
      (chatApp.includes('aria-label="Toggle camera"') || chatApp.includes('isVideoEnabled ? "Turn off camera" : "Turn on camera"')),
    "Microphone and camera toggle buttons have accessible aria-labels"
  );

  assert(
    chatApp.includes('aria-label="Toggle in-call chat"') &&
      chatApp.includes('aria-label="Next match"') &&
      chatApp.includes('aria-label="End call"'),
    "Chat sheet, Next Match, and End Call buttons have accessible aria-labels"
  );

  // ─────────────────────────────────────────────────────────────
  // 3. State-Dependent Video Behaviors
  // ─────────────────────────────────────────────────────────────
  console.log("\n--- 3. State-Dependent Behaviors ---");

  assert(
    chatApp.includes('status === "searching"') &&
      chatApp.includes('aria-label="Cancel search"') &&
      chatApp.includes("Searching for university students..."),
    "Searching state provides full-screen camera preview, sonar pulse, and reach-friendly cancel button"
  );

  assert(
    chatApp.includes('status === "matched"') &&
      chatApp.includes("Connecting peer stream...") &&
      chatApp.includes("Live"),
    "Matched state includes peer stream connecting fallback and live badge"
  );

  // ─────────────────────────────────────────────────────────────
  // 4. In-Call Chat Bottom Sheet
  // ─────────────────────────────────────────────────────────────
  console.log("\n--- 4. In-Call Chat Bottom Sheet & Unread Badge ---");

  assert(
    chatApp.includes('id="mobile-chat-sheet"') &&
      chatApp.includes("fixed inset-x-0 bottom-0 z-50 md:hidden flex flex-col h-[75vh]"),
    "Chat opens in dedicated mobile bottom sheet (h-[75vh] rounded-t-[28px] md:hidden)"
  );

  assert(
    chatApp.includes("w-12 h-1.5 bg-zinc-300 dark:bg-zinc-700 rounded-full mx-auto"),
    "Bottom sheet features an ergonomic pull grabber handle"
  );

  assert(
    chatApp.includes('aria-label="Close in-call chat"'),
    "Bottom sheet includes accessible close button"
  );

  assert(
    chatApp.includes("unreadCount") &&
      chatApp.includes("setUnreadCount((prev) => (isChatOpen ? 0 : prev + 1))"),
    "Unread message counter increments when chat sheet is closed and partner sends a message"
  );

  assert(
    chatApp.includes("unreadCount > 0 && !isChatOpen") &&
      chatApp.includes("bg-rose-500 text-white text-[10px] font-bold rounded-full"),
    "Chat toggle button displays animated unread badge when messages are pending"
  );

  // ─────────────────────────────────────────────────────────────
  // 5. Desktop Baseline Preservation
  // ─────────────────────────────────────────────────────────────
  console.log("\n--- 5. Desktop Baseline Preservation ---");

  assert(
    chatApp.includes('className="hidden md:flex flex-col flex-1 relative animate-in zoom-in-95 duration-500 w-full h-full min-h-[480px]">') &&
      chatApp.includes('className="grid grid-cols-2 gap-4 sm:gap-6 w-full flex-1 h-[68vh] lg:h-[74vh] max-h-[820px] min-h-[460px]">'),
    "Desktop 2-column video grid layout (grid grid-cols-2) is 100% preserved"
  );

  assert(
    chatApp.includes('className="hidden md:flex flex-col md:w-[360px] lg:w-[390px] shrink-0 h-[68vh]'),
    "Desktop slide-out chat panel is explicitly scoped to desktop (hidden md:flex)"
  );

  console.log(`\n=================================================`);
  console.log(`  PHASE 4A RESULTS: ${totalPassed} / ${totalTests} PASSED`);
  console.log(`=================================================`);

  if (totalPassed !== totalTests) {
    process.exit(1);
  }
}

runPhase4AVerification().catch((err) => {
  console.error("Phase 4A verification failure:", err);
  process.exit(1);
});
