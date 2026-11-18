
import mongoose, { Schema } from 'mongoose';

export interface IUser {
  createdAt?: Date;
  name: string;
  email: string;
  password: string;
  salarioMensal?: number;
  tokenVersion?: number;
  resetPasswordToken?: string | undefined;
  resetPasswordExpires?: Date | undefined;
}

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },

    password: {
      type: String,
      required: true
    },

    salarioMensal: {
      type: Number,
      min: 0
    },

    tokenVersion: {
      type: Number,
      default: 0
    },

    resetPasswordToken: {
      type: String,
      select: false
    },

    resetPasswordExpires: {
      type: Date,
      select: false
    }
  },
  {
    timestamps: true
  }
);

const User = mongoose.model<IUser>('User', userSchema);

export default User;
