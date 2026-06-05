import { QuizModel } from "../../features/student/interfaces/quiz.model";

export interface ClassroomModel {
    id: string;
    classroomTitle : string;
    instructor?: string;
    numberOfStudents: number;
    description: string;
    classCode: string;
    quizzes?: QuizModel[];
    leaveClassroom? : () => void;
    updateClassroom? : () => void;
    deleteClassroom?: () => void;
}