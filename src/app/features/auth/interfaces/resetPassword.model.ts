export interface ResetPasswordModel {
    email: string;
    code: string;
    newPassword: string;
    confirmNewPassword: string;
}
