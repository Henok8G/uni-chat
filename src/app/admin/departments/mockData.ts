import { EntityMetrics, EntityDetail } from "./types";

export const MOCK_ENTITY_METRICS: EntityMetrics = {
  registeredEntities: 28,
  academicDepts: 18,
  adminOffices: 10,
  verifiedFaculty: 142,
  sisValidationRate: 99.2,
  authorizedDelegates: 58,
  officialBroadcasts: 34,
  averageStudentReach: 94.8
};

export const MOCK_ENTITIES: EntityDetail[] = [
  {
    id: "dept-1",
    name: "Department of Computer Science (CNCS)",
    campus: "4 Kilo Campus",
    code: "AAU-DEPT-CNCS-04",
    status: "Active & Publishing Enabled",
    collegeAffiliation:
      "College of Natural & Computational Sciences - Departmental Hub & Laboratory Network",
    studentsEnrolled: 1840,
    verifiedFacultyCount: 8,
    delegatesCount: 3,
    primaryDelegateName: "Dr. Alan Turing",
    lastAnnouncement: {
      title: "New AI Research Lab Intake",
      timeAgo: "2h ago"
    },
    category: "ACADEMIC",
    iconType: "code",
    foundingYear: 1993,
    sisSyncStatus: "Live Sync (Hourly)",
    authorizedDelegates: [
      {
        id: "del-1",
        name: "Dr. Alan Turing",
        role: "Faculty Chair",
        badge: "Full Clearance",
        avatarInitials: "AT"
      },
      {
        id: "del-2",
        name: "Dr. Almaz Kebede",
        role: "Assoc. Professor",
        badge: "Announce",
        avatarInitials: "AK"
      },
      {
        id: "del-3",
        name: "Aster Mengistu",
        role: "Academic Secretary",
        badge: "Draft Only",
        avatarInitials: "AM"
      }
    ],
    clearances: {
      emergencyBroadcasts: true,
      pinnedFeedNoPreMod: true,
      studentDirectQA: true
    },
    broadcastHistory: [
      {
        id: "bc-1",
        title: "Opening of New AI Research Lab Intake",
        readRate: "91.4% Read",
        publishedAt: "Published 2h ago",
        publishedBy: "Dr. Alan Turing"
      },
      {
        id: "bc-2",
        title: "Midterm Add/Drop Schedule Notice",
        readRate: "88.0% Read",
        publishedAt: "Published 3d ago",
        publishedBy: "Dr. Almaz Kebede"
      }
    ]
  },
  {
    id: "dept-2",
    name: "Office of the University Registrar (SIS)",
    campus: "Main Campus (Sidist Kilo)",
    code: "AAU-ADM-REG-01",
    status: "Direct Feed Authority",
    collegeAffiliation:
      "Central Administrative Unit - Official Student Records, Transcripts & Academic Scheduling",
    scope: "All Campuses",
    verifiedOfficersCount: 11,
    delegatesCount: 4,
    urgentPriority: "High Tier (Level 1)",
    lastAnnouncement: {
      title: "Semester 1 Final Add/Drop Deadline",
      timeAgo: "Yesterday"
    },
    category: "ADMIN",
    iconType: "document",
    foundingYear: 1950,
    sisSyncStatus: "Real-time Bi-directional",
    authorizedDelegates: [
      {
        id: "del-4",
        name: "Dr. Birhanu Nega",
        role: "Chief Registrar",
        badge: "Full Clearance",
        avatarInitials: "BN"
      },
      {
        id: "del-5",
        name: "Selamawit Bekele",
        role: "Head of Records",
        badge: "Announce",
        avatarInitials: "SB"
      }
    ],
    clearances: {
      emergencyBroadcasts: true,
      pinnedFeedNoPreMod: true,
      studentDirectQA: false
    },
    broadcastHistory: [
      {
        id: "bc-3",
        title: "Undergraduate SIS Portal Clearance Deadlines",
        readRate: "98.2% Read",
        publishedAt: "Published 1d ago",
        publishedBy: "Dr. Birhanu Nega"
      }
    ]
  },
  {
    id: "dept-3",
    name: "Addis Ababa Institute of Technology (AAiT)",
    campus: "5 Kilo Campus",
    code: "AAU-INST-AAIT-02",
    status: "Active & Publishing Enabled",
    collegeAffiliation:
      "School of Electrical & Computer Engineering, Mechanical, Civil & Biomedical Engineering",
    studentsEnrolled: 5420,
    verifiedFacultyCount: 14,
    delegatesCount: 6,
    deanContact: "Dr. Bikila Teklu",
    lastAnnouncement: {
      title: "Robotics & AI Lab Access Schedule",
      timeAgo: "3 days ago"
    },
    category: "ACADEMIC",
    iconType: "cpu",
    foundingYear: 1953,
    sisSyncStatus: "Live Sync (Hourly)",
    authorizedDelegates: [
      {
        id: "del-6",
        name: "Dr. Bikila Teklu",
        role: "Institute Dean",
        badge: "Full Clearance",
        avatarInitials: "BT"
      },
      {
        id: "del-7",
        name: "Eng. Henok Tadesse",
        role: "Lab Director",
        badge: "Announce",
        avatarInitials: "HT"
      }
    ],
    clearances: {
      emergencyBroadcasts: true,
      pinnedFeedNoPreMod: true,
      studentDirectQA: true
    },
    broadcastHistory: [
      {
        id: "bc-4",
        title: "5 Kilo Engineering Workshops Safety Re-certification",
        readRate: "94.1% Read",
        publishedAt: "Published 3d ago",
        publishedBy: "Dr. Bikila Teklu"
      }
    ]
  },
  {
    id: "dept-4",
    name: "AAU Central Library & Digital Repositories",
    campus: "Sidist Kilo (Main)",
    code: "AAU-SVC-LIB-07",
    status: "Active · Service Unit",
    collegeAffiliation:
      "Kennedy Library - Digital IEEE Access, Physical Archives & Quiet Study Reservations",
    branchesCount: 6,
    headLibrarian: "W/ro Rahel Solomon",
    delegatesCount: 2,
    eDatabaseLink: "Connected (EZProxy)",
    lastAnnouncement: {
      title: "Extended Midnight Study Hours for Finals",
      timeAgo: "5 days ago"
    },
    category: "ADMIN",
    iconType: "library",
    foundingYear: 1969,
    sisSyncStatus: "Daily Nightly Batch",
    authorizedDelegates: [
      {
        id: "del-8",
        name: "Rahel Solomon",
        role: "Chief University Librarian",
        badge: "Announce",
        avatarInitials: "RS"
      }
    ],
    clearances: {
      emergencyBroadcasts: false,
      pinnedFeedNoPreMod: false,
      studentDirectQA: true
    },
    broadcastHistory: [
      {
        id: "bc-5",
        title: "IEEE Xplore & Springer Digital Access Restored Campus-wide",
        readRate: "89.5% Read",
        publishedAt: "Published 5d ago",
        publishedBy: "Rahel Solomon"
      }
    ]
  },
  {
    id: "dept-5",
    name: "School of Medicine & Health Sciences",
    campus: "Tikur Anbessa (Black Lion)",
    code: "AAU-COL-CHMS-03",
    status: "Active",
    collegeAffiliation:
      "Tikur Anbessa Specialized Hospital - Clinical Rotations & Medical Sciences Division",
    studentsEnrolled: 2310,
    verifiedFacultyCount: 9,
    delegatesCount: 3,
    clinicalCoordinator: "Dr. Senait Beyene",
    lastAnnouncement: {
      title: "Clinical Roster Updates for 4th Year Interns",
      timeAgo: "1w ago"
    },
    category: "ACADEMIC",
    iconType: "health",
    foundingYear: 1964,
    sisSyncStatus: "Live Sync (Hourly)",
    authorizedDelegates: [
      {
        id: "del-9",
        name: "Dr. Senait Beyene",
        role: "Clinical Director",
        badge: "Full Clearance",
        avatarInitials: "SB"
      }
    ],
    clearances: {
      emergencyBroadcasts: true,
      pinnedFeedNoPreMod: true,
      studentDirectQA: true
    },
    broadcastHistory: [
      {
        id: "bc-6",
        title: "Pediatric Ward Clinical Shift Allocations",
        readRate: "96.4% Read",
        publishedAt: "Published 1w ago",
        publishedBy: "Dr. Senait Beyene"
      }
    ]
  },
  {
    id: "dept-6",
    name: "Dean of Students & Campus Affairs",
    campus: "Sidist Kilo",
    code: "AAU-GOV-DSA-05",
    status: "Governance Unit",
    collegeAffiliation:
      "University Dormitories, Student Union Coordination, Welfare & Inter-campus Shuttle",
    scope: "Campus-Wide",
    studentUnionsCount: 12,
    publishingClearance: "Broadcast L2",
    deanName: "Ato Tadesse Worku",
    delegatesCount: 4,
    lastAnnouncement: {
      title: "Inter-Campus Evening Shuttle Timetable Change",
      timeAgo: "2d ago"
    },
    category: "ADMIN",
    iconType: "users",
    foundingYear: 1974,
    sisSyncStatus: "Live Sync (Hourly)",
    authorizedDelegates: [
      {
        id: "del-10",
        name: "Ato Tadesse Worku",
        role: "Dean of Student Affairs",
        badge: "Full Clearance",
        avatarInitials: "TW"
      }
    ],
    clearances: {
      emergencyBroadcasts: true,
      pinnedFeedNoPreMod: true,
      studentDirectQA: true
    },
    broadcastHistory: [
      {
        id: "bc-7",
        title: "Inter-Campus Shuttle Route Optimization for Evening Classes",
        readRate: "93.8% Read",
        publishedAt: "Published 2d ago",
        publishedBy: "Ato Tadesse Worku"
      }
    ]
  }
];
