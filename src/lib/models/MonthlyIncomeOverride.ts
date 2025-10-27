import mongoose, { Schema, Model } from 'mongoose';

export interface IMonthlyIncomeOverride {
  month: number;
  year: number;
  overrideAmount: number;
  date: string;
}

const MonthlyIncomeOverrideSchema = new Schema<IMonthlyIncomeOverride>({
  month: { type: Number, required: true, min: 1, max: 12 },
  year: { type: Number, required: true },
  overrideAmount: { type: Number, required: true },
  date: { type: String, required: true },
}, {
  timestamps: true,
});

// Create compound index for month and year combination (unique)
MonthlyIncomeOverrideSchema.index({ month: 1, year: 1 }, { unique: true });

export const MonthlyIncomeOverride: Model<IMonthlyIncomeOverride> = mongoose.models.MonthlyIncomeOverride || mongoose.model<IMonthlyIncomeOverride>('MonthlyIncomeOverride', MonthlyIncomeOverrideSchema);

