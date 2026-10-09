export interface RegisterDto {
    role: string;
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    /** Student registrations only — the API ignores these for instructors. */
    studentId: string | null;
    section: string | null;
    middleName: string | null;
}
