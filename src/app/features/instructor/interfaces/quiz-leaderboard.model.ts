/** One student's ranked row in a quiz's results leaderboard. */
export interface QuizLeaderboardRow {
  rank: number;
  studentId: string;
  fullName: string;
  studentNumber: string;
  section: string;
  score: number;
  totalPoints: number;
  percentage: number;

  /** Percentage minus the class average — positive means above average. */
  deltaFromAverage: number;

  passed: boolean;
  submittedAt: string | null;

  /** Null for attempts started before time tracking was added — show "—", not a guess. */
  timeTakenSeconds: number | null;
}

/** Instructor-facing, per-quiz ranking of every student who has submitted — highest
 * score first. */
export interface QuizLeaderboard {
  quizId: number;
  quizTitle: string;
  classroomId: string;
  totalPoints: number;
  passingScore: number;
  enrolledCount: number;
  submittedCount: number;
  classAveragePercentage: number | null;
  rows: QuizLeaderboardRow[];
  itemAnalysis: QuizItemAnalysis[];
}

export interface QuizItemAnalysis {
  questionId: number;
  itemNumber: number;
  text: string;
  questionType: string;
  points: number;
  correctCount: number;
  incorrectCount: number;
  unansweredCount: number;
  correctPercentage: number | null;
}
