export interface ResetPasswordModel {
    email: string;
    newPassword: string;
    confirmNewPassword: string;
    token: string;
}