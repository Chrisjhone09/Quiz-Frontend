/** One student who has acknowledged an announcement — only present on the instructor's view. */
export interface AnnouncementAcknowledger {
  studentId: string;
  fullName: string;
  acknowledgedAt: string;
}

export interface Announcement {
  id: string;
  classroomId: string;
  content: string;
  createdAt: string;

  /** The posting instructor's display name — shown instead of a title, alongside their initials avatar. */
  postedByName: string;

  /** Approved students in the classroom as of this fetch — the denominator for "12 of 20 acknowledged". */
  totalStudentCount: number;
  acknowledgedCount: number;

  /** Full read-receipt roster. Only populated for the instructor's own view. */
  acknowledgedBy?: AnnouncementAcknowledger[] | null;

  /** Whether the signed-in student has acknowledged it. Only populated for a student's view. */
  acknowledgedByMe?: boolean | null;
}

export interface CreateAnnouncementPayload {
  content: string;
}
