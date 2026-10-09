export type QuestionType = 'multiple_choice' | 'short_answer' | 'true_false';
export interface QuestionTypeAllocation {
    type: QuestionType;
    count: number | null;
}

export interface QuizCreationModel {
    title: string;
    description: string;
    classroomTitle: string;
    /** The id of the classroom the quiz is created in — this is what the backend actually
     * needs; classroomTitle above is display text only. */
    classroomId: string;
    difficulty: string;
    questionType: string;
    types: string[];
    questionTypeCounts?: Partial<Record<QuestionType, number>>;
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
    openDate?: string | null;
    closeDate?: string | null;
    openTime?: string | null;
    closeTime?: string | null;
    createdAt: string;
    autoReleaseResults: boolean;
    isLocked: boolean;
    isPublished: boolean;
    difficulty?: string;
    questionType?: string;
    numberOfQuestions?: number;
    timeLimit?: number;
    passingScore?: number;
    notifyStudents?: boolean;
    classroomId?: string | null;
    questions: QuizQuestionModel[];
}

export interface ApiResult<T> {
    success: boolean;
    message: string;
    data: T;
}
