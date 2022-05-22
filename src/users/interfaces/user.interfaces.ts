/* eslint-disable prettier/prettier */
export interface RetrieveUserPayload {
  username?: string;
  phone?: string;
  email?: string;
}

export interface PasswordResetPayload {
  email: string;
  password: string;
}
