import mongoose, { Schema, Model } from 'mongoose';

export interface IFixedExpense {
  name: string;
  amount: string; // Encrypted value stored as string
  applicableMonths: number[];
  year: number;
  userId: string;
}

const FixedExpenseSchema = new Schema<IFixedExpense>({
  name: { type: String, required: true },
  amount: { type: String, required: true }, // Store encrypted string
  applicableMonths: { type: [Number], required: true },
  year: { type: Number, required: true },
  userId: { type: String, required: true, index: true },
}, {
  timestamps: true,
});

// Create index for userId and year
FixedExpenseSchema.index({ userId: 1, year: 1 });

export const FixedExpense: Model<IFixedExpense> = (mongoose.models?.FixedExpense as Model<IFixedExpense>) || mongoose.model<IFixedExpense>('FixedExpense', FixedExpenseSchema);

