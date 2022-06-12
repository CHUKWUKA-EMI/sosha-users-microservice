/* eslint-disable prettier/prettier */
export interface RetrieveUserPayload {
  username?: string;
  phone?: string;
  email?: string;
}

export interface PasswordResetPayload {
  email: string;
}

export interface PasswordChange{
  accessToken: string;
  previousPassword: string;
  proposedPassword: string;
}
