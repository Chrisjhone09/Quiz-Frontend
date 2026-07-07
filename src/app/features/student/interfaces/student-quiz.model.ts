export interface ApiResult<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface StudentQuizChoice {
  id: number;
  text: string;
}

export interface StudentQuizQuestion {
  id: number;
  text: string;
  points: number;
  questionType: string;
  choices: StudentQuizChoice[];
}

export interface StudentQuiz {
  id: number;
  title: string;
  description?: string | null;
  due?: string | null;
  timeLimit: number;
  autoReleaseResults: boolean;
  questions: StudentQuizQuestion[];
}

export interface StudentQuizAnswer {
  questionId: number;
  answer?: string | null;
  choiceId?: number | null;
}

export interface QuizSubmission {
  studentId: string;
  quizId: number;
  answers: StudentQuizAnswer[];
}

export interface QuizSubmissionResult {
  attemptId: number;
  score?: number | null;
  totalPoints: number;
  scoreReleased: boolean;
  submittedAt?: string | null;
}
