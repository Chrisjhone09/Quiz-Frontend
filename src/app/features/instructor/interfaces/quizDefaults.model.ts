export interface QuizDefaultsModel {
  timeLimit: number;
  passingScore: number;
  notifyStudents: boolean;
  autoReleaseScore: boolean;
}

export const DEFAULT_QUIZ_DEFAULTS: QuizDefaultsModel = {
  timeLimit: 60,
  passingScore: 80,
  notifyStudents: true,
  autoReleaseScore: true,
};
