export type RegisterRole = 'Student' | 'Instructor';

export interface RegisterModel {
    role: RegisterRole;
    fname: string;
    lname: string;
    email: string;
    password: string;
    confirmPassword: string;
    studentId: string;
    section: string;
    middleName: string;
}
