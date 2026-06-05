export interface QuizCreationModel {
    title: string;
    description: string;
    types: string[];
    validUntil: string;
    openAt: string;
    autoReleaseScore: boolean;
    instructorId: string;
}