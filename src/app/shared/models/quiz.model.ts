export interface QuizModel {
    title: string;
    numberOfQuestions: number;
    duration: number; // in minutes
    dueDate: Date;
    score?: number; // Optional, can be added after quiz completion
    status: 'completed' | 'overdue' | 'upcoming' | 'available';
}