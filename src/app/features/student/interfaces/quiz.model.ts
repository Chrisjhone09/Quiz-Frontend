export interface QuizModel {
    id: number;
    quizTitle: string;
    classroomTitle?: string;
    numberOfQuestions: number;
    dueDate: string;
    duration: number; 
    status: string;
    openDate?: string | null;
    closeDate?: string | null;
    openTime?: string | null;
    closeTime?: string | null;
    score?: number | null;
    totalPoints?: number | null;
    autoReleaseResults?: boolean;
    averageScore? : number;
    submissions: number;
    publishDate: string;
    takeQuiz? : () => void;
}
