/**
 * Automated Verification Script for Phase 2:
 *  - MOB-001: Mobile Chat Master-Detail Navigation
 *  - MOB-002: Bottom Navigation Clearance & Active Chat Hiding
 *  - ARCH-003: Route Protection for /home and /match
 */

import "dotenv/config";
import { NextRequest } from "next/server";
import { middleware } from "../middleware";
import * as fs from "fs";
import * as path from "path";

async function runPhase2Tests() {
  console.log("=================================================");
  console.log("  UNI-CHAT PHASE 2 AUTOMATED VERIFICATION SUITE  ");
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

  // ─────────────────────────────────────────────────────────────
  // 1. ARCH-003: Middleware & Route Protection
  // ─────────────────────────────────────────────────────────────
  console.log("--- 1. ARCH-003: Middleware Route Protection ---");

  // Check 1.1: Unauthenticated request to /home redirects to login with return URL
  const reqHome = new NextRequest("http://localhost:3000/home");
  const resHome = await middleware(reqHome);
  const locationHome = resHome.headers.get("location");
  assert(
    resHome.status === 307 && !!locationHome && locationHome.includes("/auth/login?from=%2Fhome"),
    "Unauthenticated /home redirects to /auth/login?from=/home",
    `Received status ${resHome.status}, location: ${locationHome}`
  );

  // Check 1.2: Unauthenticated request to /match redirects to login with return URL
  const reqMatch = new NextRequest("http://localhost:3000/match");
  const resMatch = await middleware(reqMatch);
  const locationMatch = resMatch.headers.get("location");
  assert(
    resMatch.status === 307 && !!locationMatch && locationMatch.includes("/auth/login?from=%2Fmatch"),
    "Unauthenticated /match redirects to /auth/login?from=/match",
    `Received status ${resMatch.status}, location: ${locationMatch}`
  );

  // Check 1.3: Unauthenticated request to /app redirects to login
  const reqApp = new NextRequest("http://localhost:3000/app");
  const resApp = await middleware(reqApp);
  assert(
    resApp.status === 307 && !!resApp.headers.get("location")?.includes("/auth/login"),
    "Unauthenticated /app redirects to /auth/login"
  );

  // Check 1.4: Public routes pass through without redirect
  const publicRoutes = ["http://localhost:3000/", "http://localhost:3000/auth/login", "http://localhost:3000/auth/register", "http://localhost:3000/verify"];
  for (const url of publicRoutes) {
    const reqPub = new NextRequest(url);
    const resPub = await middleware(reqPub);
    assert(
      resPub.status === 200 && !resPub.headers.get("location"),
      `Public route allowed: ${new URL(url).pathname}`
    );
  }

  // Check 1.5: Tampered/invalid JWT cookie clears session and redirects
  const reqTampered = new NextRequest("http://localhost:3000/home", {
    headers: {
      cookie: "ethi_uni_chat_session=invalid.bogus.token",
    },
  });
  const resTampered = await middleware(reqTampered);
  const setCookie = resTampered.headers.get("set-cookie") || "";
  assert(
    resTampered.status === 307 &&
    !!resTampered.headers.get("location")?.includes("/auth/login") &&
    (setCookie.includes("ethi_uni_chat_session=;") || setCookie.includes("Max-Age=0")),
    "Invalid JWT cookie cleared and redirected to /auth/login"
  );

  // Check 1.6: Server-side email verification guard in /home and /match source code
  const homePageSrc = fs.readFileSync(path.join(__dirname, "../src/app/home/page.tsx"), "utf-8");
  const matchPageSrc = fs.readFileSync(path.join(__dirname, "../src/app/match/page.tsx"), "utf-8");
  const chatPageSrc = fs.readFileSync(path.join(__dirname, "../src/app/app/chat/page.tsx"), "utf-8");

  assert(
    homePageSrc.includes("!user.emailVerified") && homePageSrc.includes("redirect("),
    "Server-side email verification enforced on /home page"
  );
  assert(
    matchPageSrc.includes("!sessionUser.emailVerified") && matchPageSrc.includes("redirect("),
    "Server-side email verification enforced on /match page"
  );
  assert(
    chatPageSrc.includes("!user.emailVerified") && chatPageSrc.includes("redirect("),
    "Server-side email verification enforced on /app/chat page"
  );

  // ─────────────────────────────────────────────────────────────
  // 2. MOB-001: Mobile Chat Master-Detail Navigation
  // ─────────────────────────────────────────────────────────────
  console.log("\n--- 2. MOB-001: Mobile Chat Master-Detail Navigation ---");

  const chatClientSrc = fs.readFileSync(path.join(__dirname, "../src/app/app/chat/ChatPageClient.tsx"), "utf-8");
  const convViewSrc = fs.readFileSync(path.join(__dirname, "../src/components/chat/ConversationView.tsx"), "utf-8");

  // Check 2.1: Master-detail state tracking
  assert(
    chatClientSrc.includes("isMobileViewingChat") && chatClientSrc.includes("setIsMobileViewingChat"),
    "ChatPageClient manages isMobileViewingChat master-detail state"
  );

  // Check 2.2: Removed blocking fixed overlay
  assert(
    !chatClientSrc.includes("fixed inset-0 z-40") && !chatClientSrc.includes("pointer-events-none"),
    "Removed blocking mobile sidebar overlay drawer (MOB-001)"
  );

  // Check 2.3: Mobile back button provided in ConversationView
  assert(
    convViewSrc.includes("onBack") && convViewSrc.includes("ArrowLeft") && convViewSrc.includes("md:hidden"),
    "ConversationView includes responsive mobile back button with ArrowLeft"
  );

  // Check 2.4: Desktop split-view preserved
  assert(
    chatClientSrc.includes("md:w-[325px]") && chatClientSrc.includes("md:flex") && chatClientSrc.includes("hidden md:block"),
    "Desktop split-view layout preserved for >= 768px viewports"
  );

  // Check 2.5: Safe-area insets in ConversationView header and input composer
  assert(
    convViewSrc.includes("env(safe-area-inset-top") && convViewSrc.includes("env(safe-area-inset-bottom"),
    "ConversationView accounts for safe-area insets (top and bottom)"
  );

  // Check 2.6: Input typography prevents auto-zoom
  assert(
    convViewSrc.includes("text-base sm:text-[14.5px]"),
    "Message composer input text-base on mobile prevents iOS Safari auto-zoom"
  );

  // ─────────────────────────────────────────────────────────────
  // 3. MOB-002: Bottom Navigation Collisions & Clearance
  // ─────────────────────────────────────────────────────────────
  console.log("\n--- 3. MOB-002: Bottom Navigation Clearance & Collisions ---");

  const appMenuSrc = fs.readFileSync(path.join(__dirname, "../src/components/AppMenu.tsx"), "utf-8");
  const bottomMenuSrc = fs.readFileSync(path.join(__dirname, "../src/components/ui/bottom-menu.tsx"), "utf-8");
  const homeClientSrc = fs.readFileSync(path.join(__dirname, "../src/components/home/HomeClient.tsx"), "utf-8");
  const profileClientSrc = fs.readFileSync(path.join(__dirname, "../src/app/profile/ProfileClient.tsx"), "utf-8");
  const settingsClientSrc = fs.readFileSync(path.join(__dirname, "../src/app/settings/SettingsClient.tsx"), "utf-8");
  const matchClientSrc = fs.readFileSync(path.join(__dirname, "../src/components/match/MatchHubClient.tsx"), "utf-8");

  // Check 3.1: Floating menu hidden on mobile when viewing active conversation
  assert(
    appMenuSrc.includes("!isActiveChat") && chatClientSrc.includes("<AppMenu isActiveChat={isMobileViewingChat}"),
    "Floating bottom menu hidden during mobile active conversation"
  );

  // Check 3.2: Floating menu accounts for device safe-area-inset-bottom
  assert(
    appMenuSrc.includes("env(safe-area-inset-bottom"),
    "Floating bottom menu positions with env(safe-area-inset-bottom)"
  );

  // Check 3.3: Accessibility attributes on navigation items
  assert(
    bottomMenuSrc.includes("aria-label={item.label}") && bottomMenuSrc.includes("aria-current="),
    "MenuBar buttons have aria-label and aria-current accessibility attributes"
  );

  // Check 3.4: Scrollable pages have safe-area bottom clearance
  assert(
    homeClientSrc.includes("env(safe-area-inset-bottom"),
    "Home feed container has safe-area bottom clearance"
  );
  assert(
    profileClientSrc.includes("env(safe-area-inset-bottom"),
    "Profile container has safe-area bottom clearance"
  );
  assert(
    settingsClientSrc.includes("env(safe-area-inset-bottom"),
    "Settings container has safe-area bottom clearance"
  );
  assert(
    matchClientSrc.includes("env(safe-area-inset-bottom"),
    "Match Hub container has safe-area bottom clearance"
  );

  console.log("\n=================================================");
  console.log(`  PHASE 2 VERIFICATION SUMMARY: ${totalPassed}/${totalTests} PASSED  `);
  console.log("=================================================\n");

  if (totalPassed === totalTests) {
    console.log("  >>> ALL PHASE 2 ACCEPTANCE CRITERIA VERIFIED SUCCESSFUL <<<\n");
  } else {
    console.error(`  >>> ${totalTests - totalPassed} TESTS FAILED <<<\n`);
    process.exit(1);
  }
}

runPhase2Tests().catch((err) => {
  console.error("Test execution error:", err);
  process.exit(1);
});
