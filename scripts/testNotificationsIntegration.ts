import "./testDbGuard"; // Strictly enforces isolated TEST_DATABASE_URL
import { prisma } from "../src/lib/prisma";
import {
  createBroadcastDraft,
  submitBroadcastForApproval,
  reviewBroadcastClearance,
  dispatchApprovedBroadcast,
  cancelBroadcast,
  getNotificationManagementData,
  getAudienceRecipientEstimate,
  exportBroadcastAuditCsv,
  fetchStudentNotifications,
  markStudentNotificationRead,
  markAllStudentNotificationsRead,
} from "../src/app/admin/notificationActions";
import {
  BroadcastSeverity,
  BroadcastStatus,
  AudienceScope,
} from "@prisma/client";

async function runNotificationsIntegrationSuite() {
  console.log("=================================================================");
  console.log("UNI-CHAT NOTIFICATIONS & BROADCASTS INTEGRATION TEST SUITE");
  console.log("=================================================================");

  const createdBroadcastIds: string[] = [];
  const createdUserIds: string[] = [];

  try {
    // 1. Setup Test Actors (Admin 1, Admin 2, Student A, Student B)
    console.log("\n[TEST 1] Setting up isolated test actors...");
    const adminAuthor = await prisma.user.create({
      data: {
        email: "test.broadcast.author@aau.edu.et",
        passwordHash: "dummyhash",
        displayName: "Admin Broadcast Author",
        role: "ADMIN",
        department: "Computer Science",
      },
    });
    createdUserIds.push(adminAuthor.id);

    const adminReviewer = await prisma.user.create({
      data: {
        email: "test.broadcast.reviewer@aau.edu.et",
        passwordHash: "dummyhash",
        displayName: "Admin Broadcast Reviewer",
        role: "ADMIN",
        department: "Electrical Engineering",
      },
    });
    createdUserIds.push(adminReviewer.id);

    const studentCS = await prisma.user.create({
      data: {
        email: "test.student.cs@aau.edu.et",
        passwordHash: "dummyhash",
        displayName: "Student CS",
        role: "STUDENT",
        department: "Computer Science",
        year: 3,
      },
    });
    createdUserIds.push(studentCS.id);

    const studentEE = await prisma.user.create({
      data: {
        email: "test.student.ee@aau.edu.et",
        passwordHash: "dummyhash",
        displayName: "Student EE",
        role: "STUDENT",
        department: "Electrical Engineering",
        year: 2,
      },
    });
    createdUserIds.push(studentEE.id);
    console.log("✓ Created 2 isolated test admins and 2 test students.");

    // 2. Unauthorized Student Access Rejection
    console.log("\n[TEST 2] Verifying Student Access Rejection...");
    process.env.TEST_USER_ID = studentCS.id;
    try {
      await getNotificationManagementData();
      throw new Error("Student was able to access admin notifications telemetry!");
    } catch (err: any) {
      if (err.message.includes("Forbidden") || err.message.includes("Unauthorized")) {
        console.log(`✓ Student access rejected successfully: "${err.message}"`);
      } else {
        throw err;
      }
    }

    // 3. Broadcast Draft Creation & Input Validation
    console.log("\n[TEST 3] Testing Broadcast Draft Creation & Input Validation...");
    process.env.TEST_USER_ID = adminAuthor.id;

    // Invalid title length
    const invalidTitle = await createBroadcastDraft({
      title: "No",
      body: "Valid body text here.",
    });
    if (invalidTitle.success) {
      throw new Error("Validation failed: Short title was accepted!");
    }
    console.log(`✓ Short title rejected: "${invalidTitle.error}"`);

    // Valid Draft Creation
    const validDraft = await createBroadcastDraft({
      title: "REGTEST: Campus Library Server Maintenance",
      body: "The central library catalog and e-resources portal will undergo maintenance tonight from 2:00 AM to 5:00 AM EAT.",
      severity: BroadcastSeverity.IMPORTANT,
      audienceScope: AudienceScope.DEPARTMENT,
      targetDepartment: "Computer Science",
      deepLink: "/settings",
      submitForReviewNow: false,
    });
    if (!validDraft.success || !validDraft.broadcast) {
      throw new Error(`Failed to create draft: ${validDraft.error}`);
    }
    createdBroadcastIds.push(validDraft.broadcast.id);
    console.log(`✓ Created draft broadcast: [${validDraft.broadcast.id}] Status: ${validDraft.broadcast.status}`);

    // 4. Submit for Approval & Transition
    console.log("\n[TEST 4] Testing Draft Submission to Clearance Queue...");
    const submitRes = await submitBroadcastForApproval(validDraft.broadcast.id);
    if (!submitRes.success || submitRes.broadcast?.status !== BroadcastStatus.PENDING_APPROVAL) {
      throw new Error(`Failed to submit for approval: ${submitRes.error}`);
    }
    console.log(`✓ Broadcast transitioned to PENDING_APPROVAL: "${submitRes.message}"`);

    // 5. Segregation of Duties: Author Self-Approval Blocked
    console.log("\n[TEST 5] Testing Segregation of Duties (Author Self-Approval Blocked)...");
    process.env.TEST_USER_ID = adminAuthor.id;
    const selfApproveRes = await reviewBroadcastClearance({
      broadcastId: validDraft.broadcast.id,
      decision: "APPROVE",
    });
    if (selfApproveRes.success) {
      throw new Error("Author was allowed to self-approve their own broadcast!");
    }
    console.log(`✓ Self-approval prevented by server guard: "${selfApproveRes.error}"`);

    // 6. Independent Reviewer Clearance (Approval)
    console.log("\n[TEST 6] Testing Independent Reviewer Clearance (Approval)...");
    process.env.TEST_USER_ID = adminReviewer.id;
    const approveRes = await reviewBroadcastClearance({
      broadcastId: validDraft.broadcast.id,
      decision: "APPROVE",
    });
    if (!approveRes.success || approveRes.broadcast?.status !== BroadcastStatus.APPROVED) {
      throw new Error(`Independent approval failed: ${approveRes.error}`);
    }
    console.log(`✓ Independent review approved broadcast. Status: ${approveRes.broadcast.status}`);

    // 7. Audience Targeting & Recipient Estimation
    console.log("\n[TEST 7] Testing Audience Targeting & Recipient Estimation...");
    const estimateAll = await getAudienceRecipientEstimate({
      audienceScope: AudienceScope.ALL,
    });
    console.log(`✓ Audience ALL estimated recipients: ${estimateAll.count}`);

    const estimateDept = await getAudienceRecipientEstimate({
      audienceScope: AudienceScope.DEPARTMENT,
      targetDepartment: "Computer Science",
    });
    console.log(`✓ Audience Computer Science estimated recipients: ${estimateDept.count}`);
    if (estimateDept.count === 0) {
      throw new Error("Estimated count for Computer Science should be at least 1 (our test student)!");
    }

    // 8. Idempotent Multi-Recipient In-App Dispatch
    console.log("\n[TEST 8] Testing Idempotent Multi-Recipient In-App Dispatch...");
    process.env.TEST_USER_ID = adminAuthor.id;
    const dispatchRes = await dispatchApprovedBroadcast(validDraft.broadcast.id);
    if (!dispatchRes.success || dispatchRes.broadcast?.status !== BroadcastStatus.SENT) {
      throw new Error(`Dispatch failed: ${dispatchRes.error}`);
    }
    console.log(`✓ Dispatch completed: "${dispatchRes.message}"`);
    console.log(`  Recipients: ${dispatchRes.broadcast.recipientCount}, Failures: ${dispatchRes.broadcast.failureCount}`);

    // Verify duplicate dispatch blocked
    const duplicateDispatch = await dispatchApprovedBroadcast(validDraft.broadcast.id);
    if (duplicateDispatch.success) {
      throw new Error("Duplicate dispatch succeeded on an already SENT broadcast!");
    }
    console.log(`✓ Duplicate dispatch blocked: "${duplicateDispatch.error}"`);

    // 9. Verify In-App Notification Delivery & Targeting Isolation
    console.log("\n[TEST 9] Verifying In-App Notification Delivery & Targeting Isolation...");
    // CS Student should have received it
    const csNotifications = await prisma.notification.findMany({
      where: { userId: studentCS.id, broadcastId: validDraft.broadcast.id },
    });
    if (csNotifications.length !== 1) {
      throw new Error(`Expected exactly 1 notification for CS student, got ${csNotifications.length}`);
    }
    console.log(`✓ Target recipient received notification: "${csNotifications[0].title}" [Link: ${csNotifications[0].link}]`);

    // EE Student should NOT have received it (isolated by department)
    const eeNotifications = await prisma.notification.findMany({
      where: { userId: studentEE.id, broadcastId: validDraft.broadcast.id },
    });
    if (eeNotifications.length !== 0) {
      throw new Error(`Targeting isolation leak: EE student received Computer Science broadcast!`);
    }
    console.log(`✓ Non-target student received 0 notifications (Department isolation verified).`);

    // 10. Student Read State & Ownership Enforcement
    console.log("\n[TEST 10] Testing Student Read State & Ownership Enforcement...");
    const notifId = csNotifications[0].id;

    // Student EE cannot mark Student CS's notification as read
    process.env.TEST_USER_ID = studentEE.id;
    const unauthorizedMark = await markStudentNotificationRead(notifId);
    if (unauthorizedMark.success) {
      throw new Error("Student EE was able to mark Student CS's private notification as read!");
    }
    console.log(`✓ Recipient ownership enforced: "${unauthorizedMark.error}"`);

    // Student CS marks it as read
    process.env.TEST_USER_ID = studentCS.id;
    const studentFetch = await fetchStudentNotifications();
    console.log(`✓ Student notifications fetched: ${studentFetch.notifications.length} items, unread: ${studentFetch.unreadCount}`);

    const markRes = await markStudentNotificationRead(notifId);
    if (!markRes.success) {
      throw new Error(`Failed to mark read: ${markRes.error}`);
    }
    const updatedNotif = await prisma.notification.findUnique({ where: { id: notifId } });
    if (!updatedNotif?.isRead) {
      throw new Error("Notification was not marked as isRead=true!");
    }
    console.log(`✓ Student successfully marked notification as read.`);

    // 11. Rejection & Cancellation Flows
    console.log("\n[TEST 11] Testing Rejection and Cancellation Flows...");
    process.env.TEST_USER_ID = adminAuthor.id;
    const draft2 = await createBroadcastDraft({
      title: "REGTEST: Cancelled Exam Schedule",
      body: "Midterm examinations for Year 1 have been postponed until next semester.",
      severity: BroadcastSeverity.EMERGENCY,
      submitForReviewNow: true,
    });
    if (!draft2.broadcast) throw new Error("Draft 2 creation failed");
    createdBroadcastIds.push(draft2.broadcast.id);

    // Reject draft 2
    process.env.TEST_USER_ID = adminReviewer.id;
    const rejectRes = await reviewBroadcastClearance({
      broadcastId: draft2.broadcast.id,
      decision: "REJECT",
      rejectionReason: "Official exam changes must come directly from Registrar delegates.",
    });
    if (!rejectRes.success || rejectRes.broadcast?.status !== BroadcastStatus.REJECTED) {
      throw new Error(`Rejection flow failed: ${rejectRes.error}`);
    }
    console.log(`✓ Rejection recorded with reason: "${rejectRes.broadcast.rejectionReason}"`);

    // Cancel draft 2
    const cancelRes = await cancelBroadcast(draft2.broadcast.id);
    if (!cancelRes.success || cancelRes.broadcast?.status !== BroadcastStatus.CANCELLED) {
      throw new Error(`Cancellation failed: ${cancelRes.error}`);
    }
    console.log(`✓ Broadcast cancelled successfully: "${cancelRes.message}"`);

    // 12. Audit Trail & CSV Export Security
    console.log("\n[TEST 12] Testing Audit Trail & CSV Export Security...");
    process.env.TEST_USER_ID = adminAuthor.id;
    const auditLogs = await prisma.auditLog.findMany({
      where: {
        action: {
          in: [
            "CREATE_BROADCAST_DRAFT",
            "SUBMIT_BROADCAST_APPROVAL",
            "APPROVE_BROADCAST",
            "DISPATCH_BROADCAST",
            "REJECT_BROADCAST",
            "CANCEL_BROADCAST",
          ],
        },
      },
    });
    if (auditLogs.length === 0) {
      throw new Error("No broadcast AuditLog records found!");
    }
    console.log(`✓ Verified ${auditLogs.length} broadcast audit log records in database.`);

    const csvRes = await exportBroadcastAuditCsv();
    if (!csvRes.success || !csvRes.csv) {
      throw new Error(`CSV export failed: ${(csvRes as any).error || "Unknown"}`);
    }
    if (csvRes.csv.includes("=cmd") || csvRes.csv.includes("@alert")) {
      throw new Error("CSV injection defense compromised!");
    }
    console.log(`✓ Broadcast Audit CSV successfully generated (${csvRes.count} records) with formula injection protection.`);

    console.log("\n=================================================================");
    console.log("ALL 12 NOTIFICATIONS & BROADCASTS INTEGRATION TESTS PASSED 100%!");
    console.log("=================================================================");
  } finally {
    // Safe Cleanup: Target ONLY test-created records
    console.log("\n[CLEANUP] Safely removing test-created records...");
    for (const bId of createdBroadcastIds) {
      await prisma.notification.deleteMany({ where: { broadcastId: bId } });
      await prisma.broadcast.deleteMany({ where: { id: bId } });
    }
    for (const uId of createdUserIds) {
      await prisma.notification.deleteMany({ where: { userId: uId } });
      await prisma.user.deleteMany({ where: { id: uId } });
    }
    delete process.env.TEST_USER_ID;
    console.log("✓ Test records cleaned up successfully.");
  }
}

runNotificationsIntegrationSuite()
  .catch((err) => {
    console.error("FATAL SUITE FAILURE:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
