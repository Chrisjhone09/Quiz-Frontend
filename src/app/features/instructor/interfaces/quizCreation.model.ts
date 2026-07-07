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

export interface QuizChoiceModel {
    id: number;
    text: string;
}

export interface QuizQuestionModel {
    id: number;
    text: string;
    points: number;
    questionType: string;
    correctAnswer?: string | null;
    correctChoiceId?: number | null;
    choices: QuizChoiceModel[];
}

export interface QuizResponseModel {
    id: number;
    title: string;
    description?: string | null;
    openDate: string;
    closeDate: string;
    openTime: string;
    closeTime: string;
    createdAt: string;
    autoReleaseResults: boolean;
    isLocked: boolean;
    isPublished: boolean;
    classroomId?: string | null;
    questions: QuizQuestionModel[];
}

export interface ApiResult<T> {
    success: boolean;
    message: string;
    data: T;
}
