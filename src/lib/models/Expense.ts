import mongoose, { Schema, Model } from 'mongoose';

export interface IExpense {
  name: string;
  amount: number;
  type: 'yearly' | 'monthly';
  month?: number;
  date?: string;
  year: number;
  userId: string;
}

const ExpenseSchema = new Schema<IExpense>({
  name: { type: String, required: true },
  amount: { type: Number, required: true },
  type: { type: String, required: true, default: 'yearly', enum: ['yearly', 'monthly'] },
  month: { type: Number, min: 1, max: 12 },
  date: { type: String },
  year: { type: Number, required: true, default: 2025 },
  userId: { type: String, required: true, index: true },
}, {
  timestamps: true,
});

// Create indexes for better performance
ExpenseSchema.index({ userId: 1, year: 1, type: 1 });
ExpenseSchema.index({ userId: 1, month: 1 });

export const Expense: Model<IExpense> = (mongoose.models?.Expense as Model<IExpense>) || mongoose.model<IExpense>('Expense', ExpenseSchema);

