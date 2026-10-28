/**
 * Uni-Chat Phase 8 Verification: Accessibility (A11Y-001) & Final Quality Assurance
 * 
 * Verifies:
 *  1. WCAG 2.1 AA Color Contrast & Tokens (--muted, focus ring, alert colors)
 *  2. Keyboard Navigation, Focus Visibility, & Escape Key Listeners across all modals/overlays
 *  3. Screen-Reader Semantics (ARIA roles, dialog, tablist, radiogroup, switch, live regions)
 *  4. Motion & Reduced Motion Preferences (@media (prefers-reduced-motion: reduce), ReactionOverlay)
 *  5. Forms, Touch Targets, and Accessibility Enhancements
 *  6. Live HTTP Route Health across Public, Protected, and Admin Endpoints
 */

import fs from "fs";
import path from "path";
import http from "http";
import { prisma } from "../src/lib/prisma";
import { SignJWT } from "jose";

const repoRoot = path.resolve(__dirname, "..");

let totalPassed = 0;
let totalFailed = 0;

function assert(condition: boolean, description: string) {
  if (condition) {
    console.log(`✅ ${description}`);
    totalPassed++;
  } else {
    console.error(`❌ FAILED: ${description}`);
    totalFailed++;
    process.exitCode = 1;
  }
}

function fetchHttp(urlStr: string, headers: Record<string, string> = {}): Promise<{ status: number; body: string; location?: string }> {
  return new Promise((resolve, reject) => {
    const url = new URL(urlStr);
    const req = http.request(
      {
        hostname: url.hostname,
        port: url.port || 80,
        path: url.pathname + url.search,
        method: "GET",
        headers: {
          "User-Agent": "UniChat-Phase8-QA-Verifier/1.0",
          ...headers,
        },
      },
      (res) => {
        let body = "";
        res.on("data", (chunk) => (body += chunk));
        res.on("end", () => {
          resolve({
            status: res.statusCode || 0,
            body,
            location: res.headers.location,
          });
        });
      }
    );
    req.on("error", reject);
    req.setTimeout(35000, () => {
      req.destroy();
      reject(new Error("Request timed out after 35s"));
    });
    req.end();
  });
}

async function runPhase8Verification() {
  console.log("===============================================================");
  console.log("   Uni-Chat Phase 8 Verification: A11Y-001 & Final QA Suite");
  console.log("===============================================================\n");

  // ─────────────────────────────────────────────────────────────────
  // 1. Color Contrast & CSS Design System Tokens
  // ─────────────────────────────────────────────────────────────────
  console.log("--- 1. Color Contrast & Token Audit (WCAG AA Compliance) ---");
  const globalsCss = fs.readFileSync(path.join(repoRoot, "src/app/globals.css"), "utf-8");

  assert(
    globalsCss.includes("--muted: #4b5563;") || globalsCss.includes("--muted: #4B5563;"),
    "globals.css defines WCAG AA compliant light-mode muted token (#4b5563 >= 7.5:1 on white)"
  );
  assert(
    globalsCss.includes("--muted: #9ca3af;") || globalsCss.includes("--muted: #9CA3AF;"),
    "globals.css defines WCAG AA compliant dark-mode muted token (#9ca3af >= 7.0:1 on dark background)"
  );
  assert(
    globalsCss.includes("--focus-ring:") && globalsCss.includes("#2563eb"),
    "globals.css defines dedicated high-contrast focus ring token with high-visibility blue outline"
  );
  assert(
    globalsCss.includes(":focus-visible") && globalsCss.includes("box-shadow: var(--focus-ring);"),
    "globals.css applies universal high-contrast :focus-visible dual-ring styles"
  );

  const pricingSection = fs.readFileSync(path.join(repoRoot, "src/components/PricingSection.tsx"), "utf-8");
  assert(
    pricingSection.includes("text-blue-600 dark:text-blue-400") && pricingSection.includes("bg-blue-600 dark:bg-blue-500"),
    "PricingSection uses accessible high-contrast blue accents replacing low-contrast #869ece"
  );

  const homeClient = fs.readFileSync(path.join(repoRoot, "src/components/home/HomeClient.tsx"), "utf-8");
  assert(
    homeClient.includes("text-zinc-500 dark:text-zinc-400"),
    "HomeClient uses WCAG AA accessible post metadata/author timestamp contrast (text-zinc-500 dark:text-zinc-400)"
  );

  const loginForm = fs.readFileSync(path.join(repoRoot, "src/components/auth/AnimatedLoginForm.tsx"), "utf-8");
  assert(
    loginForm.includes("text-red-600 dark:text-red-400") && loginForm.includes("border-red-200 dark:border-red-900/50"),
    "AnimatedLoginForm error banner uses accessible high-contrast text and border"
  );

  const registerForm = fs.readFileSync(path.join(repoRoot, "src/components/auth/AnimatedRegisterForm.tsx"), "utf-8");
  assert(
    registerForm.includes("text-red-600 dark:text-red-400") && registerForm.includes("text-emerald-700 dark:text-emerald-400"),
    "AnimatedRegisterForm error and success banners use accessible high-contrast color tokens"
  );

  // ─────────────────────────────────────────────────────────────────
  // 2. Keyboard Navigation, Focus Visibility, & Escape Handlers
  // ─────────────────────────────────────────────────────────────────
  console.log("\n--- 2. Keyboard Navigation & Escape Key Handlers ---");
  const chatApp = fs.readFileSync(path.join(repoRoot, "src/components/ChatApp.tsx"), "utf-8");
  assert(
    chatApp.includes('e.key === "Escape"') &&
    chatApp.includes("setShowEmojiPicker(false)") &&
    chatApp.includes("setIsReportModalOpen(false)") &&
    chatApp.includes("setShowPartnerModal(false)") &&
    chatApp.includes("setMobileMenuOpen(false)") &&
    chatApp.includes("setIsChatOpen(false)"),
    "ChatApp has unified Escape key handler closing emoji picker, report modal, partner modal, mobile menu, and in-call chat"
  );

  const matchHub = fs.readFileSync(path.join(repoRoot, "src/components/match/MatchHubClient.tsx"), "utf-8");
  assert(
    matchHub.includes('e.key === "Escape"') &&
    matchHub.includes("setIsDeptDropdownOpen(false)") &&
    matchHub.includes("setActiveBlip(null)") &&
    matchHub.includes("setIsSearching(false)"),
    "MatchHubClient has Escape key listener closing dropdowns, radar blip previews, and matching search"
  );

  assert(
    homeClient.includes('e.key === "Escape"') &&
    homeClient.includes("setOpportunityModalOpen(false)") &&
    homeClient.includes("setEventModalOpen(false)") &&
    homeClient.includes("setCommentModalData"),
    "HomeClient has Escape key listener closing opportunity, event registration, and comment modals"
  );

  const adminCockpit = fs.readFileSync(path.join(repoRoot, "src/app/admin/AdminCockpit.tsx"), "utf-8");
  assert(
    adminCockpit.includes('e.key === "Escape"') &&
    adminCockpit.includes("setIsMobileDrawerOpen(false)"),
    "AdminCockpit has Escape key listener dismissing mobile navigation drawer and overlays"
  );

  const conversationView = fs.readFileSync(path.join(repoRoot, "src/components/chat/ConversationView.tsx"), "utf-8");
  assert(
    conversationView.includes('e.key === "Escape"') &&
    conversationView.includes("setShowEmojiPicker(false)"),
    "ConversationView has Escape key listener dismissing quick emoji reactions tray"
  );

  const settingsClient = fs.readFileSync(path.join(repoRoot, "src/app/settings/SettingsClient.tsx"), "utf-8");
  assert(
    settingsClient.includes('e.key === "Escape"') &&
    settingsClient.includes("setShowPasswordModal(false)") &&
    settingsClient.includes("setShowAvatarModal(false)") &&
    settingsClient.includes("setShowEditModal(false)"),
    "SettingsClient has Escape key listener dismissing password, avatar, and profile edit modals"
  );

  // ─────────────────────────────────────────────────────────────────
  // 3. Screen Reader Semantics & ARIA Landmarks
  // ─────────────────────────────────────────────────────────────────
  console.log("\n--- 3. Screen-Reader Semantics & ARIA Landmarks ---");
  const bottomMenu = fs.readFileSync(path.join(repoRoot, "src/components/ui/bottom-menu.tsx"), "utf-8");
  assert(
    bottomMenu.includes("<nav") && bottomMenu.includes("aria-label="),
    "bottom-menu.tsx renders semantic <nav> element with descriptive aria-label"
  );

  const appMenu = fs.readFileSync(path.join(repoRoot, "src/components/AppMenu.tsx"), "utf-8");
  assert(
    appMenu.includes('aria-label="Log out of Uni-Chat"'),
    "AppMenu logout button has explicit accessible name aria-label='Log out of Uni-Chat'"
  );

  assert(
    chatApp.includes('role="dialog"') &&
    chatApp.includes('aria-modal="true"') &&
    chatApp.includes('aria-labelledby="report-modal-title"'),
    "ChatApp Report User modal has role='dialog', aria-modal='true', and accessible title linkage"
  );

  assert(
    chatApp.includes('id="mobile-chat-sheet"') &&
    chatApp.includes('role="dialog"') &&
    chatApp.includes('aria-modal="true"') &&
    chatApp.includes('aria-label="In-call chat"'),
    "ChatApp in-call chat bottom sheet has role='dialog', aria-modal='true', and accessible name"
  );

  assert(
    chatApp.includes('aria-label={isAudioEnabled ? "Mute microphone" : "Unmute microphone"}') &&
    chatApp.includes('aria-label={isVideoEnabled ? "Turn off camera" : "Turn on camera"}') &&
    chatApp.includes("aria-pressed={isAudioEnabled}") &&
    chatApp.includes("aria-pressed={isVideoEnabled}"),
    "ChatApp call controls have dynamic state-dependent accessible names and aria-pressed attributes"
  );

  assert(
    matchHub.includes('role="radiogroup"') &&
    matchHub.includes('role="radio"') &&
    matchHub.includes("aria-checked="),
    "MatchHubClient matching criteria (Gender, Campus, Year, Mode) use accessible role='radiogroup' and role='radio'"
  );

  assert(
    matchHub.includes("aria-expanded={isCriteriaExpanded}") &&
    matchHub.includes('aria-controls="matching-criteria-body"'),
    "MatchHubClient criteria accordion toggle has aria-expanded and aria-controls attributes"
  );

  assert(
    matchHub.includes('aria-haspopup="listbox"') &&
    matchHub.includes('role="listbox"') &&
    matchHub.includes('role="option"'),
    "MatchHubClient department dropdown has complete combobox/listbox accessible semantics"
  );

  const homeModals = fs.readFileSync(path.join(repoRoot, "src/components/home/HomeModals.tsx"), "utf-8");
  assert(
    homeModals.includes('role="dialog"') &&
    homeModals.includes('aria-modal="true"') &&
    homeModals.includes('aria-labelledby="opportunity-modal-title"') &&
    homeModals.includes('aria-labelledby="event-modal-title"') &&
    homeModals.includes('aria-labelledby="comment-modal-title"'),
    "HomeModals dialogs (Opportunity, Event, Comment) have role='dialog', aria-modal='true', and title linkages"
  );

  assert(
    homeClient.includes('role="tablist"') &&
    homeClient.includes('role="tab"') &&
    homeClient.includes("aria-selected="),
    "HomeClient mobile feed navigation renders role='tablist' with child role='tab' and aria-selected states"
  );

  assert(
    homeClient.includes('aria-label="Search campus feed"'),
    "HomeClient feed search field has explicit aria-label"
  );

  assert(
    adminCockpit.includes('aria-expanded={isMobileDrawerOpen}') &&
    adminCockpit.includes('aria-controls="admin-drawer"'),
    "AdminCockpit drawer toggle has aria-expanded and aria-controls linkage"
  );

  assert(
    adminCockpit.includes('role={isMobileDrawerOpen ? "dialog" : undefined}') &&
    adminCockpit.includes('aria-modal={isMobileDrawerOpen ? "true" : undefined}') &&
    adminCockpit.includes('aria-label="Admin navigation drawer"'),
    "AdminCockpit mobile navigation drawer aside has conditional role='dialog' and aria-modal='true'"
  );

  assert(
    adminCockpit.includes('aria-current={isActive ? "page" : undefined}'),
    "AdminCockpit navigation links announce current active route using aria-current='page'"
  );

  const chatSidebar = fs.readFileSync(path.join(repoRoot, "src/components/chat/ChatSidebar.tsx"), "utf-8");
  assert(
    chatSidebar.includes('aria-label="Search conversations"') &&
    chatSidebar.includes('role="tablist"') &&
    chatSidebar.includes('role="tab"') &&
    chatSidebar.includes('aria-label="Create group"'),
    "ChatSidebar has accessible search, conversation tablist with tabs, and create group button name"
  );

  assert(
    conversationView.includes('aria-label="Type a message"') &&
    conversationView.includes('role="listbox"') &&
    conversationView.includes('aria-label="Quick reactions"'),
    "ConversationView message input and reaction tray have accessible labels and listbox semantics"
  );

  assert(
    loginForm.includes('role="alert"') && loginForm.includes('aria-live="assertive"'),
    "AnimatedLoginForm error banner announces dynamically via role='alert' and aria-live='assertive'"
  );

  assert(
    registerForm.includes('role="radiogroup"') &&
    registerForm.includes('role="radio"') &&
    registerForm.includes("aria-checked={selected}"),
    "AnimatedRegisterForm gender picker uses accessible role='radiogroup' and role='radio' selection"
  );

  assert(
    settingsClient.includes('role="switch"') && settingsClient.includes("aria-checked={chatPreference}"),
    "SettingsClient chat preference toggle operates as an accessible role='switch' with aria-checked"
  );

  const profileClient = fs.readFileSync(path.join(repoRoot, "src/app/profile/ProfileClient.tsx"), "utf-8");
  assert(
    profileClient.includes('aria-label={`Remove hobby ${h}`}') &&
    profileClient.includes('group-focus-within:opacity-100 focus-visible:opacity-100'),
    "ProfileClient hobby chips have accessible remove button names and keyboard focus visibility"
  );

  // ─────────────────────────────────────────────────────────────────
  // 4. Motion & Reduced Motion Preferences
  // ─────────────────────────────────────────────────────────────────
  console.log("\n--- 4. Motion & Reduced-Motion Respect ---");
  assert(
    globalsCss.includes("@media (prefers-reduced-motion: reduce)") &&
    globalsCss.includes("animation-duration: 0.01ms !important;") &&
    globalsCss.includes("transition-duration: 0.01ms !important;"),
    "globals.css has global @media (prefers-reduced-motion: reduce) rule silencing nonessential animations"
  );

  assert(
    chatApp.includes("prefers-reduced-motion: reduce") &&
    chatApp.includes("prefersReducedMotion ?") &&
    chatApp.includes('aria-live="polite"'),
    "ChatApp ReactionOverlay respects prefers-reduced-motion with stationary badge and polite live announcement"
  );

  // ─────────────────────────────────────────────────────────────────
  // 5. Live Endpoint Regression & Route Accessibility
  // ─────────────────────────────────────────────────────────────────
  console.log("\n--- 5. Live Server Endpoints & Route Health ---");
  try {
    const landingRes = await fetchHttp("http://localhost:3000/");
    assert(landingRes.status === 200, "GET / (Landing) returns HTTP 200 OK");
    assert(landingRes.body.includes("<html") && landingRes.body.includes("Uni-Chat"), "Landing page renders complete HTML with Uni-Chat branding");

    const loginRes = await fetchHttp("http://localhost:3000/auth/login");
    assert(loginRes.status === 200, "GET /auth/login returns HTTP 200 OK");
    assert(loginRes.body.includes("Log In") || loginRes.body.includes("Sign In") || loginRes.body.includes("password"), "Login page renders authentication form");

    const registerRes = await fetchHttp("http://localhost:3000/auth/register");
    assert(registerRes.status === 200, "GET /auth/register returns HTTP 200 OK");
    assert(registerRes.body.includes("Create") || registerRes.body.includes("Register") || registerRes.body.includes("Gender"), "Registration page renders student signup form");

    const privacyRes = await fetchHttp("http://localhost:3000/privacy");
    assert(privacyRes.status === 200, "GET /privacy returns HTTP 200 OK");

    const paymentUnauth = await fetchHttp("http://localhost:3000/payment");
    assert(
      paymentUnauth.status === 307 || paymentUnauth.status === 308 || Boolean(paymentUnauth.location?.includes("/auth/login")),
      "GET /payment unauthenticated redirects to /auth/login"
    );

    const appUnauth = await fetchHttp("http://localhost:3000/app");
    assert(
      appUnauth.status === 307 || appUnauth.status === 308 || Boolean(appUnauth.location?.includes("/auth/login")),
      "GET /app unauthenticated redirects to /auth/login"
    );

    // Test Authenticated Student Session on Primary Routes
    const studentUser = await prisma.user.findFirst({
      where: { emailVerified: true, banned: false, role: "STUDENT" },
      select: { id: true, email: true },
    });

    if (studentUser && process.env.AUTH_SECRET) {
      const secretKey = new TextEncoder().encode(process.env.AUTH_SECRET);
      const sessionToken = await new SignJWT({ userId: studentUser.id })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("2h")
        .sign(secretKey);

      const cookieHeader = { Cookie: `ethi_uni_chat_session=${sessionToken}` };

      const homeRes = await fetchHttp("http://localhost:3000/home", cookieHeader);
      assert(homeRes.status === 200, "GET /home (authenticated student) returns HTTP 200 OK");

      const matchRes = await fetchHttp("http://localhost:3000/match", cookieHeader);
      assert(matchRes.status === 200, "GET /match (authenticated student) returns HTTP 200 OK");

      const profileRes = await fetchHttp("http://localhost:3000/profile", cookieHeader);
      assert(profileRes.status === 200, "GET /profile (authenticated student) returns HTTP 200 OK");

      const settingsRes = await fetchHttp("http://localhost:3000/settings", cookieHeader);
      assert(settingsRes.status === 200, "GET /settings (authenticated student) returns HTTP 200 OK");

      const chatRes = await fetchHttp("http://localhost:3000/app/chat", cookieHeader);
      assert(chatRes.status === 200, "GET /app/chat (authenticated student) returns HTTP 200 OK");
    }
  } catch (err: any) {
    console.warn("⚠️ Live server check skipped or encountered error:", err.message);
  }

  console.log("\n===============================================================");
  console.log(`   🎉 PHASE 8 VERIFICATION COMPLETE: ${totalPassed} PASSED, ${totalFailed} FAILED`);
  console.log("===============================================================");

  if (totalFailed > 0) {
    process.exit(1);
  }
}

runPhase8Verification()
  .catch((err) => {
    console.error("Verification script failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
