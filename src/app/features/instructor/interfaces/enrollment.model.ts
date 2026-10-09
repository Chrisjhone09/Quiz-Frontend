export type EnrollmentStatus = 'Pending' | 'Approved' | 'Rejected';

export interface EnrollmentRequest {
  studentId: string;
  classroomId: string;
  fullName: string;
  studentNumber: string;
  section: string;
  status: EnrollmentStatus | string;
  requestedAt?: string | null;
  decisionAt?: string | null;
}

export interface EnrollmentQueue {
  classroomId: string;
  requiresApproval: boolean;
  pending: EnrollmentRequest[];
  decided: EnrollmentRequest[];
}

export interface EnrollmentDecisionPayload {
  classroomId: string;
  studentId: string;
}
