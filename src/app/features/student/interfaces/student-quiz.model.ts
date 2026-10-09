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

  // Null when the instructor has not released results — the percentage would
  // otherwise give the withheld score away.
  correctCount?: number | null;
  totalQuestions: number;
  percentage?: number | null;
  passed?: boolean | null;
  passingScore: number;
}

export interface QuizResultQuestion {
  id: number;
  text: string;
  questionType: string;
  points: number;
  isCorrect: boolean;
  yourAnswer?: string | null;
  yourChoiceId?: number | null;
  correctAnswer?: string | null;
  correctChoiceId?: number | null;
  choices: StudentQuizChoice[];
}

export interface QuizResult {
  quizId: number;
  attemptId: number;
  title: string;
  description?: string | null;
  score: number;
  totalPoints: number;
  correctCount: number;
  totalQuestions: number;
  percentage: number;
  passed: boolean;
  passingScore: number;
  submittedAt?: string | null;
  questions: QuizResultQuestion[];
}
