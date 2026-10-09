export interface ClassroomCreationModel {
    classroomTitle: string;
    description: string;
    /** When true, students who enter the class code wait for the instructor's approval. */
    requiresApproval: boolean;
}
