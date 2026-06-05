export interface QuizActivityModel {
    quizTitle: string;
    classroomTitle: string;
    dateSubmitted: string;
    score: string;
    status: 'failed' | 'passed',
    rate: number;
}