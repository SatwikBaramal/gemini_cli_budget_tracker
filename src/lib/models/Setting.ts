import mongoose, { Schema, Model } from 'mongoose';

export interface ISetting {
  key: string;
  value: string;
}

const SettingSchema = new Schema<ISetting>({
  key: { type: String, required: true, unique: true },
  value: { type: String, required: true },
}, {
  timestamps: true,
});

export const Setting: Model<ISetting> = mongoose.models.Setting || mongoose.model<ISetting>('Setting', SettingSchema);

