export interface InstructorProfileModel {
  firstName: string;
  middleName?: string | null;
  lastName: string;
  /** Display-only — changing the login email would need re-verification, which isn't
   * wired up yet, so the Settings page shows it but doesn't let you edit it. */
  email: string;
}

export interface UpdateInstructorProfileModel {
  firstName: string;
  middleName?: string | null;
  lastName: string;
}

export interface ChangePasswordModel {
  currentPassword: string;
  newPassword: string;
}
