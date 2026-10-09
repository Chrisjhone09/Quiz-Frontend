export type ApprovalStatus = 'Pending' | 'Approved' | 'Rejected' | 'Deleted';

export interface AccountRequest {
  userId: string;
  email: string;
  fullName: string;
  role: string;
  status: ApprovalStatus | string;
  emailConfirmed: boolean;
  studentNumber?: string | null;
  section?: string | null;
  registeredAt?: string | null;
  decisionAt?: string | null;
  decidedByEmail?: string | null;
  rejectionReason?: string | null;
}

export interface AccountQueueStats {
  pendingCount: number;
  /** Retained for API compatibility; email verification is no longer required. */
  awaitingEmailVerificationCount: number;
  approvedCount: number;
  rejectedCount: number;
}

export interface AccountQueue {
  pending: AccountRequest[];
  decided: AccountRequest[];
  stats: AccountQueueStats;
}

export interface ApiResult<T> {
  success: boolean;
  message: string;
  data: T;
}

// ---- Reporting (spec flows 11.3 and 12.2) ----

export interface AdminReport {
  users: {
    total: number;
    students: number;
    instructors: number;
    admins: number;
    pendingApproval: number;
    rejected: number;
    unverified: number;
  };
  classrooms: {
    total: number;
    requiringApproval: number;
    pendingEnrollmentRequests: number;
    totalEnrollments: number;
  };
  quizzes: {
    total: number;
    published: number;
    drafts: number;
    totalQuestions: number;
  };
  attempts: {
    started: number;
    submitted: number;
    averageScorePercent: number;
    passRatePercent: number;
    tabSwitchEvents: number;
  };
  quizPerformance: QuizPerformance[];
}

export interface QuizPerformance {
  quizId: number;
  title: string;
  classroomTitle?: string | null;
  submissions: number;
  averageScorePercent: number;
  passRatePercent: number;
  passingScore: number;
}

export interface ActivityLogEntry {
  id: string;
  userEmail?: string | null;
  role?: string | null;
  category: string;
  action: string;
  detail?: string | null;
  success: boolean;
  timeStamp: string;
}

export interface ActivityFeed {
  entries: ActivityLogEntry[];
  page: number;
  pageSize: number;
  totalCount: number;
  categories: string[];
}

// ---- Instructor / student account management ----

export interface CreateInstructorPayload {
  firstName: string;
  middleName?: string | null;
  lastName: string;
  email: string;
  password: string;
}

export interface InstructorAdmin {
  id: string;
  userId: string;
  email: string;
  firstName: string;
  middleName?: string | null;
  lastName: string;
  status: ApprovalStatus | string;
  emailConfirmed: boolean;
  registeredAt?: string | null;
  classroomCount: number;
  roles: string[];
}

export interface UpdateInstructorPayload {
  firstName: string;
  middleName?: string | null;
  lastName: string;
  email: string;
}

export interface StudentAdmin {
  id: string;
  userId: string;
  email: string;
  firstName: string;
  middleName?: string | null;
  lastName: string;
  studentId: string;
  section: string;
  status: ApprovalStatus | string;
  emailConfirmed: boolean;
  registeredAt?: string | null;
  classroomCount: number;
  roles: string[];
}

export interface UpdateStudentPayload {
  firstName: string;
  middleName?: string | null;
  lastName: string;
  email: string;
  studentId: string;
  section: string;
}

// ---- Classroom overview ----

export interface ClassroomAdmin {
  id: string;
  title: string;
  description?: string | null;
  uniqueCode: string;
  requiresApproval: boolean;
  createdAt: string;
  instructorName: string;
  instructorEmail?: string | null;
  studentCount: number;
  pendingRequestCount: number;
  quizCount: number;
  publishedQuizCount: number;
}

// ---- Deleted classroom recovery ----
// A classroom an instructor deleted — nothing is actually removed server-side (the row,
// its quizzes, and its students all stay intact), so this is a recoverable view.

export interface DeletedClassroomAdmin {
  id: string;
  title: string;
  description?: string | null;
  uniqueCode: string;
  requiresApproval: boolean;
  createdAt: string;
  instructorName: string;
  instructorEmail?: string | null;
  studentCount: number;
  quizCount: number;
  deletedAt?: string | null;
  deletedByName?: string | null;
}

// ---- Role management ----
// An account can hold more than one role at once (e.g. Instructor + Admin).
// The payload sent to the API is the full desired role list, not a delta —
// the backend diffs it against what the account currently holds.

export const MANAGED_ROLES = ['Student', 'Instructor', 'Admin'] as const;

export interface UpdateUserRolesPayload {
  roles: string[];
  /** Required only when granting Student to an account with no Student profile yet. */
  studentId?: string | null;
  section?: string | null;
}

export interface UserRoles {
  userId: string;
  email: string;
  roles: string[];
}
