export interface QuizModel {
    id: number;
    quizTitle: string;
    classroomTitle?: string;
    numberOfQuestions: number;
    dueDate: string;
    duration: number; 
    status: string;
    averageScore? : number;
    submissions: number;
    publishDate: string;
    takeQuiz? : () => void;
}