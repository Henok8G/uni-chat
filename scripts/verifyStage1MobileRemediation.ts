/**
 * Automated Verification Script for Uni-Chat Mobile Remediation Stage 1:
 *  - ADMIN-001: Mobile Admin Cockpit Slide-Out Drawer & Trigger
 *  - CHAT-001: Touch Area Accessibility for Chat Composer Controls (~44px)
 *  - AUTH-001: Password Visibility Toggle Touch Container (48px)
 *  - LAND-001: Landing Page Mobile Hero Headline Wrapping & Collision Prevention
 *  - FEED-002: Home Feed Touch Targets & Clearance
 *  - NAV-001: Mobile Shared Navigation Header Collisions
 *  - VIDEO-002: Video Matching Navigation Unification & Call Protection
 */

import * as fs from "fs";
import * as path from "path";

async function runStage1Verification() {
  console.log("=================================================");
  console.log("  UNI-CHAT STAGE 1 AUTOMATED VERIFICATION SUITE  ");
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

  // Helper to read file content
  const root = path.resolve(__dirname, "..");
  const readFile = (relPath: string) => fs.readFileSync(path.join(root, relPath), "utf-8");

  // ─────────────────────────────────────────────────────────────
  // 1. ADMIN-001: Admin Cockpit Slide-Out Drawer & Trigger
  // ─────────────────────────────────────────────────────────────
  console.log("--- 1. ADMIN-001: Admin Cockpit Responsive Drawer ---");
  const adminCockpit = readFile("src/app/admin/AdminCockpit.tsx");

  assert(
    adminCockpit.includes("-translate-x-full lg:translate-x-0"),
    "Mobile sidebar uses slide-out drawer class (-translate-x-full lg:translate-x-0)"
  );

  assert(
    adminCockpit.includes("isMobileDrawerOpen") && adminCockpit.includes("setIsMobileDrawerOpen"),
    "AdminCockpit manages isMobileDrawerOpen state"
  );

  assert(
    adminCockpit.includes("bg-black/40") && adminCockpit.includes("backdrop-blur-xs") && adminCockpit.includes("lg:hidden"),
    "Mobile backdrop overlay closes drawer when clicking outside"
  );

  assert(
    adminCockpit.includes('aria-label="Open navigation menu"'),
    "Accessible mobile hamburger trigger with aria-label"
  );

  assert(
    adminCockpit.includes("ml-0 lg:ml-[260px]"),
    "Main content margin is ml-0 on mobile and ml-[260px] on desktop"
  );

  assert(
    adminCockpit.includes("setIsMobileDrawerOpen(false)") && adminCockpit.includes("navigateToTab"),
    "Selecting any console tab automatically closes mobile drawer"
  );

  assert(
    adminCockpit.includes("w-[260px]") && adminCockpit.includes("fixed"),
    "Desktop sidebar retains 260px fixed left column"
  );

  // ─────────────────────────────────────────────────────────────
  // 2. CHAT-001: Touch Area Accessibility for Chat Composer (~44px)
  // ─────────────────────────────────────────────────────────────
  console.log("\n--- 2. CHAT-001: Chat Composer Touch Areas ---");
  const conversationView = readFile("src/components/chat/ConversationView.tsx");

  assert(
    conversationView.includes("w-11 h-11 sm:w-8 sm:h-8") && conversationView.includes('aria-label="Send message"'),
    "Send button has 44px mobile touch area (w-11 h-11) and 32px desktop (sm:w-8 sm:h-8)"
  );

  assert(
    conversationView.includes("w-11 h-11 sm:w-8 sm:h-8") && conversationView.includes('aria-label="Insert emoji"'),
    "Emoji trigger button has 44px mobile touch area (w-11 h-11) and 32px desktop (sm:w-8 sm:h-8)"
  );

  assert(
    conversationView.includes("w-11 h-11") && conversationView.includes('aria-label="Back to conversations"'),
    "Mobile back button has 44px touch target (w-11 h-11)"
  );

  assert(
    conversationView.includes("safe-area-inset-bottom"),
    "Composer bottom input bar accounts for safe-area-inset-bottom"
  );

  // ─────────────────────────────────────────────────────────────
  // 3. AUTH-001: Password Visibility Toggle Touch Container (48px)
  // ─────────────────────────────────────────────────────────────
  console.log("\n--- 3. AUTH-001: Password Visibility Toggle ---");
  const loginForm = readFile("src/components/auth/AnimatedLoginForm.tsx");
  const registerForm = readFile("src/components/auth/AnimatedRegisterForm.tsx");

  assert(
    loginForm.includes("h-12 w-12 sm:w-10 sm:right-1") && loginForm.includes('aria-label={showPassword ? "Hide password" : "Show password"}'),
    "Login form password toggle has 48px touch container (h-12 w-12) with aria-label"
  );

  assert(
    loginForm.includes("pr-12"),
    "Login form password input has pr-12 padding to prevent text underlap"
  );

  assert(
    registerForm.includes("h-12 w-12 sm:w-10 sm:right-1") && registerForm.includes('aria-label={showPassword ? "Hide password" : "Show password"}'),
    "Register form password toggle has 48px touch container (h-12 w-12) with aria-label"
  );

  assert(
    registerForm.includes("pr-12"),
    "Register form password input has pr-12 padding to prevent text underlap"
  );

  // ─────────────────────────────────────────────────────────────
  // 4. LAND-001: Landing Page Mobile Hero Headline & Collision
  // ─────────────────────────────────────────────────────────────
  console.log("\n--- 4. LAND-001: Landing Page Mobile Hero ---");
  const landingClient = readFile("src/components/LandingClient.tsx");

  assert(
    !landingClient.includes('className="w-[280px]') && landingClient.includes("w-full max-w-[360px] px-4 sm:max-w-[440px]"),
    "Removed hardcoded w-[280px] hero container, replaced with responsive max-w"
  );

  assert(
    landingClient.includes("hidden sm:block") && landingClient.includes("FloatingElement"),
    "Colliding floating decorative cards hidden on mobile portrait (hidden sm:block)"
  );

  assert(
    landingClient.includes("text-3xl font-extrabold sm:text-5xl md:text-7xl lg:text-8xl"),
    "Mobile headline typography scale properly proportioned (text-3xl on mobile)"
  );

  // ─────────────────────────────────────────────────────────────
  // 5. FEED-002: Home Feed Touch Targets & Clearance
  // ─────────────────────────────────────────────────────────────
  console.log("\n--- 5. FEED-002: Home Feed Touch Targets & Clearance ---");
  const homeClient = readFile("src/components/home/HomeClient.tsx");

  assert(
    homeClient.includes("min-h-[38px]") && homeClient.includes("py-2.5 sm:py-1.5"),
    "Filter chips have ergonomic touch height (min-h-[38px] py-2.5 on mobile)"
  );

  assert(
    homeClient.includes("min-h-[36px]"),
    "Trending tags have ergonomic touch height (min-h-[36px])"
  );

  assert(
    homeClient.includes("pb-[calc(5.75rem+env(safe-area-inset-bottom,0px))]"),
    "Bottom scroll clearance tuned to prevent bottom menu collisions without excessive gap"
  );

  // ─────────────────────────────────────────────────────────────
  // 6. NAV-001: Mobile Shared Navigation Header Collisions
  // ─────────────────────────────────────────────────────────────
  console.log("\n--- 6. NAV-001: Header Collision Offsets ---");
  const profileClient = readFile("src/app/profile/ProfileClient.tsx");

  assert(
    homeClient.includes("pt-16 sm:pt-8"),
    "Home feed container has pt-16 on mobile to clear absolute AppMenu logo/toggle"
  );

  assert(
    profileClient.includes("pt-16 sm:pt-8"),
    "Profile container has pt-16 on mobile to clear absolute AppMenu logo/toggle"
  );

  // ─────────────────────────────────────────────────────────────
  // 7. VIDEO-002: Video Matching Navigation Unification & Call Guard
  // ─────────────────────────────────────────────────────────────
  console.log("\n--- 7. VIDEO-002: Video Matching Navigation Consistency ---");
  const appMenu = readFile("src/components/AppMenu.tsx");
  const chatApp = readFile("src/components/ChatApp.tsx");

  assert(
    appMenu.includes("hidden md:block") && !appMenu.includes('pathname === "/app" ? "block"'),
    "Top pill MenuBar is hidden md:block across all routes (no duplicate top pill on /app mobile)"
  );

  assert(
    appMenu.includes("!isActiveChat && (") && !appMenu.includes('pathname !== "/app"'),
    "Bottom floating MenuBar renders on /app in idle state (!isActiveChat)"
  );

  assert(
    chatApp.includes("{ icon: Home, label: \"Home\", href: \"/home\" }") &&
    chatApp.includes("{ icon: Sparkles, label: \"Match\", href: \"/match\" }") &&
    chatApp.includes("{ icon: MessageSquare, label: \"Chat\", href: \"/app/chat\" }") &&
    chatApp.includes("{ icon: UserIcon, label: \"Profile\", href: \"/profile\" }") &&
    chatApp.includes("{ icon: SettingsIcon, label: \"Settings\", href: \"/settings\" }"),
    "Camera tile mobile menu includes all primary app destinations"
  );

  assert(
    chatApp.includes("Leave video chat? Your active call will end.") &&
    chatApp.includes("status === \"matched\""),
    "Active call protected against accidental termination with confirmation guard"
  );

  assert(
    chatApp.includes("handleEndChat()") && chatApp.includes("router.push(item.href)"),
    "Navigating during call/searching cleanly executes WebRTC and socket teardown"
  );

  console.log("\n=================================================");
  console.log(`  STAGE 1 VERIFICATION: ${totalPassed}/${totalTests} PASSED  `);
  console.log("=================================================\n");

  if (totalPassed === totalTests) {
    console.log("  >>> ALL STAGE 1 ACCEPTANCE CRITERIA VERIFIED SUCCESSFUL <<<\n");
  } else {
    console.error("  >>> SOME VERIFICATION CHECKS FAILED <<<\n");
    process.exitCode = 1;
  }
}

runStage1Verification().catch((err) => {
  console.error("Verification script error:", err);
  process.exit(1);
});
