import mongoose, { Schema, Model } from 'mongoose';

export interface ISetting {
  key: string;
  year: number;
  value: string;
  userId: string;
}

const SettingSchema = new Schema<ISetting>({
  key: { type: String, required: true },
  year: { type: Number, required: true },
  value: { type: String, required: true },
  userId: { type: String, required: true, index: true },
}, {
  timestamps: true,
});

// Create compound index for userId, key and year combination (unique per user)
SettingSchema.index({ userId: 1, key: 1, year: 1 }, { unique: true });

export const Setting: Model<ISetting> = (mongoose.models?.Setting as Model<ISetting>) || mongoose.model<ISetting>('Setting', SettingSchema);

