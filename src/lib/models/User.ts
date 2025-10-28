import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUser extends Document {
  email: string;
  password?: string; // Optional for OAuth users
  name?: string;
  image?: string;
  provider: 'local' | 'google';
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      // Not required for OAuth users
    },
    name: {
      type: String,
      trim: true,
    },
    image: {
      type: String,
    },
    provider: {
      type: String,
      enum: ['local', 'google'],
      default: 'local',
    },
  },
  {
    timestamps: true,
  }
);

// Prevent model recompilation in development
export const User: Model<IUser> =
  (mongoose.models?.User as Model<IUser>) || mongoose.model<IUser>('User', UserSchema);

