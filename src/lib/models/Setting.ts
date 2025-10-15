import mongoose, { Schema, Model } from 'mongoose';

export interface ISetting {
  key: string;
  year: number;
  value: string;
}

const SettingSchema = new Schema<ISetting>({
  key: { type: String, required: true },
  year: { type: Number, required: true },
  value: { type: String, required: true },
}, {
  timestamps: true,
});

// Create compound index for key and year combination
SettingSchema.index({ key: 1, year: 1 }, { unique: true });

export const Setting: Model<ISetting> = mongoose.models.Setting || mongoose.model<ISetting>('Setting', SettingSchema);

