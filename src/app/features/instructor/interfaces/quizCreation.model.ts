export interface QuizCreationModel {
    title: string;
    description: string;
    classroomTitle: string;
    difficulty: string;
    questionType: string;
    types: string[];
    validUntil: string;
    openAt: string;
    openDate: string;
    openTime: string;
    closeDate: string;
    closeTime: string;
    expiresAt: string;
    scheduleEnabled: boolean;
    scheduledOpeningEnabled: boolean;
    notifyStudents: boolean;
    autoReleaseScore: boolean;
    numberOfQuestions: number;
    instructorId?: string;
    timeLimit: number;
    passingScore: number
}
