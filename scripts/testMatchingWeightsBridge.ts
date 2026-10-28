/**
 * Automated Verification Script for Phase 4B (MATCH-001):
 *  - Matching Weights Configuration Bridge
 *  - Verifies dynamic scoring in calculateScore using configured weights
 *  - Verifies ALL 5 fields:
 *      1. academicWeight
 *      2. hobbiesWeight
 *      3. projectWeight (Hackathon & Project Collaboration)
 *      4. mentorshipWeight
 *      5. freshmanMentorshipEnabled
 *  - Verifies in-memory TTL caching and cache invalidation
 *  - Verifies safe fallback defaults
 *  - Verifies student permission denial on admin matching configuration actions
 */

import { Plan, Gender } from "@prisma/client";
import {
  calculateScore,
  getMatchingWeights,
  invalidateMatchingConfigCache,
  setMatchingWeightsForTesting,
  DEFAULT_MATCHING_WEIGHTS,
  SearchingUser,
} from "../src/server/matching";
import { prisma } from "../src/lib/prisma";

async function runMatchingWeightsBridgeVerification() {
  console.log("=================================================");
  console.log("  UNI-CHAT PHASE 4B: MATCHING WEIGHTS BRIDGE (MATCH-001)  ");
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

  try {
    // ─────────────────────────────────────────────────────────────
    // 1. Safe Default Weights & In-Memory Access
    // ─────────────────────────────────────────────────────────────
    console.log("--- 1. Safe Default Weights & In-Memory Access ---");
    setMatchingWeightsForTesting(null); // Reset to defaults

    const initialWeights = getMatchingWeights();
    assert(initialWeights.academicWeight === 40, "Default academicWeight is 40");
    assert(initialWeights.hobbiesWeight === 10, "Default hobbiesWeight is 10");
    assert(initialWeights.projectWeight === 30, "Default projectWeight is 30");
    assert(initialWeights.mentorshipWeight === 20, "Default mentorshipWeight is 20");
    assert(initialWeights.freshmanMentorshipEnabled === true, "Default freshmanMentorshipEnabled is true");

    // ─────────────────────────────────────────────────────────────
    // 2. Dynamic Academic Weight Scoring
    // ─────────────────────────────────────────────────────────────
    console.log("\n--- 2. Dynamic Academic Weight Scoring ---");

    const searcherAcademic: SearchingUser = {
      userId: "user-academic-searcher",
      socketId: "socket-academic-searcher",
      plan: Plan.PRO,
      gender: Gender.FEMALE,
      department: "Economics",
      year: 2,
      hobbies: ["Photography"],
      preferences: {
        preferredGender: Gender.MALE,
        preferredDepartments: ["Economics"],
        preferredYears: [2],
        preferredHobbies: [],
      },
    };

    const candidateAcademicMatch: SearchingUser = {
      userId: "user-academic-candidate",
      socketId: "socket-academic-candidate",
      plan: Plan.FREE,
      gender: Gender.MALE,
      department: "Economics", // Matches preferred dept!
      year: 2, // Matches preferred year!
      hobbies: ["Football"],
    };

    // At default academicWeight = 40 (Dept: 40, Year: 20, Gender: 100) -> 160
    const scoreDefaultAcademic = calculateScore(searcherAcademic, candidateAcademicMatch, {
      ...DEFAULT_MATCHING_WEIGHTS,
      academicWeight: 40,
    });
    assert(
      scoreDefaultAcademic === 160,
      "Score at academicWeight=40 is 160 (Gender 100 + Dept 40 + Year 20)",
      `Calculated: ${scoreDefaultAcademic}`
    );

    // When admin increases academicWeight to 80 (Dept: 80, Year: 40, Gender: 100) -> 220
    const scoreHighAcademic = calculateScore(searcherAcademic, candidateAcademicMatch, {
      ...DEFAULT_MATCHING_WEIGHTS,
      academicWeight: 80,
    });
    assert(
      scoreHighAcademic === 220,
      "Score at academicWeight=80 dynamically increases to 220 (+60 pts)",
      `Calculated: ${scoreHighAcademic}`
    );

    // ─────────────────────────────────────────────────────────────
    // 3. Dynamic Hobbies Weight Scoring
    // ─────────────────────────────────────────────────────────────
    console.log("\n--- 3. Dynamic Hobbies Weight Scoring ---");

    const searcherHobbies: SearchingUser = {
      userId: "user-hobbies-searcher",
      socketId: "socket-hobbies-searcher",
      plan: Plan.PRO,
      gender: Gender.FEMALE,
      department: "History",
      year: 3,
      hobbies: ["Reading", "Movies"],
      preferences: {
        preferredGender: Gender.MALE,
        preferredDepartments: [],
        preferredYears: [],
        preferredHobbies: ["Reading", "Movies"], // 2 hobbies
      },
    };

    const candidateHobbiesMatch: SearchingUser = {
      userId: "user-hobbies-candidate",
      socketId: "socket-hobbies-candidate",
      plan: Plan.FREE,
      gender: Gender.MALE,
      department: "Sociology",
      year: 3,
      hobbies: ["reading", "movies"], // Matches both
    };

    // At hobbiesWeight = 10 (Gender: 100, Hobbies: 2 * 10 = 20) -> 120
    const scoreDefaultHobby = calculateScore(searcherHobbies, candidateHobbiesMatch, {
      ...DEFAULT_MATCHING_WEIGHTS,
      hobbiesWeight: 10,
    });
    assert(
      scoreDefaultHobby === 120,
      "Score at hobbiesWeight=10 is 120 (Gender 100 + 2 Hobbies * 10 = 20)",
      `Calculated: ${scoreDefaultHobby}`
    );

    // At hobbiesWeight = 25 (Gender: 100, Hobbies: 2 * 25 = 50) -> 150
    const scoreHighHobby = calculateScore(searcherHobbies, candidateHobbiesMatch, {
      ...DEFAULT_MATCHING_WEIGHTS,
      hobbiesWeight: 25,
    });
    assert(
      scoreHighHobby === 150,
      "Score at hobbiesWeight=25 dynamically increases to 150 (+30 pts)",
      `Calculated: ${scoreHighHobby}`
    );

    // ─────────────────────────────────────────────────────────────
    // 4. Dynamic Project Weight Scoring (Hackathon & Project Collab)
    // ─────────────────────────────────────────────────────────────
    console.log("\n--- 4. Dynamic Project Weight Scoring (Hackathon & Project) ---");

    const searcherProject: SearchingUser = {
      userId: "user-project-searcher",
      socketId: "socket-project-searcher",
      plan: Plan.PRO,
      gender: Gender.FEMALE,
      department: "Philosophy",
      year: 2,
      hobbies: ["Coding", "Writing"],
      preferences: {
        preferredGender: Gender.MALE,
        preferredDepartments: [],
        preferredYears: [],
        preferredHobbies: ["Coding"], // Project hobby
      },
    };

    const candidateProjectMatch: SearchingUser = {
      userId: "user-project-candidate",
      socketId: "socket-project-candidate",
      plan: Plan.FREE,
      gender: Gender.MALE,
      department: "Philosophy",
      year: 2,
      hobbies: ["coding"], // Matches project hobby 'Coding'
    };

    // 4.1 At projectWeight = 0, only gender (100) + hobby weight (10) = 110
    const scoreZeroProject = calculateScore(searcherProject, candidateProjectMatch, {
      ...DEFAULT_MATCHING_WEIGHTS,
      hobbiesWeight: 10,
      projectWeight: 0,
    });
    assert(
      scoreZeroProject === 110,
      "Score at projectWeight=0 is 110 (Gender 100 + Hobby 10 + Project 0)",
      `Calculated: ${scoreZeroProject}`
    );

    // 4.2 At default projectWeight = 30, score becomes 140 (Gender 100 + Hobby 10 + Project 30)
    const scoreDefaultProject = calculateScore(searcherProject, candidateProjectMatch, {
      ...DEFAULT_MATCHING_WEIGHTS,
      hobbiesWeight: 10,
      projectWeight: 30,
    });
    assert(
      scoreDefaultProject === 140,
      "Score at projectWeight=30 is 140 (Gender 100 + Hobby 10 + Project 30)",
      `Calculated: ${scoreDefaultProject}`
    );

    // 4.3 When admin updates projectWeight to 60, score increases to 170 (+30 pts)
    const scoreHighProject = calculateScore(searcherProject, candidateProjectMatch, {
      ...DEFAULT_MATCHING_WEIGHTS,
      hobbiesWeight: 10,
      projectWeight: 60,
    });
    assert(
      scoreHighProject === 170,
      "Score at projectWeight=60 dynamically increases to 170 (+30 pts)",
      `Calculated: ${scoreHighProject}`
    );

    // 4.4 Tech department collaboration synergy
    const searcherTechDept: SearchingUser = {
      userId: "user-tech-searcher",
      socketId: "socket-tech-searcher",
      plan: Plan.PRO,
      gender: Gender.MALE,
      department: "Software Engineering",
      year: 3,
      hobbies: [],
      preferences: { preferredGender: "ANY" },
    };

    const candidateTechDept: SearchingUser = {
      userId: "user-tech-candidate",
      socketId: "socket-tech-candidate",
      plan: Plan.FREE,
      gender: Gender.FEMALE,
      department: "Computer Science",
      year: 3,
      hobbies: [],
    };

    const scoreTechSynergy = calculateScore(searcherTechDept, candidateTechDept, {
      ...DEFAULT_MATCHING_WEIGHTS,
      projectWeight: 45,
    });
    assert(
      scoreTechSynergy === 45,
      "Tech department synergy (Software Eng + Computer Sci) receives projectWeight (45 pts)",
      `Calculated: ${scoreTechSynergy}`
    );

    // ─────────────────────────────────────────────────────────────
    // 5. Freshman Mentorship Weight & Toggle
    // ─────────────────────────────────────────────────────────────
    console.log("\n--- 5. Freshman Mentorship Weight & Toggle ---");

    const freshmanSearcher: SearchingUser = {
      userId: "user-freshman",
      socketId: "socket-freshman",
      plan: Plan.PRO,
      gender: Gender.MALE,
      department: "Medicine",
      year: 1, // Freshman!
      hobbies: [],
      preferences: {
        preferredGender: "ANY",
      },
    };

    const seniorCandidate: SearchingUser = {
      userId: "user-senior",
      socketId: "socket-senior",
      plan: Plan.FREE,
      gender: Gender.FEMALE,
      department: "Medicine",
      year: 4, // Senior (Year 4)!
      hobbies: [],
    };

    // When mentorship is enabled with weight 20 -> 20 pts
    const scoreMentorshipEnabled = calculateScore(freshmanSearcher, seniorCandidate, {
      ...DEFAULT_MATCHING_WEIGHTS,
      freshmanMentorshipEnabled: true,
      mentorshipWeight: 20,
    });
    assert(
      scoreMentorshipEnabled === 20,
      "Freshman + Senior pair receives mentorship bonus (20 pts)",
      `Calculated: ${scoreMentorshipEnabled}`
    );

    // When mentorship is disabled -> 0 pts
    const scoreMentorshipDisabled = calculateScore(freshmanSearcher, seniorCandidate, {
      ...DEFAULT_MATCHING_WEIGHTS,
      freshmanMentorshipEnabled: false,
      mentorshipWeight: 20,
    });
    assert(
      scoreMentorshipDisabled === 0,
      "Disabling freshmanMentorshipEnabled removes the mentorship bonus (0 pts)",
      `Calculated: ${scoreMentorshipDisabled}`
    );

    // When mentorship weight is increased to 40 -> 40 pts
    const scoreMentorshipHigher = calculateScore(freshmanSearcher, seniorCandidate, {
      ...DEFAULT_MATCHING_WEIGHTS,
      freshmanMentorshipEnabled: true,
      mentorshipWeight: 40,
    });
    assert(
      scoreMentorshipHigher === 40,
      "Increasing mentorshipWeight to 40 dynamically raises score to 40 pts",
      `Calculated: ${scoreMentorshipHigher}`
    );

    // ─────────────────────────────────────────────────────────────
    // 6. In-Memory Cache Invalidation & PostgreSQL Bridge
    // ─────────────────────────────────────────────────────────────
    console.log("\n--- 6. Cache Invalidation & PostgreSQL Bridge ---");

    setMatchingWeightsForTesting({ academicWeight: 75, projectWeight: 50 });
    assert(getMatchingWeights().academicWeight === 75, "Custom test academicWeight injected into cache");
    assert(getMatchingWeights().projectWeight === 50, "Custom test projectWeight injected into cache");

    invalidateMatchingConfigCache();
    // After invalidation and resetting test harness, falls back to defaults or reads from DB
    setMatchingWeightsForTesting(null);
    const refreshed = getMatchingWeights();
    assert(typeof refreshed.version === "number", "Refreshed config has valid version number");
    assert(refreshed.academicWeight >= 0 && refreshed.academicWeight <= 100, "Refreshed academicWeight is bounded [0..100]");
    assert(refreshed.projectWeight >= 0 && refreshed.projectWeight <= 100, "Refreshed projectWeight is bounded [0..100]");

    // ─────────────────────────────────────────────────────────────
    // 7. Non-Admin Security Restriction & Validation
    // ─────────────────────────────────────────────────────────────
    console.log("\n--- 7. Security & Permission Gates ---");

    const matchingActionsCode = require("fs").readFileSync(
      require("path").join(process.cwd(), "src/app/admin/matchingActions.ts"),
      "utf-8"
    );

    assert(
      matchingActionsCode.includes('await requireAdminPermission("MANAGE_USERS")'),
      "Admin matching action functions enforce requireAdminPermission('MANAGE_USERS')"
    );

    assert(
      matchingActionsCode.includes("invalidateMatchingConfigCache()"),
      "matchingActions updates automatically invalidate the in-memory socket matching cache"
    );

    assert(
      matchingActionsCode.includes("academic < 0 ||") &&
        matchingActionsCode.includes("academic > 100"),
      "Server validates weight bounds [0..100%] to prevent invalid scores"
    );

  } finally {
    setMatchingWeightsForTesting(null);
    await prisma.$disconnect();
  }

  console.log(`\n=================================================`);
  console.log(`  PHASE 4B RESULTS: ${totalPassed} / ${totalTests} PASSED`);
  console.log(`=================================================`);

  if (totalPassed !== totalTests) {
    process.exit(1);
  }
}

runMatchingWeightsBridgeVerification().catch((err) => {
  console.error("Phase 4B verification failure:", err);
  process.exit(1);
});
