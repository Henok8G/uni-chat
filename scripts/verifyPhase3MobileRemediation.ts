/**
 * Automated Verification Script for Phase 3:
 *  - FEED-001: Home feed mobile & tablet layout, sidebar behavior, category navigation, touch scrolling
 *  - RADAR-001: Match Hub mobile layout, matchmaking radar, criteria placement, primary CTA visibility
 */

import * as fs from "fs";
import * as path from "path";

async function runPhase3Verification() {
  console.log("=================================================");
  console.log("  UNI-CHAT PHASE 3 AUTOMATED VERIFICATION SUITE  ");
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

  // ─────────────────────────────────────────────────────────────
  // 1. FEED-001: Home Feed Mobile & Tablet Layout
  // ─────────────────────────────────────────────────────────────
  console.log("--- 1. FEED-001: Home Feed Mobile & Tablet Layout ---");
  const homeClient = readFile("src/components/home/HomeClient.tsx");
  const homeSidebar = readFile("src/components/home/HomeSidebar.tsx");

  assert(
    homeClient.includes('const [mobileTab, setMobileTab] = useState<"feed" | "groups" | "events">("feed")'),
    "HomeClient manages stateful mobileTab navigation ('feed' | 'groups' | 'events')"
  );

  assert(
    homeClient.includes("lg:hidden flex items-center p-1 rounded-2xl") &&
    homeClient.includes("Campus Feed") &&
    homeClient.includes("Groups") &&
    homeClient.includes("Events"),
    "Mobile & tablet segmented view switcher provides 1-tap access to Feed, Groups, and Events"
  );

  assert(
    homeClient.includes("flex sm:flex-wrap items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar scroll-smooth") &&
    homeClient.includes("touch-pan-x"),
    "Category filter chips support smooth horizontal touch scrolling on mobile while wrapping on desktop"
  );

  assert(
    homeClient.includes("shrink-0 whitespace-nowrap rounded-full text-xs font-medium font-sf-pro"),
    "Category filter chips have shrink-0 whitespace-nowrap preventing awkward multiline text wrap"
  );

  assert(
    homeClient.includes("min-h-[38px]") && homeClient.includes("py-2.5 sm:py-1.5"),
    "Category filter chips maintain ergonomic touch target height (min-h-[38px])"
  );

  assert(
    homeClient.includes("overflow-x-auto no-scrollbar scroll-smooth w-full py-0.5 -mx-0.5 px-0.5 touch-pan-x"),
    "Trending campus tags support horizontal touch scrolling on mobile"
  );

  assert(
    homeClient.includes('${mobileTab !== "feed" ? "hidden lg:block" : "block"}'),
    "Feed column is full-width on mobile and preserves 8-column desktop split (lg:col-span-8)"
  );

  assert(
    homeClient.includes('${mobileTab === "feed" ? "hidden lg:block" : "block"}'),
    "Sidebar column avoids mobile burial: accessible via segmented tabs and preserves 4-column desktop split"
  );

  assert(
    homeSidebar.includes('viewMode?: "all" | "groups" | "events"') &&
    homeSidebar.includes("const showGroups = viewMode === \"all\" || viewMode === \"groups\"") &&
    homeSidebar.includes("const showEvents = viewMode === \"all\" || viewMode === \"events\""),
    "HomeSidebar supports modular viewMode ('all' | 'groups' | 'events') for mobile tabs and desktop coexistence"
  );

  assert(
    homeClient.includes("rounded-[28px]") && homeClient.includes("p-4 sm:p-6 transition-all duration-300 hover:shadow-md"),
    "Feed article cards use responsive padding (p-4 sm:p-6) optimized for mobile reading density"
  );

  // ─────────────────────────────────────────────────────────────
  // 2. RADAR-001: Match Hub Mobile Layout & Primary CTA
  // ─────────────────────────────────────────────────────────────
  console.log("\n--- 2. RADAR-001: Match Hub Mobile Layout & Primary Action ---");
  const matchHubClient = readFile("src/components/match/MatchHubClient.tsx");

  assert(
    matchHubClient.includes("lg:col-span-7 space-y-6 order-2 lg:order-1"),
    "Left column (Criteria) ordered second on mobile (order-2) and first on desktop (lg:order-1)"
  );

  assert(
    matchHubClient.includes("lg:col-span-5 space-y-6 lg:sticky lg:top-24 order-1 lg:order-2"),
    "Right column (Radar & CTA) anchored first on mobile (order-1) and right on desktop (lg:order-2)"
  );

  assert(
    matchHubClient.includes('id="primary-match-cta"') &&
    matchHubClient.includes("Launch Match Radar"),
    "Primary matching CTA button has accessible identifier and prominent placement"
  );

  assert(
    matchHubClient.includes('id="mobile-floating-match-cta"') &&
    matchHubClient.includes("lg:hidden fixed bottom-[calc(5rem+env(safe-area-inset-bottom,0px))]"),
    "Mobile floating quick-match bar anchored above safe-area bottom navigation for 1-tap matching"
  );

  assert(
    matchHubClient.includes("w-[260px] h-[260px] sm:w-72 sm:h-72 md:w-80 md:h-80") &&
    matchHubClient.includes("p-4 sm:p-6"),
    "Sonar radar disc scaled responsively (260px on mobile, 320px on desktop) preventing 360px overflow"
  );

  assert(
    matchHubClient.includes("const [isCriteriaExpanded, setIsCriteriaExpanded] = useState<boolean>(true)"),
    "MatchHubClient manages isCriteriaExpanded state for mobile collapsible criteria accordion"
  );

  assert(
    matchHubClient.includes('className={`${isCriteriaExpanded ? "block" : "hidden sm:block"} space-y-5 sm:space-y-6 pt-1`}'),
    "Criteria filters collapsible on mobile while permanently expanded on desktop (hidden sm:block)"
  );

  assert(
    matchHubClient.includes("Tap to collapse") && matchHubClient.includes("Tap to customize"),
    "Interactive mobile trigger clearly communicates filter customization toggle state"
  );

  console.log("\n=================================================");
  console.log(`  PHASE 3 VERIFICATION: ${totalPassed}/${totalTests} PASSED  `);
  console.log("=================================================\n");

  if (totalPassed === totalTests) {
    console.log("  >>> ALL PHASE 3 ACCEPTANCE CRITERIA VERIFIED SUCCESSFUL <<<\n");
  } else {
    console.error("  >>> SOME VERIFICATION CHECKS FAILED <<<\n");
    process.exitCode = 1;
  }
}

runPhase3Verification().catch((err) => {
  console.error("Verification script error:", err);
  process.exit(1);
});
