export interface LoginResponse {
    token: string;
    endpoint: string;
    user: User;
}

export interface User {
    userId: string;
    username:string;
    userRole?: string;
}