
export interface IUser {
  name: string;
  email: string;
  password: string;
  salarioMensal?: number;
  tokenVersion?: number;

  resetPasswordToken?: string | undefined;
  resetPasswordExpires?: Date | undefined;
}
