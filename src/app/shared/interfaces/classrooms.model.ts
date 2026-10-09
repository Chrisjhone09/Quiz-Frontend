import { QuizModel } from "../../features/student/interfaces/quiz.model";

export interface ClassroomModel {
    id: string;
    classroomTitle : string;
    instructor?: string;
    numberOfStudents: number;
    description: string;
    classCode: string;
    quizzes?: QuizModel[];

    /** Whether joining needs the instructor's approval. */
    requiresApproval?: boolean;

    /** The signed-in student's own enrolment state. Absent for instructors. */
    enrollmentStatus?: 'Pending' | 'Approved' | 'Rejected' | string | null;

    /** Pending enrolment requests. Present for instructors only. */
    pendingRequestCount?: number | null;

    /** Whether the owning instructor has archived (hidden from their own dashboard)
     * this classroom. Students are unaffected either way. Only ever set on the
     * classroom-detail response. */
    isArchived?: boolean;

    leaveClassroom? : () => void;
    updateClassroom? : () => void;
    deleteClassroom?: () => void;
}
