export interface ClassroomRosterRow {
  rowNumber: number;
  studentNumber: string;
  fullName?: string | null;
  status: string;
  message: string;
}

export interface ClassroomRosterImport {
  rows: ClassroomRosterRow[];
  imported: boolean;
  canImport: boolean;
  readyCount: number;
  enrolledCount: number;
  alreadyEnrolledCount: number;
  waitingCount: number;
  skippedCount: number;
  numberOfStudents: number;
  pendingRequestCount: number;
}

export interface PendingRosterEntry { studentNumber: string; addedAt: string; }
