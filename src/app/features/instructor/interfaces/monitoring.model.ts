export interface MonitoringDashboard {
  classroomId: string;
  selectedQuizId?: number | null;
  quizzes: MonitoringQuiz[];
  students: MonitoringStudent[];
  eventFeed: MonitoringLog[];
}

export interface MonitoringQuiz {
  id: number;
  title: string;
  status: string;
}

export interface MonitoringStudent {
  studentId: string;
  attemptId?: number | null;
  studentNumber: string;
  fullName: string;
  section: string;
  status: 'Not started' | 'Taking' | 'Submitted' | string;
  score?: number | null;
  totalPoints: number;
  tabSwitchCount: number;
  submittedAt?: string | null;
  lastEventAt?: string | null;
  logs: MonitoringLog[];
}

export interface MonitoringLog {
  id: string;
  attemptId: number;
  studentId: string;
  quizId: number;
  studentName: string;
  action: string;
  timeStamp: string;
}

export interface MonitoringActionPayload {
  studentId: string;
  quizId: number;
  message?: string;
}
