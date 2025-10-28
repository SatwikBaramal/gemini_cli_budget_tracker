import mongoose, { Schema, Model } from 'mongoose';

export interface IMonthlyIncomeOverride {
  month: number;
  year: number;
  overrideAmount: number;
  date: string;
  userId: string;
}

const MonthlyIncomeOverrideSchema = new Schema<IMonthlyIncomeOverride>({
  month: { type: Number, required: true, min: 1, max: 12 },
  year: { type: Number, required: true },
  overrideAmount: { type: Number, required: true },
  date: { type: String, required: true },
  userId: { type: String, required: true, index: true },
}, {
  timestamps: true,
});

// Create compound index for userId, month and year combination (unique per user)
MonthlyIncomeOverrideSchema.index({ userId: 1, month: 1, year: 1 }, { unique: true });

export const MonthlyIncomeOverride: Model<IMonthlyIncomeOverride> = (mongoose.models?.MonthlyIncomeOverride as Model<IMonthlyIncomeOverride>) || mongoose.model<IMonthlyIncomeOverride>('MonthlyIncomeOverride', MonthlyIncomeOverrideSchema);

